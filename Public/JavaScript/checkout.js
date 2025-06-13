// Initialize payment method selection
function initPaymentMethods() {
    document.querySelectorAll('.payment-option').forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.payment-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            // Add selected class to clicked option
            this.classList.add('selected');
            // Check the radio button
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}

// Load cart from localStorage
function getCartObj() {
    try {
        return JSON.parse(localStorage.getItem('cartObj')) || {};
    } catch (e) { return {}; }
}

function getCart() {
    const cartObj = getCartObj();
    return cartObj.items || [];
}

function getVendorName() {
    const cartObj = getCartObj();
    return cartObj.vendorName || '';
}

// Render cart items
function renderCheckout() {
    const cart = getCart();
    const vendorName = getVendorName();
    const container = document.getElementById('order-items-container');
    let subtotal = 0;

    container.innerHTML = '';

    // Add vendor name if available
    if (vendorName) {
        const vendorDiv = document.createElement('div');
        vendorDiv.className = 'vendor-name';
        vendorDiv.textContent = `Order from: ${vendorName}`;
        container.appendChild(vendorDiv);
    }

    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
                    <div class="item-details">
                        <div class="item-image" style="background-image: url('${item.image}')"></div>
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <p>${item.category}</p>
                            <div class="item-quantity">
                                <span>Quantity: ${item.quantity}</span>
                            </div>
                            ${item.notes ? `<div class='item-notes'><em>Notes: ${item.notes}</em></div>` : ''}
                            ${item.options && Object.keys(item.options).length > 0 ? `<div class='item-options'><em>Options: ${Object.entries(item.options).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ')}</em></div>` : ''}
                        </div>
                    </div>
                    <div class="item-price">${item.price * item.quantity} EGP</div>
                `;
        container.appendChild(div);
    });

    document.getElementById('subtotal').textContent = subtotal + ' EGP';
    document.getElementById('total').textContent = subtotal + ' EGP';
}

// Handle order confirmation
async function confirmOrder() {
    try {
        const cart = getCart();
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const cartObj = getCartObj();
        // Get order notes
        const notes = document.querySelector('.notes-input').value;

        // Submit order to server
        const response = await fetch('/api/orders/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                items: cart,
                notes: notes,
                vendorId: cartObj.vendorId
            })
        });

        const data = await response.json();

        if (data.success) {
            // Clear cart from localStorage
            localStorage.removeItem('cartObj');
            // Redirect to order confirmation page with order ID
            window.location.href = `/order/confirmation?id=${data.orderId}`;
        } else {
            alert('Order failed: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error submitting order:', error);
        alert('Failed to submit order. Please try again.');
    }
}

// Initialize checkout page
function initCheckoutPage() {
    initPaymentMethods();
    renderCheckout();
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initCheckoutPage);

// Export functions for use in other files
window.checkoutUtils = {
    getCartObj,
    getCart,
    getVendorName,
    renderCheckout,
    confirmOrder,
    initCheckoutPage
};