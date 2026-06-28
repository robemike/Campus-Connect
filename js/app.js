/* ==============================================
   CampusConnect — Core App
   ------------------------------------------------
   Main entry point for our Project. Handles:
     • Auth (session in localStorage) + Auth modal
     • Cart store + Cart sidebar
     • Navbar injection (login/cart/user state)
     • Boot routine that dispatches to the right page
   ============================================== */

// ── TOAST SYSTEM ──────────────────────────────────────
function showToast(message, type = 'info') {
    // Implementation for showing toast notifications
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `cc-toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);    
}

// ── SESSION / AUTH ────────────────────────────────────
const Auth = {
    getUser() {
        try { return JSON.parse(localStorage.getItem('cc_user')) || null; }
        catch { return null; }
    },
    setUser(user) { localStorage.setItem('cc_user', JSON.stringify(user)); },
    logout() {
        localStorage.removeItem('cc_user');
        location.reload();
    },
    isLoggedIn() { return !!this.getUser(); },
};