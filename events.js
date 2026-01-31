// =============================================
// EVENTS MODULE - Public events display & registration
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Check if Supabase is configured
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
        showEventsPlaceholder();
        return;
    }

    loadEvents();
    setupRegistrationModal();
});

// Affiche un message si Supabase n'est pas configuré
function showEventsPlaceholder() {
    const eventsGrid = document.getElementById('events-grid');
    if (eventsGrid) {
        eventsGrid.innerHTML = `
            <div class="events-placeholder">
                <p>Les événements seront bientôt disponibles.</p>
                <p>En attendant, n'hésitez pas à me <a href="#contact">contacter</a> pour connaître les prochaines dates.</p>
            </div>
        `;
    }
}

// Charge et affiche les événements à venir
async function loadEvents() {
    const eventsGrid = document.getElementById('events-grid');
    if (!eventsGrid) return;

    eventsGrid.innerHTML = '<div class="events-loading"><div class="loading-spinner"></div><p>Chargement des événements...</p></div>';

    try {
        const { data: events, error } = await window.supabaseClient
            .from('events_with_counts')
            .select('*')
            .gte('event_date', new Date().toISOString().split('T')[0])
            .order('event_date', { ascending: true })
            .order('event_time', { ascending: true });

        if (error) throw error;

        if (!events || events.length === 0) {
            eventsGrid.innerHTML = `
                <div class="events-placeholder">
                    <p>Aucun événement prévu pour le moment.</p>
                    <p>Revenez bientôt ou <a href="#contact">contactez-moi</a> pour être informé des prochaines dates.</p>
                </div>
            `;
            return;
        }

        eventsGrid.innerHTML = events.map(event => createEventCard(event)).join('');

        // Add animation observers for new cards
        eventsGrid.querySelectorAll('.event-card').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('animate-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(el);
        });

    } catch (error) {
        console.error('Erreur lors du chargement des événements:', error);
        eventsGrid.innerHTML = `
            <div class="events-placeholder events-error">
                <p>Impossible de charger les événements.</p>
                <p>Veuillez <a href="#contact">me contacter</a> directement.</p>
            </div>
        `;
    }
}

// Crée une carte d'événement
function createEventCard(event) {
    const date = new Date(event.event_date);
    const dayName = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    const dayNumber = date.getDate();
    const monthName = date.toLocaleDateString('fr-FR', { month: 'long' });
    const year = date.getFullYear();

    const timeFormatted = event.event_time.slice(0, 5);
    const spotsRemaining = event.spots_remaining;
    const isFull = spotsRemaining <= 0;

    const priceText = event.min_price > 0
        ? `À partir de ${event.min_price}€`
        : 'Participation libre';

    return `
        <article class="event-card ${isFull ? 'event-full' : ''}">
            <div class="event-date-badge">
                <span class="event-day">${dayNumber}</span>
                <span class="event-month">${monthName}</span>
            </div>
            <div class="event-content">
                <h3>${escapeHtml(event.title)}</h3>
                <div class="event-meta">
                    <span class="event-time">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                        ${timeFormatted}
                    </span>
                    <span class="event-location">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${escapeHtml(event.location)}
                    </span>
                </div>
                ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ''}
                <div class="event-footer">
                    <span class="event-price">${priceText}</span>
                    <span class="event-spots ${isFull ? 'spots-full' : spotsRemaining <= 2 ? 'spots-low' : ''}">
                        ${isFull ? 'Complet' : `${spotsRemaining} place${spotsRemaining > 1 ? 's' : ''} restante${spotsRemaining > 1 ? 's' : ''}`}
                    </span>
                </div>
                <button
                    class="btn btn-primary btn-register"
                    ${isFull ? 'disabled' : ''}
                    onclick="openRegistrationModal('${event.id}', '${escapeJsString(event.title)}', '${dayNumber} ${monthName} ${year}', '${timeFormatted}')"
                >
                    ${isFull ? 'Complet' : "S'inscrire"}
                </button>
            </div>
        </article>
    `;
}

// Configure la modal d'inscription
function setupRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    // Fermer avec le bouton X
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRegistrationModal);
    }

    // Fermer en cliquant à l'extérieur
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeRegistrationModal();
        }
    });

    // Fermer avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeRegistrationModal();
        }
    });

    // Gestion du formulaire
    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', handleRegistrationSubmit);
    }
}

// Ouvre la modal d'inscription
function openRegistrationModal(eventId, eventTitle, eventDate, eventTime) {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    // Remplir les informations de l'événement
    document.getElementById('modal-event-title').textContent = eventTitle;
    document.getElementById('modal-event-date').textContent = `${eventDate} à ${eventTime}`;
    document.getElementById('registration-event-id').value = eventId;

    // Réinitialiser le formulaire
    document.getElementById('registration-form').reset();
    document.getElementById('registration-event-id').value = eventId;

    // Cacher les messages d'erreur/succès
    hideRegistrationMessages();

    // Afficher la modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus sur le premier champ
    setTimeout(() => {
        document.getElementById('reg-name').focus();
    }, 100);
}

// Ferme la modal d'inscription
function closeRegistrationModal() {
    const modal = document.getElementById('registration-modal');
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Gère la soumission du formulaire d'inscription
async function handleRegistrationSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    submitBtn.textContent = 'Inscription en cours...';
    submitBtn.disabled = true;

    hideRegistrationMessages();

    const eventId = document.getElementById('registration-event-id').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const message = document.getElementById('reg-message').value.trim();

    try {
        // Vérifier s'il reste des places
        const { data: event, error: eventError } = await window.supabaseClient
            .from('events_with_counts')
            .select('spots_remaining, title')
            .eq('id', eventId)
            .single();

        if (eventError) throw eventError;

        if (event.spots_remaining <= 0) {
            showRegistrationError("Désolé, cet événement est maintenant complet.");
            return;
        }

        // Vérifier si l'email n'est pas déjà inscrit
        const { data: existingReg, error: checkError } = await window.supabaseClient
            .from('registrations')
            .select('id')
            .eq('event_id', eventId)
            .eq('email', email)
            .single();

        if (existingReg) {
            showRegistrationError("Cette adresse email est déjà inscrite pour cet événement.");
            return;
        }

        // Créer l'inscription
        const { error: insertError } = await window.supabaseClient
            .from('registrations')
            .insert({
                event_id: eventId,
                name: name,
                email: email,
                phone: phone || null,
                message: message || null
            });

        if (insertError) {
            if (insertError.code === '23505') {
                showRegistrationError("Cette adresse email est déjà inscrite pour cet événement.");
            } else {
                throw insertError;
            }
            return;
        }

        // Succès
        showRegistrationSuccess(`Merci ${name} ! Ton inscription à "${event.title}" est confirmée. Tu recevras bientôt un email avec les détails.`);
        form.reset();

        // Recharger les événements après un délai
        setTimeout(() => {
            loadEvents();
        }, 2000);

    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        showRegistrationError("Une erreur est survenue. Veuillez réessayer ou me contacter directement.");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Affiche un message d'erreur dans la modal
function showRegistrationError(message) {
    const errorEl = document.getElementById('registration-error');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
    }
}

// Affiche un message de succès dans la modal
function showRegistrationSuccess(message) {
    const successEl = document.getElementById('registration-success');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
    }

    // Cacher le formulaire
    const form = document.getElementById('registration-form');
    if (form) {
        form.style.display = 'none';
    }

    // Ajouter un bouton pour fermer
    setTimeout(() => {
        closeRegistrationModal();
        if (form) form.style.display = 'block';
    }, 4000);
}

// Cache les messages d'erreur/succès
function hideRegistrationMessages() {
    const errorEl = document.getElementById('registration-error');
    const successEl = document.getElementById('registration-success');
    if (errorEl) errorEl.style.display = 'none';
    if (successEl) successEl.style.display = 'none';

    const form = document.getElementById('registration-form');
    if (form) form.style.display = 'block';
}

// Utilitaire pour échapper le HTML
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

// Export des fonctions globales
window.openRegistrationModal = openRegistrationModal;
window.closeRegistrationModal = closeRegistrationModal;
window.loadEvents = loadEvents;
