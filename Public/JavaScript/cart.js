// cart.js

document.addEventListener('DOMContentLoaded', function() {
  const cartList = document.getElementById('cart-items-list');
  const cartCount = document.getElementById('cart-count');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');
  const emptyCartMsg = document.getElementById('empty-cart-msg');
  const clearCartBtn = document.getElementById('clear-cart-btn');
  const checkoutBtn = document.getElementById('checkout-btn');

  function getCartObj() {
    try {
      return JSON.parse(localStorage.getItem('cartObj')) || {};
    } catch (e) { return {}; }
  }
  function setCartObj(cartObj) {
    localStorage.setItem('cartObj', JSON.stringify(cartObj));
  }
  function getCart() {
    const cartObj = getCartObj();
    return cartObj.items || [];
  }
  function getVendorName() {
    const cartObj = getCartObj();
    return cartObj.vendorName || '';
  }

  function renderCart() {
    const cart = getCart();
    const vendorName = getVendorName();
    const vendorNameDiv = document.getElementById('cart-vendor-name');
    const cartCountLabel = document.getElementById('cart-count-label');
    const cartList = document.getElementById('cart-items-list');
    cartList.innerHTML = ''; // Clear only the items list

    // Set vendor name and item count
    if (vendorName) {
      vendorNameDiv.textContent = vendorName;
      vendorNameDiv.style.display = '';
    } else {
      vendorNameDiv.textContent = '';
      vendorNameDiv.style.display = 'none';
    }
    cartCountLabel.textContent = cart.length > 0 ? `Items (${cart.length})` : '';

    let subtotal = 0;
    if (cart.length === 0) {
      emptyCartMsg.style.display = 'block';
    } else {
      emptyCartMsg.style.display = 'none';
    }
    cart.forEach((item, idx) => {
      subtotal += item.price * item.quantity;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <div class="item-details">
          <div class="item-image" style="background-image: url('${item.image}')"></div>
          <div class="item-info">
            <h4>${item.name}</h4>
            <p>${item.category}</p>
            <div class="item-quantity">
              <button class="qty-btn" data-idx="${idx}" data-change="-1" aria-label="Decrease quantity">-</button>
              <span>${item.quantity}</span>
              <button class="qty-btn" data-idx="${idx}" data-change="1" aria-label="Increase quantity">+</button>
            </div>
            ${item.notes ? `<div class='item-notes'><em>Notes: ${item.notes}</em></div>` : ''}
            ${item.options && Object.keys(item.options).length > 0 ? `<div class='item-options'><em>Options: ${Object.entries(item.options).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ')}</em></div>` : ''}
          </div>
        </div>
        <div class="item-price">
          <p>${item.price} EGP</p>
          <button class="remove-item" data-idx="${idx}" aria-label="Remove item">🗑</button>
        </div>
      `;
      cartList.appendChild(div);
    });
    cartSubtotal.textContent = subtotal + ' EGP';
    cartTotal.textContent = subtotal + ' EGP';
  }

  // Quantity change
  cartList.addEventListener('click', function(e) {
    if (e.target.classList.contains('qty-btn')) {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      const change = parseInt(e.target.getAttribute('data-change'));
      let cartObj = getCartObj();
      let cart = cartObj.items || [];
      if (cart[idx]) {
        cart[idx].quantity += change;
        if (cart[idx].quantity <= 0) cart.splice(idx, 1);
        cartObj.items = cart;
        setCartObj(cartObj);
        renderCart();
      }
    }
    if (e.target.classList.contains('remove-item')) {
      const idx = parseInt(e.target.getAttribute('data-idx'));
      let cartObj = getCartObj();
      let cart = cartObj.items || [];
      cart.splice(idx, 1);
      cartObj.items = cart;
      setCartObj(cartObj);
      renderCart();
    }
  });

  // Clear cart
  clearCartBtn.addEventListener('click', function() {
    setCartObj({});
    renderCart();
  });

  // Checkout
  checkoutBtn.addEventListener('click', async function() {
    const cart = getCart();
    if (cart.length === 0) {
      alert('Your cart is empty!');
      return;
    }
    try {
      const res = await fetch('/api/orders/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart })
      });
      const data = await res.json();
      if (data.success) {
        setCartObj({});
        window.location.href = '/order/confirmation';
      } else {
        alert('Order failed: ' + (data.message || 'Unknown error'));
      }
    } catch (e) {
      alert('Order failed. Please try again.');
    }
  });

  renderCart();
}); 