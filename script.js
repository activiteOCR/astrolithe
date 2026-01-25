// =============================================
// ASTROLITHE SON ET ASTRES - JavaScript
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
            document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
        });
    }

    // Close mobile menu when clicking a link
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            document.body.style.overflow = '';
        });
    });

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerOffset = 80;
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe activity cards and info items
    document.querySelectorAll('.activity-card, .activity-card-detailed, .info-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add animate-in styles
    const style = document.createElement('style');
    style.textContent = `
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Form submission handling
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Envoi en cours...';
            submitBtn.disabled = true;

            // Collect form data
            const formData = new FormData(contactForm);

            try {
                // Check if form action is set up (Formspree or similar)
                const action = contactForm.getAttribute('action');

                if (action && !action.includes('YOUR_FORM_ID')) {
                    const response = await fetch(action, {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'Accept': 'application/json'
                        }
                    });

                    if (response.ok) {
                        showFormMessage('Merci pour ton message ! Je te répondrai bientôt.', 'success');
                        contactForm.reset();
                    } else {
                        throw new Error('Erreur lors de l\'envoi');
                    }
                } else {
                    // Fallback: create mailto link
                    const name = formData.get('name');
                    const email = formData.get('email');
                    const message = formData.get('message');

                    const mailtoLink = `mailto:sonetastres@gmail.com?subject=Message de ${name}&body=${encodeURIComponent(`De: ${name}\nEmail: ${email}\n\n${message}`)}`;
                    window.location.href = mailtoLink;

                    showFormMessage('Redirection vers ton application mail...', 'success');
                }
            } catch (error) {
                showFormMessage('Une erreur est survenue. Tu peux m\'écrire directement à sonetastres@gmail.com', 'error');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    function showFormMessage(message, type) {
        // Remove any existing message
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageEl = document.createElement('div');
        messageEl.className = `form-message form-message-${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            padding: 1rem;
            margin-top: 1rem;
            border-radius: 4px;
            text-align: center;
            background: ${type === 'success' ? 'rgba(124, 156, 168, 0.2)' : 'rgba(168, 124, 124, 0.2)'};
            border: 1px solid ${type === 'success' ? 'rgba(124, 156, 168, 0.5)' : 'rgba(168, 124, 124, 0.5)'};
            color: ${type === 'success' ? '#7c9ca8' : '#a87c7c'};
        `;

        contactForm.appendChild(messageEl);

        // Remove message after 5 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 5000);
    }
});
