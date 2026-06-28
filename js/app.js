/* ==============================================
   CampusConnect — Core App
   ------------------------------------------------
   Main entry point for our Project. Handles:
     • Auth (session in localStorage) + Auth modal
     • Cart store + Cart sidebar
     • Navbar injection (login/cart/user state)
     • Boot routine that dispatches to the right page
   ============================================== */

/* ==========================
    TOAST SYSTEM
==========================*/
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

/* ==========================
    SESSION/ AUTH
==========================*/const Auth = {
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

/* ==========================
    MARKET CART FUNCTIONALITY
==========================*/

const Cart = {
    get() {
        try { return JSON.parse(localStorage.getItem('cc_cart')) || []; }
        catch { return []; }
    },
    save(items) { localStorage.setItem('cc_cart', JSON.stringify(items)); },
    add(product) {
        const items = this.get();
        if (items.find(i => i.id === product.id)) {
            showToast(`"${product.title}" is already in your cart.`, 'info');
            return;
        }
        items.push({ ...product, addedAt: Date.now() });
        this.save(items);
        this.updateBadge();
        showToast(`Added "${product.title}" to cart!`, 'success');
        if (document.getElementById('cart-sidebar')) renderCartSidebar();
    },
    remove(productId) {
        this.save(this.get().filter(i => i.id !== productId));
        this.updateBadge();
        if (document.getElementById('cart-sidebar')) renderCartSidebar();
    },
    clear() {
        this.save([]);
        this.updateBadge();
        if (document.getElementById('cart-sidebar')) renderCartSidebar();
    },
    updateBadge() {
        const count = this.get().length;
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline' : 'none';
        });
    },
    total() {
        return this.get().reduce((sum, i) => sum + (i.price || 0), 0);
    },
};

/* ==========================
    NAVBAR
==========================*/
function updateNavbarForUser() {
    const user = Auth.getUser();
    const actionsSlot = document.getElementById('navbar-user-actions');
    if (!actionsSlot) return;

    const cartCount = Cart.get().length;

    if (user) {
        actionsSlot.innerHTML = `
            <li class="nav-item px-2 d-flex align-items-center">
                <button class="btn p-0 position-relative me-3" id="cart-btn" title="Cart" style="background:none;border:none;">
                    <i class="bi bi-bag nav-icon"></i>
                    <span class="cart-count position-absolute cart-badge" style="display:${cartCount > 0 ? 'inline' : 'none'}">${cartCount}</span>
                </button>
            </li>
            <li class="nav-item d-flex align-items-center px-2">
                <div class="user-avatar" id="user-menu-btn" title="${user.name}">${user.name.charAt(0).toUpperCase()}</div>
            </li>
            <li class="nav-item d-flex align-items-center">
                <div class="dropdown-menu dropdown-menu-end shadow border-0 p-2" id="user-dropdown" style="display:none;position:absolute;top:64px;right:16px;min-width:180px;border-radius:12px;z-index:1000;">
                    <div class="px-3 py-2 text-muted small border-bottom mb-1">${user.email}</div>
                    <button class="dropdown-item rounded-2 py-2" onclick="Auth.logout()">
                        <i class="bi bi-box-arrow-right me-2"></i> Log Out
                    </button>
                </div>
            </li>`;
        document.getElementById('cart-btn')?.addEventListener('click', openCartSidebar);
        const menuBtn  = document.getElementById('user-menu-btn');
        const dropdown = document.getElementById('user-dropdown');
        menuBtn?.addEventListener('click', e => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => { if (dropdown) dropdown.style.display = 'none'; });
    } else {
        actionsSlot.innerHTML = `
            <li class="nav-item px-2">
                <button class="btn btn-outline-secondary rounded-3 fw-medium me-2" onclick="openAuthModal()">Log In</button>
            </li>
            <li class="nav-item">
                <button class="btn btn-purple rounded-3 fw-medium" onclick="openAuthModal(null, true)">Sign Up</button>
            </li>`;
    }
}

function markActiveNavLink() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        const href = link.getAttribute('href') || '';
        if (href === page || (page === '' && href === 'index.html') || href.endsWith(page)) {
            link.classList.add('active');
        }
    });
}

/* ==========================
    AUTH MODAL
==========================*/

let _authCallback = null;

function openAuthModal(callback = null, showSignup = false) {
    _authCallback = callback;
    let modal = document.getElementById('auth-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'auth-modal';
        modal.innerHTML = `
        <div class="modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px;">
            <div class="bg-white rounded-4 shadow-lg" style="width:100%;max-width:440px;overflow:hidden;">
                <div class="modal-header-purple text-white p-4">
                    <h5 class="fw-bold m-0" id="auth-modal-title">Log In to CampusConnect</h5>
                    <button onclick="closeAuthModal()" style="background:none;border:none;color:#fff;font-size:1.4rem;line-height:1;cursor:pointer;">&times;</button>
                </div>
                <div class="p-4">
                    <div class="d-flex mb-4 border-bottom">
                        <button class="btn p-0 me-4 pb-2 fw-semibold auth-tab-btn active" id="tab-login" onclick="switchAuthTab('login')" style="border:none;background:none;border-bottom:2px solid var(--brand-purple);">Log In</button>
                        <button class="btn p-0 pb-2 fw-semibold auth-tab-btn" id="tab-signup" onclick="switchAuthTab('signup')" style="border:none;background:none;color:#64748b;">Sign Up</button>
                    </div>
                    <div id="auth-login-form">
                        <div class="mb-3"><label class="form-label">Email</label>
                            <input type="email" id="login-email" class="form-control rounded-3" placeholder="you@university.ac.ke"></div>
                        <div class="mb-4"><label class="form-label">Password</label>
                            <input type="password" id="login-pass" class="form-control rounded-3" placeholder="••••••••"></div>
                        <button class="btn btn-purple w-100 py-2 fw-medium rounded-3" onclick="handleLogin()">Log In</button>
                    </div>
                    <div id="auth-signup-form" style="display:none;">
                        <div class="mb-3"><label class="form-label">Full Name</label>
                            <input type="text" id="signup-name" class="form-control rounded-3" placeholder="Jane Mwangi"></div>
                        <div class="mb-3"><label class="form-label">Email</label>
                            <input type="email" id="signup-email" class="form-control rounded-3" placeholder="you@university.ac.ke"></div>
                        <div class="mb-4"><label class="form-label">Password</label>
                            <input type="password" id="signup-pass" class="form-control rounded-3" placeholder="Min. 6 characters"></div>
                        <button class="btn btn-purple w-100 py-2 fw-medium rounded-3" onclick="handleSignup()">Create Account</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.appendChild(modal);
        modal.querySelector('.modal-backdrop').addEventListener('click', e => {
            if (e.target === modal.querySelector('.modal-backdrop')) closeAuthModal();
        });
    }
    modal.style.display = 'block';
    if (showSignup) switchAuthTab('signup');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function switchAuthTab(tab) {
    document.getElementById('auth-login-form').style.display  = tab === 'login'  ? 'block' : 'none';
    document.getElementById('auth-signup-form').style.display = tab === 'signup' ? 'block' : 'none';
    document.getElementById('tab-login').style.borderBottom  = tab === 'login'  ? '2px solid var(--brand-purple)' : 'none';
    document.getElementById('tab-login').style.color         = tab === 'login'  ? 'var(--brand-purple)' : '#64748b';
    document.getElementById('tab-signup').style.borderBottom = tab === 'signup' ? '2px solid var(--brand-purple)' : 'none';
    document.getElementById('tab-signup').style.color        = tab === 'signup' ? 'var(--brand-purple)' : '#64748b';
    document.getElementById('auth-modal-title').textContent  = tab === 'login'
        ? 'Log In to CampusConnect' : 'Join CampusConnect';
}


/* ==========================
    BOOT
==========================*/
document.addEventListener('DOMContentLoaded', async () => {
    const page = window.location.pathname.split('/').pop() || 'index.html';

    // Shell on every page
    await Components.loadShell();

    switch (page) {
        case '':
        case 'index.html':
            await Components.loadHome();
            break;

        case 'events.html':
            await Components.loadEvents();
            if (typeof initEventsPage === 'function') initEventsPage();
            break;

        case 'marketplace.html':
            await Components.loadMarketplace();
            if (typeof initMarketplacePage === 'function') initMarketplacePage();
            break;

        case 'clubs.html':
            if (Components.loadClubs) await Components.loadClubs();
            break;

    }

    Cart.updateBadge();
});
