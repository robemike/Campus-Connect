/* ====================
    DATA STORE
===================== */
const EventsStore = {
    _cache: null,

    /** Fetch seed events + user-created events. */
    async getAll(forceRefresh = false) {
        if (this._cache && !forceRefresh) return this._cache;
        let seed = [];
        try {
            const res = await fetch('data/events.json');
            if (res.ok) seed = await res.json();
        } catch (e) {
            console.error('Could not load events.json', e);
        }
        this._cache = [...seed, ...this.getUserEvents()];
        return this._cache;
    },

    async getById(id) {
        const all = await this.getAll();
        return all.find(e => e.id === id) || null;
    },

    // ---------- CRUD on user-created events ----------
    getUserEvents() {
        try { return JSON.parse(localStorage.getItem('cc_events')) || []; }
        catch { return []; }
    },
    saveUserEvents(events) {
        localStorage.setItem('cc_events', JSON.stringify(events));
        this._cache = null;
    },

    addEvent(ev) {
        const events = this.getUserEvents();
        events.push(ev);
        this.saveUserEvents(events);
        return ev;
    },

    updateEvent(id, updates) {
        const events = this.getUserEvents();
        const idx = events.findIndex(e => e.id === id);
        if (idx === -1) return false;
        events[idx] = { ...events[idx], ...updates };
        this.saveUserEvents(events);
        return true;
    },

    deleteEvent(id) {
        const events = this.getUserEvents().filter(e => e.id !== id);
        this.saveUserEvents(events);
    },

    /** Helper used when a user registers — bump attendees in-memory. */
    bumpAttendees(id) {
        if (!this._cache) return;
        const ev = this._cache.find(e => e.id === id);
        if (ev && ev.attendees < ev.maxAttendees) ev.attendees += 1;
    },
};

/* ====================
    REGISTRATIONS (per logged-in browser)
===================== */
const EventReg = {
    get() {
        try { return JSON.parse(localStorage.getItem('cc_regs')) || []; }
        catch { return []; }
    },
    save(regs) {
        localStorage.setItem('cc_regs', JSON.stringify(regs));
    },
    isRegistered(eventId) {
        return this.get().includes(eventId);
    },
    register(eventId, eventTitle) {
        if (!Auth.isLoggedIn()) {
            openAuthModal(() => this.register(eventId, eventTitle));
            return;
        }
        const regs = this.get();
        if (regs.includes(eventId)) {
            showToast('You are already registered for this event.', 'info');
            return;
        }
        regs.push(eventId);
        this.save(regs);
        EventsStore.bumpAttendees(eventId);
        showToast(`You're registered for "${eventTitle}"! 🎉`, 'success');

        // Update DOM button state
        document.querySelectorAll(`[data-register="${eventId}"]`).forEach(btn => {
            btn.outerHTML = `<span class="badge-registered"><i class="bi bi-check-circle me-1"></i>You're registered!</span>`;
        });
    },
    unregister(eventId) {
        this.save(this.get().filter(r => r !== eventId));
    },
};

/* ====================
    EVENTS PAGE
===================== */
async function initEventsPage() {
    const container = document.getElementById('events-catalog-container');
    if (!container) return;

    let currentFilter = 'All';

    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter || 'All';
            renderEvents();
        });
    });

    async function renderEvents() {
        const events = await EventsStore.getAll(true);
        let filtered = events;
        if (currentFilter !== 'All') {
            filtered = events.filter(ev => ev.category === currentFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="bi bi-calendar-x"></i>
                    <p class="fw-medium text-navy">No events in this category</p>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(ev => {
            const registered = EventReg.isRegistered(ev.id);
            const spotsLeft  = ev.maxAttendees - ev.attendees;
            const fillPct    = Math.round((ev.attendees / ev.maxAttendees) * 100);
            const featuredBadge = ev.featured
                ? `<span class="badge position-absolute top-0 start-0 m-3 badge-featured text-white rounded-2">Featured</span>`
                : '';
            const safeTitle = ev.title.replace(/'/g, "\\'");

            return `
            <div class="card event-card ${ev.featured ? 'featured' : ''} border shadow-sm" data-event-id="${ev.id}">
                <div class="row g-0 h-100">
                    <div class="col-md-4 position-relative image-wrapper">
                        <img src="${ev.image}" alt="${ev.title}" loading="lazy">
                        ${featuredBadge}
                        <span class="badge position-absolute top-0 end-0 m-3 badge-category text-dark rounded-pill">${ev.category}</span>
                    </div>
                    <div class="col-md-8">
                        <div class="card-body p-4 d-flex flex-column justify-content-between h-100">
                            <div>
                                <h3 class="card-title fw-bold text-navy mb-2">${ev.title}</h3>
                                <p class="card-text text-muted mb-3">${ev.description}</p>
                                <div class="row g-3 meta-grid mb-3">
                                    <div class="col-sm-6 d-flex align-items-center gap-2">
                                        <i class="bi bi-calendar3 icon-purple fs-5"></i>
                                        <div>
                                            <div class="meta-label text-muted">Date</div>
                                            <div class="meta-value fw-medium text-navy">${ev.date}</div>
                                        </div>
                                    </div>
                                    <div class="col-sm-6 d-flex align-items-center gap-2">
                                        <i class="bi bi-clock icon-purple fs-5"></i>
                                        <div>
                                            <div class="meta-label text-muted">Time</div>
                                            <div class="meta-value fw-medium text-navy">${ev.time}</div>
                                        </div>
                                    </div>
                                    <div class="col-sm-6 d-flex align-items-center gap-2">
                                        <i class="bi bi-geo-alt icon-purple fs-5"></i>
                                        <div>
                                            <div class="meta-label text-muted">Location</div>
                                            <div class="meta-value fw-medium text-navy">${ev.location}</div>
                                        </div>
                                    </div>
                                    <div class="col-sm-6 d-flex align-items-center gap-2">
                                        <i class="bi bi-people icon-purple fs-5"></i>
                                        <div>
                                            <div class="meta-label text-muted">Attendees</div>
                                            <div class="meta-value fw-medium text-navy">${ev.attendees.toLocaleString()} registered <span class="text-muted small">(${spotsLeft} spots left)</span></div>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-1 d-flex justify-content-between" style="font-size:0.8rem;color:#64748b;">
                                    <span>Capacity</span><span>${fillPct}% full</span>
                                </div>
                                <div class="progress rounded-3 mb-3" style="height:6px;">
                                    <div class="progress-bar bg-purple" role="progressbar" style="width:${fillPct}%;background:var(--brand-purple) !important;"></div>
                                </div>
                            </div>
                            <div class="d-flex flex-wrap gap-2 align-items-center">
                                ${registered
                                    ? `<span class="badge-registered"><i class="bi bi-check-circle me-1"></i>You're registered!</span>`
                                    : `<button class="btn btn-purple px-4 py-2 rounded-3 fw-medium" data-register="${ev.id}" onclick="EventReg.register('${ev.id}', '${safeTitle}')">Register Now <i class="bi bi-arrow-right ms-1"></i></button>`
                                }
                                <button class="btn btn-outline-secondary-custom px-3 py-2 rounded-3 fw-medium" onclick="shareEvent('${safeTitle}')">
                                    <i class="bi bi-share me-1"></i> Share
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    renderEvents();
}

/* ====================
    UTIL: share an event
===================== */
function shareEvent(title) {
    if (navigator.share) {
        navigator.share({ title: `CampusConnect: ${title}`, url: window.location.href })
            .catch(() => {});
    } else if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href);
        showToast('Event link copied to clipboard!', 'success');
    } else {
        showToast('Sharing not supported on this browser.', 'info');
    }
}
