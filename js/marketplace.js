/* ==========================
 * DATA STORE (CRUD on a mock JSON backend) 
 ========================*/

 const MarketplaceStore = {
    _cache: null, // merged list cache, refreshed on demand

    /** Fetch seed JSON + user-added items, returns merged list. */
    async getAll(forceRefresh = false) {
        if (this._cache && !forceRefresh) return this._cache;
        let seed = [];
        try {
            const res = await fetch('data/marketplace.json');
            if (res.ok) seed = await res.json();
        } catch (e) {
            console.error('Could not load marketplace.json', e);
        }
        this._cache = [...seed, ...this.getUserProducts()];
        return this._cache;
    },

    /** Find one product by id (across seed + user data). */
    async getById(id) {
        const all = await this.getAll();
        return all.find(p => p.id === id) || null;
    },

    // ---------- User-posted CRUD (localStorage = mock DB) ----------
    getUserProducts() {
        try { return JSON.parse(localStorage.getItem('cc_products')) || []; }
        catch { return []; }
    },
    saveUserProducts(products) {
        localStorage.setItem('cc_products', JSON.stringify(products));
        this._cache = null; // invalidate
    },

    /** CREATE */
    addProduct(product) {
        const products = this.getUserProducts();
        products.push(product);
        this.saveUserProducts(products);
        return product;
    },

    /** UPDATE — only user-posted items are editable */
    updateProduct(id, updates) {
        const products = this.getUserProducts();
        const idx = products.findIndex(p => p.id === id);
        if (idx === -1) return false;
        products[idx] = { ...products[idx], ...updates };
        this.saveUserProducts(products);
        return true;
    },

    /** DELETE */
    deleteProduct(id) {
        const products = this.getUserProducts().filter(p => p.id !== id);
        this.saveUserProducts(products);
    },
};

/* ==========================
 * HOME PAGE: marketplace preview (first 4 items) 
 ========================*/

//  Displays the first four items in the homepage
async function initHomeMarketplacePreview() {
    const container = document.getElementById('product-container');
    if (!container) return;

    const products = await MarketplaceStore.getAll(true);
    const preview = products.slice(0, 4);

    if (preview.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-4">No products yet.</div>`;
        return;
    }

    container.innerHTML = preview.map(p => `
        <div class="col-sm-6 col-md-4 col-lg-3">
            <div class="card h-100 product-card border-0 shadow-sm">
                <div class="product-image-wrapper">
                    <img src="${p.image}" class="card-img-top" alt="${p.title}" loading="lazy">
                </div>
                <div class="card-body d-flex flex-column p-3">
                    <span class="badge badge-product-type mb-2">${p.category}</span>
                    <h5 class="card-title fw-bold text-navy mb-1">${p.title}</h5>
                    <p class="sold-by-label text-muted mb-3">Sold by ${p.seller}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="price-text fw-bold">${p.priceDisplay}</span>
                        <a href="marketplace.html" class="btn btn-orange-sm rounded-3 fw-medium">View</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

/* ==========================
 * MARKETPLACE PAGE
 ========================*/