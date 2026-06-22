document.addEventListener("DOMContentLoaded", () => {
    // Define path to my json file
    const jsonPath = 'data/marketplace.json';
    
    // Initiate the fetch request
    fetch(jsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(products => {
            renderMarketplaceCards(products);
        })
        .catch(error => {
            console.error('Error fetching marketplace data:', error);
            
            const container = document.getElementById('product-container');
            if (container) {
                container.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-danger fw-medium">
                            Unable to load marketplace products at this time.
                        </p>
                    </div>`;
            }
        });
});

/**
 * @param {Array} products 
 */
function renderMarketplaceCards(products) {
    const container = document.getElementById('product-container');
    
    if (!container) return;

    container.innerHTML = '';

    // Loop through the data and build out the HTML structure
    products.forEach(product => {
        const cardHTML = `
            <div class="col-sm-6 col-md-4 col-lg-3">
                <div class="card h-100 product-card border shadow-sm">
                    <div class="img-container">
                        <img src="${product.image}"
                             class="card-img-top"
                             alt="${product.alt || product.title}">
                    </div>
                    <div class="card-body d-flex flex-column p-4">
                        <h5 class="card-title fw-bold text-navy mb-1">
                            ${product.title}
                        </h5>
                        <p class="seller-text text-muted mb-4">
                            Sold by ${product.seller}
                        </p>
                        <div class="mt-auto d-flex justify-content-between align-items-center">
                            <span class="price-text fw-bold">${product.price}</span>
                            <a href="${product.link}" class="btn btn-orange-sm rounded-3 fw-medium">
                                Buy Now
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}