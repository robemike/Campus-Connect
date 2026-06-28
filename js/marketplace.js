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

async function initMarketplacePage() {
    const container = document.getElementById('product-catalog-container');
    if (!container) return;

    let products = await MarketplaceStore.getAll(true);
    let currentFilter = 'All Items';
    let searchQuery = '';

    // -- Filter pill buttons in the catalog header
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentFilter = this.dataset.filter;
            renderProducts();
        });
    });

    const heroSearchBtn   = document.getElementById('marketplace-search-btn');
    const heroSearchInput = document.getElementById('marketplace-search-input');
    if (heroSearchBtn && heroSearchInput) {
        heroSearchBtn.addEventListener('click', () => {
            searchQuery = heroSearchInput.value.trim().toLowerCase();
            renderProducts();
            document.getElementById('marketplace-catalog-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        heroSearchInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') heroSearchBtn.click();
        });
    }

    const categorySelect = document.getElementById('marketplace-category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', function () {
            const val = this.value;
            if (!val) return;
            document.querySelectorAll('.btn-filter').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === val);
            });
            currentFilter = val;
            renderProducts();
            document.getElementById('marketplace-catalog-section')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }

    document.querySelectorAll('.btn-post-listing').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!Auth.isLoggedIn()) {
                openAuthModal(() => openPostListingModal());
            } else {
                openPostListingModal();
            }
        });
    });

    async function renderProducts() {
        products = await MarketplaceStore.getAll(true);
        const user = Auth.getUser();
        let filtered = products.slice();

        if (currentFilter !== 'All Items') {
            filtered = filtered.filter(p => p.category === currentFilter);
        }
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.title.toLowerCase().includes(searchQuery) ||
                p.description.toLowerCase().includes(searchQuery) ||
                p.seller.toLowerCase().includes(searchQuery) ||
                p.category.toLowerCase().includes(searchQuery)
            );
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="col-12">
                    <div class="empty-state">
                        <i class="bi bi-search"></i>
                        <p class="fw-medium text-navy">No products found</p>
                        <p class="small text-muted">Try a different search or filter.</p>
                    </div>
                </div>`;
            return;
        }

        container.innerHTML = filtered.map(p => {
            const isOwner = user && p.sellerId === user.email.replace(/[^a-z0-9]/gi, '_');
            const ownerControls = isOwner ? `
                <div class="product-owner-actions d-flex gap-1 mt-2">
                    <button class="btn btn-sm btn-outline-secondary rounded-2" onclick="openEditProductModal('${p.id}')"><i class="bi bi-pencil me-1"></i>Edit</button>
                    <button class="btn btn-sm btn-outline-danger rounded-2" onclick="deleteProduct('${p.id}')"><i class="bi bi-trash me-1"></i>Delete</button>
                </div>` : '';

            const cartPayload = JSON.stringify({
                id: p.id, title: p.title, seller: p.seller,
                price: p.price, priceDisplay: p.priceDisplay, image: p.image
            });

            return `
            <div class="col-12 col-md-6 col-lg-3" data-product-id="${p.id}">
                <div class="card product-card border-0 h-100 shadow-sm">
                    <div class="product-image-wrapper">
                        <img src="${p.image}" alt="${p.title}" loading="lazy">
                    </div>
                    <div class="card-body p-3 d-flex flex-column justify-content-between">
                        <div>
                            <span class="badge badge-product-type mb-2">${p.category}</span>
                            <h5 class="product-title fw-bold text-dark mb-1">${p.title}</h5>
                            <p class="sold-by-label mb-2">Sold by ${p.seller}</p>
                            <p class="product-description text-muted small">${p.description}</p>
                        </div>
                        <div class="mt-3">
                            <div class="d-flex align-items-center justify-content-between gap-2">
                                <span class="product-price fw-bold">${p.priceDisplay}</span>
                                <div class="d-flex gap-1">
                                    <button class="btn btn-outline-secondary btn-sm rounded-2 px-2" title="Add to Cart" onclick='Cart.add(${cartPayload})'>
                                        <i class="bi bi-bag-plus"></i>
                                    </button>
                                    <button class="btn btn-buy-now px-3 py-2 fw-medium rounded-2" onclick="showToast('Contact ${p.seller.replace(/'/g,"\\'")} to arrange the purchase.','info')">
                                        Buy Now
                                    </button>
                                </div>
                            </div>
                            ${ownerControls}
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    window._refreshMarketplace = renderProducts;
    renderProducts();
}

/* ==========================
 * POST / EDIT LISTING MODAL
 ========================*/
function openPostListingModal(existingProduct = null) {
    const isEdit = !!existingProduct;
    let modal = document.getElementById('post-listing-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'post-listing-modal';
        document.body.appendChild(modal);
    }
    modal.innerHTML = `
    <div class="modal-backdrop" style="position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1100;display:flex;align-items:center;justify-content:center;padding:16px;">
        <div class="bg-white rounded-4 shadow-lg" style="width:100%;max-width:520px;overflow:hidden;max-height:90vh;overflow-y:auto;">
            <div class="modal-header-orange text-white p-4 d-flex justify-content-between align-items-center">
                <h5 class="fw-bold m-0">${isEdit ? 'Edit Listing' : 'Post a New Listing'}</h5>
                <button onclick="closePostListingModal()" style="background:none;border:none;color:#fff;font-size:1.4rem;line-height:1;cursor:pointer;">&times;</button>
            </div>
            <div class="p-4">
                <div class="mb-3">
                    <label class="form-label">Product Title *</label>
                    <input type="text" id="pl-title" class="form-control rounded-3" placeholder="e.g. Canon EOS Camera" value="${isEdit ? existingProduct.title : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Category *</label>
                    <select id="pl-category" class="form-select rounded-3">
                        <option value="">Select a category</option>
                        ${['Electronics','Textbooks','Furniture','Services','Other'].map(c =>
                            `<option value="${c}" ${isEdit && existingProduct.category === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Price (Ksh) *</label>
                    <input type="number" id="pl-price" class="form-control rounded-3" placeholder="e.g. 5000" min="0" value="${isEdit ? existingProduct.price : ''}">
                </div>
                <div class="mb-3">
                    <label class="form-label">Condition</label>
                    <select id="pl-condition" class="form-select rounded-3">
                        ${['Brand New','Like New','Good','Fair','Service'].map(c =>
                            `<option value="${c}" ${isEdit && existingProduct.condition === c ? 'selected' : ''}>${c}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Description *</label>
                    <textarea id="pl-desc" class="form-control rounded-3" rows="3" placeholder="Describe your item...">${isEdit ? existingProduct.description : ''}</textarea>
                </div>
                <div class="mb-4">
                    <label class="form-label">Image URL</label>
                    <input type="url" id="pl-image" class="form-control rounded-3" placeholder="https://..." value="${isEdit ? existingProduct.image : ''}">
                    <div class="form-text">Paste an image link from Unsplash or similar.</div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-orange flex-grow-1 py-2 fw-medium rounded-3" onclick="${isEdit ? `saveEditProduct('${existingProduct.id}')` : 'submitNewListing()'}">
                        ${isEdit ? 'Save Changes' : 'Post Listing'}
                    </button>
                    <button class="btn btn-outline-secondary rounded-3" onclick="closePostListingModal()">Cancel</button>
                </div>
            </div>
        </div>
    </div>`;
    modal.style.display = 'block';
}

function closePostListingModal() {
    const modal = document.getElementById('post-listing-modal');
    if (modal) modal.style.display = 'none';
}

function submitNewListing() {
    const user = Auth.getUser();
    if (!user) { showToast('Please log in first.', 'error'); return; }

    const title       = document.getElementById('pl-title').value.trim();
    const category    = document.getElementById('pl-category').value;
    const price       = parseInt(document.getElementById('pl-price').value) || 0;
    const condition   = document.getElementById('pl-condition').value;
    const description = document.getElementById('pl-desc').value.trim();
    const image       = document.getElementById('pl-image').value.trim() ||
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=500&q=80';

    if (!title || !category || !price || !description) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    const product = {
        id: 'up_' + Date.now(),
        title, category, price,
        priceDisplay: `Ksh ${price.toLocaleString()}`,
        condition,
        description,
        image,
        seller: user.name,
        sellerId: user.email.replace(/[^a-z0-9]/gi, '_'),
        createdAt: Date.now(),
    };

    MarketplaceStore.addProduct(product);
    closePostListingModal();
    showToast(`"${title}" listed successfully!`, 'success');
    if (typeof window._refreshMarketplace === 'function') window._refreshMarketplace();
    else if (typeof initHomeMarketplacePreview === 'function') initHomeMarketplacePreview();
}

function openEditProductModal(id) {
    const product = MarketplaceStore.getUserProducts().find(p => p.id === id);
    if (!product) { showToast('Product not found.', 'error'); return; }
    openPostListingModal(product);
}

function saveEditProduct(id) {
    const title       = document.getElementById('pl-title').value.trim();
    const category    = document.getElementById('pl-category').value;
    const price       = parseInt(document.getElementById('pl-price').value) || 0;
    const condition   = document.getElementById('pl-condition').value;
    const description = document.getElementById('pl-desc').value.trim();
    const image       = document.getElementById('pl-image').value.trim();

    if (!title || !category || !price || !description) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }

    MarketplaceStore.updateProduct(id, {
        title, category, price,
        priceDisplay: `Ksh ${price.toLocaleString()}`,
        condition, description, image,
    });

    closePostListingModal();
    showToast('Listing updated!', 'success');
    if (typeof window._refreshMarketplace === 'function') window._refreshMarketplace();
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    MarketplaceStore.deleteProduct(id);
    showToast('Listing deleted.', 'info');
    if (typeof window._refreshMarketplace === 'function') window._refreshMarketplace();
    else {
        const card = document.querySelector(`[data-product-id="${id}"]`);
        if (card) card.remove();
    }
}
