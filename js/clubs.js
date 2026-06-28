/* ==============================================================
   CampusConnect — Clubs Page (clubs.js)
   ============================================================== */

const ClubsStore = {
    _cache: null,
    async getAll(forceRefresh = false) {
        if (this._cache && !forceRefresh) return this._cache;
        try {
            const res = await fetch('data/clubs.json');
            if (res.ok) this._cache = await res.json();
        } catch (e) {
            console.error('Could not load clubs.json', e);
            this._cache = [];
        }
        return this._cache || [];
    }
};

async function initClubsPage() {
    const container = document.getElementById('clubs-catalog-container');
    if (!container) return;

    let clubs = await ClubsStore.getAll(true);
    let currentFilter = 'All';
    let searchQuery = '';

    // Wire up filter pills
    document.querySelectorAll('#clubs-filter-pills .filter-pill').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('#clubs-filter-pills .filter-pill').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            const sel = document.getElementById('clubs-category-select');
            if (sel) sel.value = currentFilter === 'All' ? 'All' : currentFilter;
            renderClubs();
        });
    });

    // Wire up category select
    const catSelect = document.getElementById('clubs-category-select');
    if (catSelect) {
        catSelect.addEventListener('change', function () {
            currentFilter = this.value;
            document.querySelectorAll('#clubs-filter-pills .filter-pill').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === currentFilter);
            });
            renderClubs();
        });
    }

    // Wire up hero search
    const heroSearch = document.querySelector('.clubs-hero-section input[type="text"]');
    const heroSearchBtn = document.querySelector('.clubs-hero-section .btn-search-action');
    if (heroSearch && heroSearchBtn) {
        heroSearchBtn.addEventListener('click', () => {
            searchQuery = heroSearch.value.trim().toLowerCase();
            renderClubs();
            document.querySelector('.clubs-catalog-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        heroSearch.addEventListener('keydown', e => {
            if (e.key === 'Enter') heroSearchBtn.click();
        });
    }

    function getCategoryColor(category) {
        const map = {
            'Technology': { bg: '#eff6ff', color: '#1d4ed8', icon: 'bi-cpu' },
            'Business':   { bg: '#fef3c7', color: '#92400e', icon: 'bi-briefcase' },
            'Arts':       { bg: '#fdf2f8', color: '#9d174d', icon: 'bi-palette' },
            'Leadership': { bg: '#f3e8ff', color: '#6d28d9', icon: 'bi-star' },
            'Social Impact': { bg: '#ecfdf5', color: '#065f46', icon: 'bi-heart' },
            'Wellness':   { bg: '#fff1f2', color: '#be123c', icon: 'bi-emoji-smile' },
            'Sports':     { bg: '#fff7ed', color: '#9a3412', icon: 'bi-trophy' },
        };
        return map[category] || { bg: '#f1f5f9', color: '#475569', icon: 'bi-people' };
    }

    function renderClubs() {
        let filtered = clubs.slice();
        if (currentFilter !== 'All') filtered = filtered.filter(c => c.category === currentFilter);
        if (searchQuery) {
            filtered = filtered.filter(c =>
                c.name.toLowerCase().includes(searchQuery) ||
                c.description.toLowerCase().includes(searchQuery) ||
                c.category.toLowerCase().includes(searchQuery) ||
                (c.tags || []).some(t => t.toLowerCase().includes(searchQuery))
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <p class="fw-medium text-navy">No clubs found</p>
                        <p class="small text-muted">Try a different search or category.</p>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(club => {
            const { bg, color, icon } = getCategoryColor(club.category);
            const featuredBadge = club.featured
                ? `<span class="position-absolute top-0 start-0 m-3 badge" style="background:#a855f7;color:#fff;font-size:0.72rem;padding:5px 12px;border-radius:8px;font-weight:600;">Featured</span>`
                : '';
            const tags = (club.tags || []).map(t =>
                `<span class="badge me-1 mb-1" style="background:#f1f5f9;color:#475569;font-size:0.72rem;font-weight:500;padding:4px 10px;border-radius:6px;">${t}</span>`
            ).join('');

            return `
            <div class="col-12 col-md-6 col-lg-4" data-club-id="${club.id}">
                <div class="card club-card border-0 h-100 shadow-sm" style="border-radius:16px;overflow:hidden;transition:transform 0.2s ease,box-shadow 0.2s ease;">
                    <!-- Image -->
                    <div class="position-relative" style="height:190px;overflow:hidden;background:#f8fafc;">
                        <img src="${club.image}" alt="${club.name}" loading="lazy"
                            style="width:100%;height:100%;object-fit:cover;transition:transform 0.5s ease;">
                        ${featuredBadge}
                        <span class="position-absolute top-0 end-0 m-3 badge" style="background:${bg};color:${color};font-size:0.72rem;padding:5px 12px;border-radius:8px;font-weight:600;">
                            <i class="bi ${icon} me-1"></i>${club.category}
                        </span>
                    </div>
                    <!-- Body -->
                    <div class="card-body p-4 d-flex flex-column">
                        <h5 class="fw-bold text-dark mb-2" style="font-size:1.05rem;line-height:1.3;">${club.name}</h5>
                        <p class="text-muted small mb-3" style="line-height:1.5;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${club.description}</p>

                        <div class="mb-3">${tags}</div>

                        <!-- Meta -->
                        <div class="d-flex flex-column gap-1 mb-4" style="font-size:0.82rem;">
                            <div class="d-flex align-items-center gap-2 text-muted">
                                <i class="bi bi-people" style="color:${color};font-size:0.9rem;flex-shrink:0;"></i>
                                <span><strong style="color:#0a192f;">${club.members.toLocaleString()}</strong> members</span>
                            </div>
                            <div class="d-flex align-items-center gap-2 text-muted">
                                <i class="bi bi-calendar3" style="color:${color};font-size:0.9rem;flex-shrink:0;"></i>
                                <span>${club.meetingDay} · ${club.meetingTime}</span>
                            </div>
                            <div class="d-flex align-items-center gap-2 text-muted">
                                <i class="bi bi-geo-alt" style="color:${color};font-size:0.9rem;flex-shrink:0;"></i>
                                <span>${club.location}</span>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="mt-auto d-flex gap-2">
                            <button class="btn fw-medium rounded-3 flex-grow-1 py-2"
                                style="background:${color};color:#fff;font-size:0.88rem;border:none;"
                                onclick="handleJoinClub('${club.id}', '${club.name.replace(/'/g, "\\'")}', this)">
                                <i class="bi bi-person-plus me-1"></i> Join Club
                            </button>
                            <button class="btn btn-outline-secondary rounded-3 px-3"
                                style="font-size:0.88rem;"
                                onclick="showToast('Club details coming soon!','info')" title="View Details">
                                <i class="bi bi-info-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Hover effect via JS
        document.querySelectorAll('.club-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-4px)';
                card.style.boxShadow = '0 12px 28px rgba(0,0,0,0.11)';
                const img = card.querySelector('img');
                if (img) img.style.transform = 'scale(1.06)';
            });
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.boxShadow = '';
                const img = card.querySelector('img');
                if (img) img.style.transform = '';
            });
        });
    }

    renderClubs();
}

function handleJoinClub(clubId, clubName, btn) {
    if (!Auth.isLoggedIn()) {
        openAuthModal(() => handleJoinClub(clubId, clubName, btn));
        return;
    }
    // Toggle join state
    const joined = JSON.parse(localStorage.getItem('cc_joined_clubs') || '[]');
    const idx = joined.indexOf(clubId);
    if (idx === -1) {
        joined.push(clubId);
        localStorage.setItem('cc_joined_clubs', JSON.stringify(joined));
        btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Joined!';
        btn.style.opacity = '0.8';
        btn.disabled = true;
        showToast(`You joined "${clubName}"! 🎉`, 'success');
    } else {
        showToast(`You've already joined "${clubName}".`, 'info');
    }
}
