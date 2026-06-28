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