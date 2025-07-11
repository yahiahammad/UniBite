document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('menu-search-input');
    const clearSearchIcon = document.querySelector('.clear-search-icon');
    const searchResults = document.getElementById('menu-search-results');
    const menuCategories = document.querySelectorAll('.menu-category');
    const menuTabs = document.querySelectorAll('.menu-tab');
    const vendorId = document.body.getAttribute('data-vendor-id');

    let searchTimeout;

    
    function resetMenuToInitialCategoryView() {
        searchResults.style.display = 'none'; 

        
        menuTabs.forEach(tab => {
            tab.style.display = 'block'; 
            tab.classList.remove('active'); 
        });

        
        menuCategories.forEach((category, index) => {
            if (index === 0) {
                category.style.display = 'block'; 
                if (menuTabs.length > 0) {
                    menuTabs[0].classList.add('active'); 
                }
            } else {
                category.style.display = 'none'; 
            }
        });
    }

    
    function toggleClearIcon() {
        if (searchInput.value.trim()) {
            clearSearchIcon.classList.add('visible');
        } else {
            clearSearchIcon.classList.remove('visible');
        }
    }

    
    function renderSearchResults(items) {
        
        menuCategories.forEach(category => {
            category.style.display = 'none';
        });
        menuTabs.forEach(tab => {
            tab.style.display = 'none'; 
        });

        
        searchResults.style.display = 'block';

        if (!items || items.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No items found</div>';
            return;
        }

        const resultsHTML = `
            <div class="menu-grid">
                ${items.map(item => `
                    <div class="menu-item">
                        <div class="menu-item-image">
                            <img src="${item.imageURL || '/Images/default-menu-item.jpg'}" alt="${item.name}">
                        </div>
                        <div class="menu-item-content">
                            <div class="menu-item-header">
                                <h3>${item.name}</h3>
                                <span class="menu-item-price">${item.price} EGP</span>
                            </div>
                            <p class="menu-item-description">${item.description || ''}</p>
                            <button class="add-to-cart-btn plus-btn"
                                    data-id="${item._id}"
                                    data-name="${item.name}"
                                    data-price="${item.price}"
                                    data-image="${item.imageURL || '/Images/default-menu-item.jpg'}"
                                    data-category="${item.category}"
                                    data-description="${item.description || ''}"
                                    data-options='${JSON.stringify(item.options || [])}'
                                    data-vendor-id="${vendorId}"
                                    title="Add to Cart">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="12" cy="12" r="12" fill="#ff8a00"/>
                                    <path d="M12 7V17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                    <path d="M7 12H17" stroke="white" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        searchResults.innerHTML = resultsHTML;
        
        
        if (typeof window.attachAddToCartListeners === 'function') {
            window.attachAddToCartListeners();
        }
    }

    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        toggleClearIcon();

        
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        if (!query) {
            searchResults.innerHTML = '';
            resetMenuToInitialCategoryView(); 
            return;
        }

        
        searchTimeout = setTimeout(async () => {
            try {
                
                menuCategories.forEach(category => {
                    category.style.display = 'none';
                });
                menuTabs.forEach(tab => {
                    tab.style.display = 'none';
                });

                const response = await fetch(`/api/menu-items/search/${vendorId}?query=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                const items = await response.json();
                
                renderSearchResults(items); 
            } catch (error) {
                console.error('Search error:', error);
                searchResults.innerHTML = '<div class="error">Error performing search</div>';
                searchResults.style.display = 'block'; 
            }
        }, 300); 
    });

    
    clearSearchIcon.addEventListener('click', function() {
        searchInput.value = '';
        searchResults.innerHTML = '';
        clearSearchIcon.classList.remove('visible');
        resetMenuToInitialCategoryView(); 
    });

    
    toggleClearIcon();
    resetMenuToInitialCategoryView(); 
}); 