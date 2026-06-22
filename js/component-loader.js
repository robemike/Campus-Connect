function loadComponent(id, file) {
    fetch(file)
    .then(response => response.text())
    .then(data => {
        document.getElementById(id).innerHTML = data;
    });
}

loadComponent('navbar-container', 'components/navbar.html');
loadComponent('hero-container', 'components/hero.html');
loadComponent('features-container', 'components/features.html');
loadComponent('marketplace-container', 'components/marketplace-preview.html');
loadComponent('happening-container', 'components/happening.html');
loadComponent('happening-container', 'components/happening.html');
loadComponent('footer-container', 'components/footer.html');
loadComponent('events-hero-container', 'components/events-hero-section.html');
loadComponent('events-catalog-container', 'components/events-catalog.html');