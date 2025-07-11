document.addEventListener("DOMContentLoaded", () => {
  
  const menuTabs = document.querySelectorAll(".menu-tab")
  const menuCategories = document.querySelectorAll(".menu-category")

  
  window.activateMenuCategory = (categoryName) => {
    
    menuTabs.forEach((t) => t.classList.remove("active"));
    
    menuCategories.forEach((c) => {
      c.classList.remove("active");
      c.style.display = 'none'; 
    });

    
    const targetTab = document.querySelector(`.menu-tab[data-category="${categoryName}"]`);
    if (targetTab) {
      targetTab.classList.add("active");
    }

    
    const category = document.getElementById(categoryName);
    if (category) {
      category.classList.add("active");
      category.style.display = 'block'; 
    }
  };

  
  const initializeMenuTabListeners = () => {
    menuTabs.forEach((tab) => {
      tab.removeEventListener("click", handleMenuTabClick); 
      tab.addEventListener("click", handleMenuTabClick);
    });
  };

  const handleMenuTabClick = function() {
    const categoryId = this.getAttribute("data-category");
    window.activateMenuCategory(categoryId);
  };

  initializeMenuTabListeners();

  
  if (!document.querySelector('.menu-tab.active') && menuTabs.length > 0) {
    const firstCategory = menuTabs[0].getAttribute('data-category');
    window.activateMenuCategory(firstCategory);
  }

  
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenu = document.getElementById("mobile-menu")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")

  if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active")
    })

    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active")
    })
  }

  
  const header = document.getElementById("site-header")
  let lastScroll = 0

  if (header) {
    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset

      if (currentScroll <= 0) {
        header.classList.remove("scrolled")
        header.classList.remove("hidden")
        return
      }

      if (currentScroll > lastScroll && !header.classList.contains("hidden")) {
        
        header.classList.add("hidden")
      } else if (currentScroll < lastScroll && header.classList.contains("hidden")) {
        
        header.classList.remove("hidden")
      }

      header.classList.add("scrolled")
      lastScroll = currentScroll
    })
  }

  
  const itemModal = document.getElementById('item-modal');
  const modalClose = document.getElementById('modal-close');
  const modalItemName = document.getElementById('modal-item-name');
  const modalItemDescription = document.getElementById('modal-item-description');
  const modalQtyMinus = document.getElementById('modal-qty-minus');
  const modalQtyPlus = document.getElementById('modal-qty-plus');
  const modalQty = document.getElementById('modal-qty');
  const modalItemPrice = document.getElementById('modal-item-price');
  const modalOptionsSection = document.getElementById('modal-options-section');
  const modalNotes = document.getElementById('modal-notes');
  const modalAddToCart = document.getElementById('modal-add-to-cart');

  let currentItem = null;
  let currentQty = 1;
  let currentOptions = {};
  let pendingVendorItem = null;

  
  window.attachAddToCartListeners = () => {
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
      
      btn.removeEventListener('click', handleAddToCartClick);
      btn.addEventListener('click', handleAddToCartClick);
    });
  };

  
  const handleAddToCartClick = function(e) {
    e.preventDefault();
    currentQty = 1;
    currentOptions = {};
    currentItem = {
      id: this.dataset.id,
      name: this.dataset.name,
      price: parseFloat(this.dataset.price),
      image: this.dataset.image,
      category: this.dataset.category,
      description: this.dataset.description,
      options: [],
      vendorId: this.dataset.vendorId,
      vendorName: this.dataset.vendorName
    };
    try {
      currentItem.options = JSON.parse(this.dataset.options);
    } catch (err) {
      currentItem.options = [];
    }
    
    modalItemName.textContent = currentItem.name;
    modalItemDescription.textContent = currentItem.description;
    modalQty.textContent = currentQty;
    modalItemPrice.textContent = currentItem.price;
    modalNotes.value = '';
    
    modalOptionsSection.innerHTML = '';
    if (currentItem.options && currentItem.options.length > 0) {
      currentItem.options.forEach((opt, idx) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'modal-option-group';
        const groupTitle = document.createElement('div');
        groupTitle.innerHTML = `<strong>${opt.name}</strong> ${opt.required ? '(Choose 1)' : ''}`;
        groupDiv.appendChild(groupTitle);
        opt.choices.forEach((choice, cidx) => {
          const label = document.createElement('label');
          label.style.marginRight = '1.5em';
          const input = document.createElement('input');
          input.type = opt.required ? 'radio' : 'checkbox';
          input.name = `option_${idx}`;
          input.value = choice;
          input.addEventListener('change', function() {
            if (opt.required) {
              currentOptions[opt.name] = this.value;
            } else {
              if (!currentOptions[opt.name]) currentOptions[opt.name] = [];
              if (this.checked) {
                currentOptions[opt.name].push(this.value);
              } else {
                currentOptions[opt.name] = currentOptions[opt.name].filter(v => v !== this.value);
              }
            }
          });
          label.appendChild(input);
          label.appendChild(document.createTextNode(' ' + choice));
          groupDiv.appendChild(label);
        });
        modalOptionsSection.appendChild(groupDiv);
      });
    }
    itemModal.style.display = 'flex';
  };

  
  window.attachAddToCartListeners();

  
  modalClose.addEventListener('click', () => {
    itemModal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === itemModal) itemModal.style.display = 'none';
  });

  
  modalQtyMinus.addEventListener('click', () => {
    if (currentQty > 1) {
      currentQty--;
      modalQty.textContent = currentQty;
    }
  });
  modalQtyPlus.addEventListener('click', () => {
    currentQty++;
    modalQty.textContent = currentQty;
  });

  
  (function addVendorModal() {
    if (!document.getElementById('vendor-modal')) {
      const modal = document.createElement('div');
      modal.id = 'vendor-modal';
      modal.style.display = 'none';
      modal.style.position = 'fixed';
      modal.style.top = 0;
      modal.style.left = 0;
      modal.style.width = '100vw';
      modal.style.height = '100vh';
      modal.style.background = 'rgba(0,0,0,0.25)';
      modal.style.zIndex = 9999;
      modal.innerHTML = `
        <div style="background:#fff;max-width:400px;margin:10vh auto;padding:2rem 1.5rem;border-radius:1rem;box-shadow:0 2px 16px rgba(0,0,0,0.12);text-align:center;">
          <div id="vendor-modal-msg" style="margin-bottom:1.5rem;font-size:1.1rem;"></div>
          <button id="vendor-modal-yes" style="background:#ff8a00;color:#fff;padding:0.5rem 2rem;border:none;border-radius:2rem;font-weight:600;margin-right:1rem;">Yes, clear cart</button>
          <button id="vendor-modal-no" style="background:#eee;color:#333;padding:0.5rem 2rem;border:none;border-radius:2rem;font-weight:600;">Cancel</button>
        </div>
      `;
      document.body.appendChild(modal);
    }
  })();

  
  modalAddToCart.addEventListener('click', function() {
    
    if (currentItem.options && currentItem.options.length > 0) {
      for (const opt of currentItem.options) {
        if (opt.required && !currentOptions[opt.name]) {
          alert(`Please select a choice for ${opt.name}`);
          return;
        }
      }
    }
    const itemData = {
      id: currentItem.id,
      name: currentItem.name,
      price: currentItem.price,
      image: currentItem.image,
      category: currentItem.category,
      quantity: currentQty,
      notes: modalNotes.value,
      options: currentOptions,
      vendorId: String(currentItem.vendorId),
      vendorName: currentItem.vendorName
    };
    
    let cartObj = {};
    try {
      cartObj = JSON.parse(localStorage.getItem('cartObj')) || {};
    } catch (e) { cartObj = {}; }
    const cart = cartObj.items || [];
    
    
    if (!cartObj.vendorId) {
      cartObj.vendorId = String(itemData.vendorId);
      cartObj.vendorName = itemData.vendorName;
      cartObj.items = cart;
    }
    
    if (String(cartObj.vendorId) === String(itemData.vendorId)) {
      addItemToCart(cartObj, itemData);
      return;
    }
    
    pendingVendorItem = { cartObj, itemData };
    showVendorModal(cartObj.vendorName, function(confirmed) {
      if (confirmed && pendingVendorItem) {
        
        let { cartObj, itemData } = pendingVendorItem;
        cartObj.vendorId = String(itemData.vendorId);
        cartObj.vendorName = itemData.vendorName;
        cartObj.items = [];
        addItemToCart(cartObj, itemData);
        pendingVendorItem = null;
      }
    });
  });

  function addItemToCart(cartObj, itemData) {
    const cart = cartObj.items || [];
    
    const existingItemIndex = cart.findIndex(item => 
      item.id === itemData.id && 
      JSON.stringify(item.options) === JSON.stringify(itemData.options) &&
      item.notes === itemData.notes
    );

    if (existingItemIndex !== -1) {
      
      cart[existingItemIndex].quantity += itemData.quantity;
    } else {
      
      cart.push(itemData);
    }

    
    cartObj.items = cart;
    localStorage.setItem('cartObj', JSON.stringify(cartObj));

    
    showCartToast('Item added to cart');
    
    
    itemModal.style.display = 'none';
  }

  function showVendorModal(existingVendor, cb) {
    const modal = document.getElementById('vendor-modal');
    const msg = document.getElementById('vendor-modal-msg');
    const yesBtn = document.getElementById('vendor-modal-yes');
    const noBtn = document.getElementById('vendor-modal-no');

    msg.textContent = `Your cart contains items from ${existingVendor}. Would you like to clear your cart and add items from this vendor instead?`;
    modal.style.display = 'flex';

    yesBtn.onclick = () => {
      modal.style.display = 'none';
      cb(true);
    };
    noBtn.onclick = () => {
      modal.style.display = 'none';
      cb(false);
    };
  }

  function showCartToast(msg) {
    
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff8a00;
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 9999;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    
    toast.textContent = msg;
    toast.style.opacity = '1';

    
    setTimeout(() => {
      toast.style.opacity = '0';
    }, 2000);
  }

  
  const showReviewsBtn = document.getElementById('show-reviews-btn');
  const reviewsModal = document.getElementById('reviews-modal');
  const closeReviewsModal = document.getElementById('close-reviews-modal');
  const reviewsList = document.getElementById('reviews-list');
  const vendorId = document.body.getAttribute('data-vendor-id');

  if (showReviewsBtn && reviewsModal && closeReviewsModal && reviewsList && vendorId) {
    showReviewsBtn.onclick = async function() {
      reviewsModal.style.display = 'flex';
      reviewsList.innerHTML = 'Loading...';
      try {
        const res = await fetch(`/api/reviews/vendor/${vendorId}`);
        const reviews = await res.json();
        if (Array.isArray(reviews) && reviews.length > 0) {
          reviewsList.innerHTML = reviews.map(r => `
            <div class="review-item" style="text-align:left; margin-bottom:1.5rem; border-bottom:1px solid #eee; padding-bottom:1rem;">
              <div style="font-weight:600; color:#e29127; margin-bottom:0.3rem;">${r.userId?.name || 'User'}</div>
              <div style="color:#FFD700; font-size:1.2rem; margin-bottom:0.2rem;">
                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
              </div>
              <div style="color:#333;">${r.comment ? r.comment : '<em>No comment</em>'}</div>
              <div style="font-size:0.85rem; color:#888; margin-top:0.2rem;">${new Date(r.createdAt).toLocaleString()}</div>
            </div>
          `).join('');
        } else {
          reviewsList.innerHTML = '<div style="color:#888;">No reviews yet for this restaurant.</div>';
        }
      } catch (err) {
        reviewsList.innerHTML = '<div style="color:#c00;">Error loading reviews.</div>';
      }
    };
    closeReviewsModal.onclick = function() {
      reviewsModal.style.display = 'none';
    };
    window.onclick = function(event) {
      if (event.target === reviewsModal) reviewsModal.style.display = 'none';
    };
  }
})
