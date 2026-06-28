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

