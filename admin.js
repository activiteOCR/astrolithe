// =============================================
// ADMIN MODULE - Event & Registration Management
// =============================================

let currentUser = null;
let confirmCallback = null;

document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is configured
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
        showLoginError('Supabase n\'est pas configuré. Veuillez configurer supabase-config.js');
        return;
    }

    // Check for existing session
    checkSession();

    // Setup event listeners
    setupLoginForm();
    setupLogoutButton();
    setupTabs();
    setupEventForm();
    setupEventFilter();
});

// =============================================
// AUTHENTICATION
// =============================================

async function checkSession() {
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();

        if (error) throw error;

        if (session) {
            currentUser = session.user;
            showDashboard();
        }
    } catch (error) {
        console.error('Session check error:', error);
    }
}

function setupLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = form.querySelector('button[type="submit"]');

        submitBtn.textContent = 'Connexion...';
        submitBtn.disabled = true;
        hideLoginError();

        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            currentUser = data.user;
            showDashboard();

        } catch (error) {
            console.error('Login error:', error);
            showLoginError(error.message === 'Invalid login credentials'
                ? 'Email ou mot de passe incorrect'
                : 'Erreur de connexion. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = 'Se connecter';
            submitBtn.disabled = false;
        }
    });
}

function setupLogoutButton() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            await window.supabaseClient.auth.signOut();
            currentUser = null;
            showLoginScreen();
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

function showLoginScreen() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('admin-dashboard').style.display = 'none';
    document.getElementById('login-form').reset();
}

function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';

    if (currentUser) {
        document.getElementById('admin-user-email').textContent = currentUser.email;
    }

    loadAdminEvents();
    loadRegistrations();
}

function showLoginError(message) {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

function hideLoginError() {
    const errorEl = document.getElementById('login-error');
    if (errorEl) {
        errorEl.style.display = 'none';
    }
}

// =============================================
// TABS
// =============================================

function setupTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;

            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Show corresponding content
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// =============================================
// EVENTS MANAGEMENT
// =============================================

async function loadAdminEvents() {
    const listEl = document.getElementById('events-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="admin-list-empty">Chargement...</div>';

    try {
        const { data: events, error } = await window.supabaseClient
            .from('events')
            .select('*, registrations(count)')
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true });

        if (error) throw error;

        if (!events || events.length === 0) {
            listEl.innerHTML = '<div class="admin-list-empty">Aucun événement. Cliquez sur "Nouvel événement" pour en créer un.</div>';
            return;
        }

        listEl.innerHTML = events.map(event => createAdminEventCard(event)).join('');

        // Also update the event filter dropdown
        updateEventFilter(events);

    } catch (error) {
        console.error('Error loading events:', error);
        listEl.innerHTML = '<div class="admin-list-empty">Erreur lors du chargement des événements.</div>';
    }
}

function createAdminEventCard(event) {
    const date = new Date(event.event_date);
    const dateFormatted = date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const timeFormatted = event.event_time.slice(0, 5);

    const registrationCount = event.registrations?.[0]?.count || 0;
    const spotsRemaining = event.max_participants - registrationCount;
    const isFull = spotsRemaining <= 0;
    const isPast = new Date(event.event_date) < new Date().setHours(0, 0, 0, 0);

    return `
        <div class="admin-card ${!event.is_active ? 'inactive' : ''}">
            <div class="admin-card-content">
                <h3>
                    ${escapeHtml(event.title)}
                    ${!event.is_active ? '<span class="status-badge status-inactive">Inactif</span>' : ''}
                    ${isPast ? '<span class="status-badge status-inactive">Passé</span>' : ''}
                </h3>
                <div class="admin-card-meta">
                    <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="4" width="18" height="18" rx="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        ${dateFormatted}
                    </span>
                    <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        ${timeFormatted}
                    </span>
                    <span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${escapeHtml(event.location)}
                    </span>
                </div>
                ${event.description ? `<p class="admin-card-description">${escapeHtml(event.description)}</p>` : ''}
                <div class="admin-card-stats">
                    <span class="${isFull ? 'stat-full' : ''}">
                        ${registrationCount}/${event.max_participants} inscrits
                        ${isFull ? '(Complet)' : `(${spotsRemaining} places restantes)`}
                    </span>
                    <span>Prix min: ${event.min_price > 0 ? event.min_price + '€' : 'Libre'}</span>
                </div>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-secondary btn-small" onclick="editEvent('${event.id}')">Modifier</button>
                <button class="btn btn-danger btn-small" onclick="confirmDeleteEvent('${event.id}', '${escapeJsString(event.title)}')">Supprimer</button>
            </div>
        </div>
    `;
}

function setupEventForm() {
    const newBtn = document.getElementById('new-event-btn');
    if (newBtn) {
        newBtn.addEventListener('click', () => openEventModal());
    }

    const form = document.getElementById('event-form');
    if (form) {
        form.addEventListener('submit', handleEventSubmit);
    }

    // Modal close
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.querySelector('.modal-close').addEventListener('click', closeEventModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeEventModal();
        });
    }
}

function openEventModal(event = null) {
    const modal = document.getElementById('event-modal');
    const form = document.getElementById('event-form');
    const title = document.getElementById('event-modal-title');

    if (!modal || !form) return;

    form.reset();
    document.getElementById('event-form-error').style.display = 'none';

    if (event) {
        title.textContent = 'Modifier l\'événement';
        document.getElementById('event-id').value = event.id;
        document.getElementById('event-title').value = event.title;
        document.getElementById('event-date').value = event.event_date;
        document.getElementById('event-time').value = event.event_time;
        document.getElementById('event-location').value = event.location || 'Saint-Zacharie';
        document.getElementById('event-max').value = event.max_participants;
        document.getElementById('event-price').value = event.min_price || 0;
        document.getElementById('event-active').checked = event.is_active;
        document.getElementById('event-description').value = event.description || '';
    } else {
        title.textContent = 'Nouvel événement';
        document.getElementById('event-id').value = '';
        document.getElementById('event-active').checked = true;
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeEventModal() {
    const modal = document.getElementById('event-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function editEvent(eventId) {
    try {
        const { data: event, error } = await window.supabaseClient
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();

        if (error) throw error;

        openEventModal(event);
    } catch (error) {
        console.error('Error fetching event:', error);
        alert('Erreur lors du chargement de l\'événement');
    }
}

async function handleEventSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = document.getElementById('event-form-error');

    submitBtn.textContent = 'Enregistrement...';
    submitBtn.disabled = true;
    errorEl.style.display = 'none';

    const eventId = document.getElementById('event-id').value;
    const eventData = {
        title: document.getElementById('event-title').value.trim(),
        event_date: document.getElementById('event-date').value,
        event_time: document.getElementById('event-time').value,
        location: document.getElementById('event-location').value.trim() || 'Saint-Zacharie',
        max_participants: parseInt(document.getElementById('event-max').value),
        min_price: parseFloat(document.getElementById('event-price').value) || 0,
        is_active: document.getElementById('event-active').checked,
        description: document.getElementById('event-description').value.trim() || null
    };

    try {
        let error;

        if (eventId) {
            // Update
            const result = await window.supabaseClient
                .from('events')
                .update(eventData)
                .eq('id', eventId);
            error = result.error;
        } else {
            // Insert
            const result = await window.supabaseClient
                .from('events')
                .insert(eventData);
            error = result.error;
        }

        if (error) throw error;

        closeEventModal();
        loadAdminEvents();

    } catch (error) {
        console.error('Error saving event:', error);
        errorEl.textContent = 'Erreur lors de l\'enregistrement. Veuillez réessayer.';
        errorEl.style.display = 'block';
    } finally {
        submitBtn.textContent = 'Enregistrer';
        submitBtn.disabled = false;
    }
}

function confirmDeleteEvent(eventId, eventTitle) {
    openConfirmModal(
        'Supprimer l\'événement',
        `Êtes-vous sûr de vouloir supprimer "${eventTitle}" ? Cette action supprimera également toutes les inscriptions associées.`,
        async () => {
            try {
                const { error } = await window.supabaseClient
                    .from('events')
                    .delete()
                    .eq('id', eventId);

                if (error) throw error;

                loadAdminEvents();
                loadRegistrations();
            } catch (error) {
                console.error('Error deleting event:', error);
                alert('Erreur lors de la suppression');
            }
        }
    );
}

// =============================================
// REGISTRATIONS MANAGEMENT
// =============================================

function setupEventFilter() {
    const filter = document.getElementById('event-filter');
    if (filter) {
        filter.addEventListener('change', () => {
            loadRegistrations(filter.value || null);
        });
    }
}

function updateEventFilter(events) {
    const filter = document.getElementById('event-filter');
    if (!filter) return;

    const currentValue = filter.value;

    filter.innerHTML = '<option value="">Tous les événements</option>';

    events.forEach(event => {
        const date = new Date(event.event_date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short'
        });
        const option = document.createElement('option');
        option.value = event.id;
        option.textContent = `${event.title} (${date})`;
        filter.appendChild(option);
    });

    // Restore selection
    if (currentValue) {
        filter.value = currentValue;
    }
}

async function loadRegistrations(eventId = null) {
    const listEl = document.getElementById('registrations-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="admin-list-empty">Chargement...</div>';

    try {
        let query = window.supabaseClient
            .from('registrations')
            .select('*, events(title, event_date)')
            .order('created_at', { ascending: false });

        if (eventId) {
            query = query.eq('event_id', eventId);
        }

        const { data: registrations, error } = await query;

        if (error) throw error;

        if (!registrations || registrations.length === 0) {
            listEl.innerHTML = '<div class="admin-list-empty">Aucune inscription.</div>';
            return;
        }

        listEl.innerHTML = registrations.map(reg => createRegistrationCard(reg)).join('');

    } catch (error) {
        console.error('Error loading registrations:', error);
        listEl.innerHTML = '<div class="admin-list-empty">Erreur lors du chargement des inscriptions.</div>';
    }
}

function createRegistrationCard(registration) {
    const createdAt = new Date(registration.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const eventDate = registration.events?.event_date
        ? new Date(registration.events.event_date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long'
        })
        : '';

    return `
        <div class="admin-card registration-card">
            <div class="registration-info">
                <strong>${escapeHtml(registration.name)}</strong>
                <p>${escapeHtml(registration.email)}</p>
                ${registration.phone ? `<p>${escapeHtml(registration.phone)}</p>` : ''}
                ${registration.message ? `<p><em>"${escapeHtml(registration.message)}"</em></p>` : ''}
                <p class="registration-event">
                    ${registration.events?.title ? `${escapeHtml(registration.events.title)} - ${eventDate}` : 'Événement inconnu'}
                </p>
                <p style="font-size: 0.8rem; color: var(--color-text-muted);">Inscrit le ${createdAt}</p>
            </div>
            <div class="admin-card-actions">
                <button class="btn btn-danger btn-small" onclick="confirmDeleteRegistration('${registration.id}', '${escapeJsString(registration.name)}')">Supprimer</button>
            </div>
        </div>
    `;
}

function confirmDeleteRegistration(regId, name) {
    openConfirmModal(
        'Supprimer l\'inscription',
        `Êtes-vous sûr de vouloir supprimer l'inscription de "${name}" ?`,
        async () => {
            try {
                const { error } = await window.supabaseClient
                    .from('registrations')
                    .delete()
                    .eq('id', regId);

                if (error) throw error;

                loadRegistrations(document.getElementById('event-filter')?.value || null);
                loadAdminEvents();
            } catch (error) {
                console.error('Error deleting registration:', error);
                alert('Erreur lors de la suppression');
            }
        }
    );
}

// =============================================
// CONFIRMATION MODAL
// =============================================

function openConfirmModal(title, message, callback) {
    const modal = document.getElementById('confirm-modal');
    if (!modal) return;

    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;

    confirmCallback = callback;

    const actionBtn = document.getElementById('confirm-action-btn');
    actionBtn.onclick = async () => {
        if (confirmCallback) {
            await confirmCallback();
        }
        closeConfirmModal();
    };

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    confirmCallback = null;
}

// Close modals with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeEventModal();
        closeConfirmModal();
    }
});

// =============================================
// UTILITIES
// =============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utilitaire pour échapper les chaînes JavaScript (pour les attributs onclick)
function escapeJsString(text) {
    if (!text) return '';
    return text.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

// Export global functions
window.editEvent = editEvent;
window.confirmDeleteEvent = confirmDeleteEvent;
window.confirmDeleteRegistration = confirmDeleteRegistration;
window.closeEventModal = closeEventModal;
window.closeConfirmModal = closeConfirmModal;
