/* ==============================================================
   CampusConnect — Cart Logic  (cart.js)
   ---------------------------------------------------------------
   Handles everything related to the shopping cart:
     • Cart store  (add / remove / clear / total / badge)
     • Cart sidebar  (build / open / close / render)
     • Cart page  (initCartPage — used by cart.html)
   ============================================================== */

/* ==========================
   CART STORE
========================== */
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
        if (document.getElementById('cart-page-container')) renderCartPage();
    },

    clear() {
        this.save([]);
        this.updateBadge();
        if (document.getElementById('cart-sidebar')) renderCartSidebar();
        if (document.getElementById('cart-page-container')) renderCartPage();
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
   CART SIDEBAR
========================== */
function openCartSidebar() {
    if (!document.getElementById('cart-sidebar')) buildCartSidebar();
    renderCartSidebar();
    document.getElementById('cart-sidebar').classList.add('open');
    document.getElementById('cart-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartSidebar() {
    document.getElementById('cart-sidebar')?.classList.remove('open');
    document.getElementById('cart-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
}

function buildCartSidebar() {
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.addEventListener('click', closeCartSidebar);
    document.body.appendChild(overlay);

    const sidebar = document.createElement('div');
    sidebar.id = 'cart-sidebar';
    sidebar.innerHTML = `
        <div class="cart-header">
            <h5 class="fw-bold m-0"><i class="bi bi-bag me-2"></i>Your Cart</h5>
            <button onclick="closeCartSidebar()" style="background:none;border:none;color:#fff;font-size:1.4rem;line-height:1;cursor:pointer;">&times;</button>
        </div>
        <div class="cart-body" id="cart-body"></div>
        <div class="cart-footer" id="cart-footer"></div>`;
    document.body.appendChild(sidebar);
}

function renderCartSidebar() {
    const items  = Cart.get();
    const body   = document.getElementById('cart-body');
    const footer = document.getElementById('cart-footer');
    if (!body || !footer) return;

    if (items.length === 0) {
        body.innerHTML = `
            <div class="empty-state">
                <i class="bi bi-bag-x"></i>
                <p class="fw-medium text-navy">Your cart is empty</p>
                <p class="small text-muted">Browse the marketplace and add items.</p>
            </div>`;
        footer.innerHTML = '';
        return;
    }

    body.innerHTML = items.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.title}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.title}</div>
                <div class="text-muted" style="font-size:0.78rem;">by ${item.seller}</div>
                <div class="cart-item-price">${item.priceDisplay}</div>
            </div>
            <button onclick="Cart.remove('${item.id}')"
                style="background:none;border:none;color:#94a3b8;font-size:1.1rem;cursor:pointer;padding:4px;"
                title="Remove"><i class="bi bi-x-lg"></i></button>
        </div>`).join('');

    footer.innerHTML = `
        <div class="cart-total-row">
            <span>Total</span>
            <span class="text-orange">Ksh ${Cart.total().toLocaleString()}</span>
        </div>
        <a href="cart.html" class="btn btn-orange w-100 py-2 fw-medium rounded-3 mb-2" onclick="closeCartSidebar()">
            <i class="bi bi-bag-check me-2"></i> View Cart
        </a>
        <button class="btn btn-link text-muted w-100 small" onclick="Cart.clear()">Clear Cart</button>`;
}

/* ==========================
   CART PAGE  (cart.html)
========================== */
function initCartPage() {
    const container = document.getElementById('cart-page-container');
    if (!container) return;
    renderCartPage();
}

function renderCartPage() {
    const container = document.getElementById('cart-page-container');
    if (!container) return;

    const items = Cart.get();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state py-5 text-center">
                    <i class="bi bi-bag-x" style="font-size:3rem;color:#cbd5e1;display:block;margin-bottom:16px;"></i>
                    <p class="fw-medium text-navy fs-5">Your cart is empty</p>
                    <p class="text-muted mb-4">Head over to the marketplace and add items you like.</p>
                    <a href="marketplace.html" class="btn btn-orange px-5 py-2 fw-medium rounded-3">
                        <i class="bi bi-shop me-2"></i> Browse Marketplace
                    </a>
                </div>
            </div>`;
        const summaryEl = document.getElementById('cart-summary');
        if (summaryEl) summaryEl.innerHTML = '';
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="col-12" data-cart-item-id="${item.id}">
            <div class="card border-0 shadow-sm rounded-4 p-3">
                <div class="d-flex gap-3 align-items-start">
                    <img src="${item.image}" alt="${item.title}"
                        style="width:90px;height:90px;object-fit:cover;border-radius:10px;flex-shrink:0;">
                    <div class="flex-grow-1 min-width-0">
                        <h6 class="fw-bold text-dark mb-1">${item.title}</h6>
                        <p class="text-muted small mb-1">Sold by ${item.seller}</p>
                        <p class="fw-bold mb-0" style="color:var(--brand-orange);">${item.priceDisplay}</p>
                    </div>
                    <button class="btn btn-sm btn-outline-danger rounded-3"
                        onclick="Cart.remove('${item.id}')" title="Remove item">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        </div>`).join('');

    const summaryEl = document.getElementById('cart-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 p-4">
                <h5 class="fw-bold text-navy mb-4">Order Summary</h5>
                <div class="d-flex justify-content-between mb-2">
                    <span class="text-muted">Items (${items.length})</span>
                    <span class="fw-semibold">Ksh ${Cart.total().toLocaleString()}</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-4">
                    <span class="fw-bold fs-5">Total</span>
                    <span class="fw-bold fs-5" style="color:var(--brand-orange);">Ksh ${Cart.total().toLocaleString()}</span>
                </div>
                <button class="btn btn-orange w-100 py-2 fw-medium rounded-3 mb-2"
                    onclick="showToast('Checkout coming soon! Contact the sellers directly.','info')">
                    <i class="bi bi-credit-card me-2"></i> Proceed to Checkout
                </button>
                <button class="btn btn-outline-secondary w-100 py-2 fw-medium rounded-3"
                    onclick="if(confirm('Clear all items from your cart?')) Cart.clear()">
                    <i class="bi bi-trash me-2"></i> Clear Cart
                </button>
            </div>`;
    }
}