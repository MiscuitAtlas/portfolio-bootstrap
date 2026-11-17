'use strict';

/**
 * Charge les morceaux de page communs (barre de navigation, pied de page)
 * déclarés avec l'attribut data-partial="chemin/vers/fichier.html".
 * Nécessite un serveur (GitHub Pages, Live Server, python -m http.server) :
 * fetch() ne fonctionne pas sur une page ouverte en file://.
 */
async function loadPartials() {
    const slots = document.querySelectorAll('[data-partial]');
    await Promise.all(Array.from(slots).map(async (slot) => {
        try {
            const response = await fetch(slot.dataset.partial);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            slot.innerHTML = await response.text();
        } catch (error) {
            console.error(`Impossible de charger ${slot.dataset.partial} :`, error);
        }
    }));
}

/** Souligne le lien de la page courante dans la barre de navigation. */
function markActiveLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-navbar .nav-link').forEach((link) => {
        if (link.getAttribute('href') === page) {
            link.classList.add('active');
            link.setAttribute('aria-current', 'page');
        }
    });
}

/** Met l'année courante dans le pied de page. */
function setCurrentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-year]').forEach((element) => {
        element.textContent = year;
    });
}

/** Active les infobulles Bootstrap (compétences). */
function initTooltips() {
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach((element) => {
        bootstrap.Tooltip.getOrCreateInstance(element);
    });
}

/** Ouvre directement un onglet de l'accueil depuis l'URL (ex. index.html#projets). */
function openTabFromHash() {
    const target = window.location.hash;
    if (!target) {
        return;
    }
    const trigger = document.querySelector(`[data-bs-toggle="tab"][data-bs-target="${CSS.escape(target)}"]`);
    if (trigger) {
        bootstrap.Tab.getOrCreateInstance(trigger).show();
        trigger.scrollIntoView({ block: 'start' });
    }
}

/**
 * Galerie de captures d'écran : chaque bouton [data-gallery] contient une liste JSON
 * de { "src": "...", "alt": "..." }. Les images sont créées avec createElement
 * (pas d'innerHTML) pour ne jamais interpréter ces données comme du HTML.
 */
function initGallery() {
    const modalElement = document.getElementById('galleryModal');
    if (!modalElement) {
        return;
    }
    const carouselElement = document.getElementById('galleryCarousel');
    const inner = carouselElement.querySelector('.carousel-inner');
    const title = document.getElementById('galleryTitle');
    const caption = document.getElementById('galleryCaption');
    const controls = carouselElement.querySelectorAll('.carousel-control-prev, .carousel-control-next');
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
    let images = [];

    const updateCaption = (index) => {
        const image = images[index];
        caption.textContent = image ? `${image.alt} (${index + 1}/${images.length})` : '';
    };

    carouselElement.addEventListener('slid.bs.carousel', (event) => updateCaption(event.to));

    document.querySelectorAll('[data-gallery]').forEach((button) => {
        button.addEventListener('click', () => {
            try {
                images = JSON.parse(button.dataset.gallery);
            } catch (error) {
                console.error('Galerie mal formée :', error);
                return;
            }

            inner.replaceChildren(...images.map((image, index) => {
                const item = document.createElement('div');
                item.className = index === 0 ? 'carousel-item active' : 'carousel-item';
                const img = document.createElement('img');
                img.src = image.src;
                img.alt = image.alt;
                img.className = 'd-block';
                item.appendChild(img);
                return item;
            }));

            controls.forEach((control) => control.classList.toggle('d-none', images.length < 2));
            title.textContent = button.dataset.galleryTitle || 'Captures d’écran';
            bootstrap.Carousel.getOrCreateInstance(carouselElement, { interval: false, ride: false }).to(0);
            updateCaption(0);
            modal.show(button);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadPartials();
    markActiveLink();
    setCurrentYear();
    if (window.bootstrap) {
        initTooltips();
        initGallery();
        openTabFromHash();
    }
});
