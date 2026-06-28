/* ==============================================
   CampusConnect — Component Loader
   ============================================== */

function loadComponent(containerId, file, callback) {
    const container = document.getElementById(containerId);
    if (!container) return Promise.resolve();

    return fetch(file)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status} loading ${file}`);
            return r.text();
        })
        .then(html => {
            container.innerHTML = html;
            if (typeof callback === 'function') callback();
        })
        .catch(err => {
            console.error(`Failed to load ${file}:`, err);
            container.innerHTML = `<div class="p-4 text-center text-muted small">Could not load section.</div>`;
        });
}

const Components = {
    async loadShell() {
        await loadComponent('navbar-container', 'components/navbar.html', () => {
            if (typeof updateNavbarForUser === 'function') updateNavbarForUser();
            if (typeof markActiveNavLink === 'function') markActiveNavLink();
        });
        await loadComponent('footer-container', 'components/footer.html');
    },

    async loadHome() {
        await Promise.all([
            loadComponent('hero-container',        'components/hero.html'),
            loadComponent('features-container',    'components/features.html'),
            loadComponent('marketplace-container', 'components/marketplace-preview.html',
                () => typeof initHomeMarketplacePreview === 'function' && initHomeMarketplacePreview()),
            loadComponent('happening-container',   'components/happening.html'),
        ]);
    },

    async loadEvents() {
        await loadComponent('events-hero-container', 'components/events-hero-section.html');
        await loadComponent('events-catalog-container', 'components/events-catalog.html');
    },

    async loadMarketplace() {
        await loadComponent('marketplace-hero-container', 'components/marketplace-hero-section.html');
    },

    async loadClubs() {
        await loadComponent('clubs-hero-container', 'components/clubs-hero-section.html');
        await loadComponent('clubs-catalog-container-wrapper', 'components/clubs-catalog.html');
    },
};
