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

function renderCart() {
  const cart = getCart();
  const cartList = document.getElementById('cart-items-list');
  const emptyCartMsg = document.getElementById('empty-cart-msg');
  const cartCountLabel = document.getElementById('cart-count-label');
  const cartSubtotal = document.getElementById('cart-subtotal');
  const cartTotal = document.getElementById('cart-total');

  cartList.innerHTML = '';
  let subtotal = 0;

  if (cart.length === 0) {
    emptyCartMsg.style.display = 'block';
  } else {
    emptyCartMsg.style.display = 'none';
  }

  cartCountLabel.textContent = `Items (${cart.length})`;

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
                        <button class="qty-btn" data-idx="${idx}" data-change="-1">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" data-idx="${idx}" data-change="1">+</button>
                    </div>
                    ${item.notes ? `<div class='item-notes'><em>Notes: ${item.notes}</em></div>` : ''}
                    ${item.options && Object.keys(item.options).length > 0 ? `<div class='item-options'><em>Options: ${Object.entries(item.options).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ')}</em></div>` : ''}
                </div>
            </div>
            <div class="item-price">
                <p>${item.price * item.quantity} EGP</p>
                <button class="remove-item" data-idx="${idx}">🗑</button>
            </div>
        `;
    cartList.appendChild(div);
  });

  cartSubtotal.textContent = subtotal + ' EGP';
  cartTotal.textContent = subtotal + ' EGP';
}

// Quantity change
document.getElementById('cart-items-list').addEventListener('click', function(e) {
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

function clearCart() {
  setCartObj({});
  renderCart();
}

function proceedToCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert('Your cart is empty!');
    return;
  }
  window.location.href = '/checkout';
}

// Initial render
document.addEventListener('DOMContentLoaded', function() {
  renderCart();
});

// Export functions for use in other files
window.cartUtils = {
  getCartObj,
  setCartObj,
  getCart,
  renderCart,
  clearCart,
  proceedToCheckout
};