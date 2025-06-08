document.addEventListener("DOMContentLoaded", () => {
  // Menu tabs functionality
  const menuTabs = document.querySelectorAll(".menu-tab")
  const menuCategories = document.querySelectorAll(".menu-category")

  menuTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and categories
      menuTabs.forEach((t) => t.classList.remove("active"))
      menuCategories.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab
      tab.classList.add("active")

      // Show corresponding category
      const categoryId = tab.getAttribute("data-category")
      const category = document.getElementById(categoryId)
      if (category) {
        category.classList.add("active")
      }
    })
  })

  // Mobile menu toggle
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

  // Header scroll effect
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
        // Scrolling down
        header.classList.add("hidden")
      } else if (currentScroll < lastScroll && header.classList.contains("hidden")) {
        // Scrolling up
        header.classList.remove("hidden")
      }

      header.classList.add("scrolled")
      lastScroll = currentScroll
    })
  }

  // Add to cart modal logic
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

  // Open modal on Add to Cart button click
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
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
      // Fill modal
      modalItemName.textContent = currentItem.name;
      modalItemDescription.textContent = currentItem.description;
      modalQty.textContent = currentQty;
      modalItemPrice.textContent = currentItem.price;
      modalNotes.value = '';
      // Render options
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
    });
  });

  // Modal close
  modalClose.addEventListener('click', () => {
    itemModal.style.display = 'none';
  });
  window.addEventListener('click', (e) => {
    if (e.target === itemModal) itemModal.style.display = 'none';
  });

  // Quantity logic
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

  // Add a modal for vendor conflict
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

  // Add to cart from modal
  modalAddToCart.addEventListener('click', function() {
    // Validate required options
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
    // --- localStorage cart logic with vendor enforcement ---
    let cartObj = {};
    try {
      cartObj = JSON.parse(localStorage.getItem('cartObj')) || {};
    } catch (e) { cartObj = {}; }
    const cart = cartObj.items || [];
    // Debug logs
    console.log('Current item vendorId:', itemData.vendorId);
    console.log('Cart vendorId:', cartObj.vendorId);
    // If cart is empty or vendorId is not set, set vendorId/vendorName
    if (!cartObj.vendorId) {
      cartObj.vendorId = String(itemData.vendorId);
      cartObj.vendorName = itemData.vendorName;
      cartObj.items = cart;
      console.log('Set cartObj.vendorId to', cartObj.vendorId);
    }
    // If vendor matches, add as usual
    if (String(cartObj.vendorId) === String(itemData.vendorId)) {
      addItemToCart(cartObj, itemData);
      return;
    }
    // If vendor does not match, show modal and store pending item
    pendingVendorItem = { cartObj, itemData };
    showVendorModal(cartObj.vendorName, function(confirmed) {
      if (confirmed && pendingVendorItem) {
        // Clear cart and add new item
        let { cartObj, itemData } = pendingVendorItem;
        cartObj.vendorId = String(itemData.vendorId);
        cartObj.vendorName = itemData.vendorName;
        cartObj.items = [];
        addItemToCart(cartObj, itemData);
        pendingVendorItem = null;
      } else {
        itemModal.style.display = 'none';
        pendingVendorItem = null;
      }
    });
  });

  function addItemToCart(cartObj, itemData) {
    let cart = cartObj.items || [];
    // Check for existing item (same id, options, notes)
    const matchIndex = cart.findIndex(item =>
      item.id === itemData.id &&
      JSON.stringify(item.options) === JSON.stringify(itemData.options) &&
      (item.notes || '') === (itemData.notes || '')
    );
    if (matchIndex !== -1) {
      cart[matchIndex].quantity += itemData.quantity;
    } else {
      cart.push(itemData);
    }
    cartObj.items = cart;
    localStorage.setItem('cartObj', JSON.stringify(cartObj));
    itemModal.style.display = 'none';
    showCartToast('Added to cart!');
  }

  function showVendorModal(existingVendor, cb) {
    const modal = document.getElementById('vendor-modal');
    const msg = document.getElementById('vendor-modal-msg');
    msg.textContent = `You already have an ongoing cart from ${existingVendor}. Do you want to clear it and start a new cart?`;
    modal.style.display = 'block';
    document.getElementById('vendor-modal-yes').onclick = function() {
      modal.style.display = 'none';
      cb(true);
    };
    document.getElementById('vendor-modal-no').onclick = function() {
      modal.style.display = 'none';
      cb(false);
    };
  }

  // Toast feedback
  function showCartToast(msg) {
    let toast = document.getElementById('cart-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.style.position = 'fixed';
      toast.style.bottom = '2rem';
      toast.style.right = '2rem';
      toast.style.background = '#ff8a00';
      toast.style.color = 'white';
      toast.style.padding = '1rem 2rem';
      toast.style.borderRadius = '2rem';
      toast.style.fontWeight = '600';
      toast.style.zIndex = 9999;
      toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.12)';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 1500);
  }
})
