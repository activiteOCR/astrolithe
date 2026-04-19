// =============================================
// TESTIMONIALS MODULE - Public display & submission
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    loadTestimonials();
    setupTestimonialForm();
});

async function loadTestimonials() {
    const grid = document.getElementById('testimonials-grid');
    if (!grid) return;

    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
        grid.innerHTML = '';
        return;
    }

    try {
        const { data: testimonials, error } = await window.supabaseClient
            .from('testimonials')
            .select('*')
            .eq('approved', true)
            .order('created_at', { ascending: false });

        if (error) throw error;

        if (!testimonials || testimonials.length === 0) {
            grid.innerHTML = '<p class="testimonials-empty">Les premiers témoignages apparaîtront ici.</p>';
            return;
        }

        grid.innerHTML = testimonials.map(t => `
            <div class="testimonial-card">
                <p class="testimonial-content">"${escapeHtml(t.content)}"</p>
                <p class="testimonial-author">— ${escapeHtml(t.name)}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Erreur chargement témoignages:', error);
        grid.innerHTML = '';
    }
}

function setupTestimonialForm() {
    const form = document.getElementById('testimonial-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        const msgEl = document.getElementById('testimonial-message');
        const name = document.getElementById('testimonial-name').value.trim();
        const content = document.getElementById('testimonial-content').value.trim();

        submitBtn.textContent = 'Envoi en cours...';
        submitBtn.disabled = true;
        msgEl.style.display = 'none';

        try {
            const { error } = await window.supabaseClient
                .from('testimonials')
                .insert({ name, content });

            if (error) throw error;

            msgEl.textContent = 'Merci pour ton partage ! Il sera visible après validation.';
            msgEl.className = 'form-message form-message-success';
            msgEl.style.display = 'block';
            form.reset();

        } catch (error) {
            console.error('Erreur envoi témoignage:', error);
            msgEl.textContent = 'Une erreur est survenue. Veuillez réessayer.';
            msgEl.className = 'form-message form-message-error';
            msgEl.style.display = 'block';
        } finally {
            submitBtn.textContent = 'Envoyer mon ressenti';
            submitBtn.disabled = false;
        }
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
