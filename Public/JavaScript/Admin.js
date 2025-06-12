// Application State
let restaurantStatus = 'closed';
let orders = [];
let menuItems = [];
let pendingStatusChange = null;

// DOM Elements
let menuToggle;
const sidebar = document.querySelector('.sidebar');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const statusIndicator = document.getElementById('statusIndicator');
const statusConfirmModal = document.getElementById('statusConfirmModal');
const statusConfirmMessage = document.getElementById('statusConfirmMessage');
const confirmStatusChange = document.getElementById('confirmStatusChange');
const cancelStatusChange = document.getElementById('cancelStatusChange');

// Create overlay element
const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);

// Create menu toggle button
function createMenuToggle() {
    menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);
}

// Helper function to get auth headers
const getAuthHeaders = () => {
    return {
        'Content-Type': 'application/json'
    };
};

// Check authentication
function checkAuth() {
    return true; // Temporarily bypass auth check
}

// Toggle sidebar
function toggleSidebar() {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

// Show status confirmation modal
function showStatusConfirmation(currentStatus, newStatus) {
    statusConfirmMessage.textContent = `Are you sure you want to change the status from "${currentStatus}" to "${newStatus}"?`;
    statusConfirmModal.style.display = 'block';
    pendingStatusChange = newStatus;
}

// Hide status confirmation modal
function hideStatusConfirmation() {
    statusConfirmModal.style.display = 'none';
    pendingStatusChange = null;
}

// Handle status change confirmation
async function handleStatusChange() {
    if (!pendingStatusChange) return;

    try {
        const response = await fetch('/api/admin/vendor/status', {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status: pendingStatusChange })
        });

        if (!response.ok) {
            throw new Error('Failed to update status');
        }

        const data = await response.json();
        updateRestaurantStatusDisplay(data.status);
        hideStatusConfirmation();
    } catch (error) {
        console.error('Error updating status:', error);
        alert('Failed to update restaurant status');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    // Close sidebar when clicking overlay
    overlay.addEventListener('click', () => {
        toggleSidebar();
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target) &&
            sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    });

    // Navigation
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);

            // Update active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Close sidebar on mobile after navigation
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    // Status controls
    const statusControls = document.querySelector('.status-controls');
    if (statusControls) {
        statusControls.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const newStatus = button.dataset.status;
            if (!newStatus) return;

            // Get current status
            const currentStatus = statusIndicator.textContent.toLowerCase();

            // Skip if clicking the same status
            if (currentStatus === newStatus) return;

            // Show confirmation modal
            showStatusConfirmation(currentStatus, newStatus);
        });
    }

    // Status confirmation modal events
    confirmStatusChange?.addEventListener('click', handleStatusChange);
    cancelStatusChange?.addEventListener('click', hideStatusConfirmation);

    // Close modal when clicking the X or outside
    const closeButtons = document.querySelectorAll('.modal .close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            hideStatusConfirmation();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === statusConfirmModal) {
            hideStatusConfirmation();
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    });
}

// Show selected section
function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    // Update content based on section
    switch (sectionId) {
        case 'dashboard':
            updateDashboard();
            fetchAndRenderRecentOrders();
            break;
        case 'orders':
            fetchAndRenderOrders();
            break;
        case 'menu':
            loadMenuItems();
            break;
    }
}

// Update dashboard with latest stats
async function updateDashboard() {
    try {
        const headers = getAuthHeaders();

        const response = await fetch('/api/admin/stats', {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin-login';
                return;
            }
            throw new Error('Failed to fetch stats');
        }

        const stats = await response.json();
        updateStatsDisplay(stats);
        fetchAndRenderRecentOrders();

    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update stats display
function updateStatsDisplay(stats) {
    document.querySelector('.stat-card:nth-child(1) p').textContent = stats.totalOrders;
    document.querySelector('.stat-card:nth-child(2) p').textContent = stats.todayOrders;
    document.querySelector('.stat-card:nth-child(3) p').textContent = `$${stats.totalRevenue.toFixed(2)}`;
    document.querySelector('.stat-card:nth-child(4) p').textContent = `$${stats.todayRevenue.toFixed(2)}`;
}

// Fetch and render recent orders
async function fetchAndRenderRecentOrders() {
    try {
        const headers = getAuthHeaders();
        const response = await fetch('/api/admin/recent-orders', {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin-login';
                return;
            }
            throw new Error('Failed to fetch recent orders');
        }

        const recentOrders = await response.json();
        const recentOrdersGrid = document.getElementById('recentOrdersGrid');

        if (!recentOrdersGrid) {
            console.error('Recent orders grid element not found');
            return;
        }

        if (recentOrders.length === 0) {
            recentOrdersGrid.innerHTML = '<p class="no-orders">No recent orders found</p>';
            return;
        }

        recentOrdersGrid.innerHTML = '';
        recentOrders.forEach(order => {
            const orderCard = createOrderCard(order);
            recentOrdersGrid.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error fetching recent orders:', error);
        const recentOrdersGrid = document.getElementById('recentOrdersGrid');
        if (recentOrdersGrid) {
            recentOrdersGrid.innerHTML = '<p class="no-orders">Error loading recent orders. Please try again.</p>';
        }
    }
}

// Fetch and render all orders
async function fetchAndRenderOrders() {
    try {
        const headers = getAuthHeaders();
        const response = await fetch('/api/admin/orders', {
            headers: headers
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin-login';
                return;
            }
            throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        const ordersGrid = document.getElementById('allOrdersGrid');

        if (!ordersGrid) {
            console.error('Orders grid element not found');
            return;
        }

        if (data.orders.length === 0) {
            ordersGrid.innerHTML = '<p class="no-orders">No orders found</p>';
            return;
        }

        ordersGrid.innerHTML = '';
        data.orders.forEach(order => {
            const orderCard = createOrderCard(order);
            ordersGrid.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        const ordersGrid = document.getElementById('allOrdersGrid');
        if (ordersGrid) {
            ordersGrid.innerHTML = '<p class="no-orders">Error loading orders. Please try again.</p>';
        }
    }
}

// Create order card element
function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = order._id;
    card.innerHTML = `
        <div class="order-header">
            <h3>Order #${order._id.toString().slice(-6)}</h3>
            <span class="order-time">${new Date(order.orderTime).toLocaleString()}</span>
        </div>
        <div class="order-status status-${order.status}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </div>
        <div class="order-items">
            ${order.items.map(item => `
                <div class="order-item">
                    <span class="order-item-quantity">${item.quantity}x</span>
                    <span class="order-item-name">${item.nameAtOrder}</span>
                    <span class="order-item-price">$${(item.priceAtOrder * item.quantity).toFixed(2)}</span>
                </div>
            `).join('')}
        </div>
        <div class="order-footer">
            <div class="customer-info">
                <i class="fas fa-user"></i>
                ${order.userId ? order.userId.name : 'Unknown User'}
            </div>
            <div class="order-total">
                Total: $${order.totalPrice.toFixed(2)}
            </div>
        </div>
        <div class="order-actions">
            ${getOrderActionButtons(order)}
        </div>
    `;

    // Add click event to show modal
    card.addEventListener('click', (e) => {
        // Don't show modal if clicking action buttons
        if (e.target.closest('.order-actions')) return;
        showOrderModal(order);
    });

    return card;
}

// Show order modal
function showOrderModal(order) {
    // Remove any existing modals to prevent duplicates
    const existingModal = document.querySelector('.order-modal');
    if (existingModal) {
        existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'order-modal';
    modal.innerHTML = `
        <div class="order-modal-content">
            <div class="order-modal-header">
                <h3>Order #${order._id.toString().slice(-6)}</h3>
                <button class="close">&times;</button>
            </div>
            <div class="order-modal-body">
                <div class="order-details-grid">
                    <div class="order-detail-item">
                        <span class="order-detail-label">Order Time</span>
                        <span class="order-detail-value">${new Date(order.orderTime).toLocaleString()}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Pickup Time</span>
                        <span class="order-detail-value">${order.pickupTime ? new Date(order.pickupTime).toLocaleString() : 'N/A'}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Status</span>
                        <span class="order-detail-value status-${order.status}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Payment Status</span>
                        <span class="order-detail-value">${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span>
                    </div>
                    <div class="order-detail-item">
                        <span class="order-detail-label">Customer</span>
                        <span class="order-detail-value">${order.userId ? order.userId.name : 'Unknown User'}</span>
                    </div>
                    ${order.userId && order.userId.email ? `
                    <div class="order-detail-item">
                        <span class="order-detail-label">Customer Email</span>
                        <span class="order-detail-value">${order.userId.email}</span>
                    </div>
                    ` : ''}
                    <div class="order-detail-item">
                        <span class="order-detail-label">Order Total</span>
                        <span class="order-detail-value">$${order.totalPrice.toFixed(2)}</span>
                    </div>
                </div>
                <div class="order-items-list">
                    <h4>Order Items</h4>
                    ${order.items.map(item => {
        const itemName = item.menuItemId ? item.menuItemId.name : item.nameAtOrder || 'Unknown Item';
        const itemPrice = item.menuItemId ? item.menuItemId.price : item.priceAtOrder || 0;
        return `
                        <div class="order-item-detail">
                            <span class="order-item-quantity">${item.quantity}x</span>
                            <span class="order-item-name">${itemName}</span>
                            <span class="order-item-price">$${(itemPrice * item.quantity).toFixed(2)}</span>
                        </div>
                        `;
    }).join('')}
                </div>
                ${order.notes ? `
                    <div class="order-notes">
                        <h4>Notes</h4>
                        <p>${order.notes}</p>
                    </div>
                ` : ''}
            </div>
            <div class="order-modal-footer">
                ${getOrderActionButtons(order)}
                <button class="btn btn-secondary close-modal">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);

    // Add event listeners for closing modal
    const closeButtons = modal.querySelectorAll('.close, .close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    });

    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });

    // Close modal with escape key
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}

// Get order action buttons based on status
function getOrderActionButtons(order) {
    const buttons = [];

    switch (order.status) {
        case 'pending':
            buttons.push(`
                <button class="status-action-btn btn-accept" onclick="event.stopPropagation(); updateOrderStatus('${order._id}', 'preparing')">
                    <i class="fas fa-check"></i>
                    Accept Order
                </button>
            `);
            break;
        case 'preparing':
            buttons.push(`
                <button class="status-action-btn btn-ready" onclick="event.stopPropagation(); updateOrderStatus('${order._id}', 'ready for pickup')">
                    <i class="fas fa-utensils"></i>
                    Mark Ready
                </button>
            `);
            break;
        case 'ready for pickup':
            buttons.push(`
                <button class="status-action-btn btn-complete" onclick="event.stopPropagation(); updateOrderStatus('${order._id}', 'picked up')">
                    <i class="fas fa-check-double"></i>
                    Complete Order
                </button>
            `);
            break;
        case 'picked up':
        case 'cancelled':
            buttons.push(`
                <button class="status-action-btn btn-secondary" disabled>
                    No Actions
                </button>
            `);
            break;
    }

    return buttons.join('');
}

// Update order status
async function updateOrderStatus(orderId, newStatus) {
    try {
        const headers = getAuthHeaders();
        const response = await fetch(`/api/admin/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/admin-login';
                return;
            }
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update order status');
        }

        // Fetch the updated order to refresh all its details
        const updatedOrderResponse = await fetch(`/api/admin/orders/${orderId}`, { headers: getAuthHeaders() });
        if (!updatedOrderResponse.ok) {
            throw new Error('Failed to fetch updated order details');
        }
        const updatedOrder = await updatedOrderResponse.json();

        // Update the order card in the UI
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            const newOrderCard = createOrderCard(updatedOrder);
            orderCard.replaceWith(newOrderCard);
        }

        // Update the order modal if it's open
        const currentModal = document.querySelector('.order-modal.show');
        if (currentModal && currentModal.querySelector(`h3`).textContent.includes(orderId.toString().slice(-6))) {
            currentModal.remove(); // Remove existing modal
            showOrderModal(updatedOrder); // Show new modal with updated data
        }

        // Refresh the orders list if it's the active section (for all orders view)
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'orders') {
            fetchAndRenderOrders();
        }

        // Also update dashboard stats as revenue/today's orders might change
        updateDashboard();

        // Show success message
        showNotification('Order status updated successfully', 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to update order status', 'error');
    }
}

// Update restaurant status display
function updateRestaurantStatusDisplay(status) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator status-${status}`;
        statusIndicator.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">${type === 'success' ? 'Success' : 'Error'}</div>
        <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Menu Management Functions
let itemToDelete = null;
let menuItemModal;
let deleteConfirmModal;

// Load menu items
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu-items/vendor', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
            throw new Error('Failed to load menu items');
        }
        menuItems = await response.json();
        renderMenuItems();
    } catch (error) {
        console.error('Error loading menu items:', error);
        showNotification('Failed to load menu items', 'error');
    }
}

// Render menu items in table
function renderMenuItems() {
    const tbody = document.getElementById('menuItemsTable');
    if (!tbody) return;

    tbody.innerHTML = menuItems.map(item => `
        <tr>
            <td>
                <img src="${item.imageURL || '/Images/default-food.jpg'}" 
                     alt="${item.name}" 
                     style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td>${item.name}</td>
            <td>${item.description || ''}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.category || ''}</td>
            <td>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" 
                           ${item.available ? 'checked' : ''}
                           onchange="toggleAvailability('${item._id}', this.checked)">
                </div>
            </td>
            <td>
                <button class="btn btn-sm btn-primary me-2" onclick="editMenuItem('${item._id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="showDeleteConfirm('${item._id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Open add item modal
function openAddItemModal() {
    document.getElementById('modalTitle').textContent = 'Add New Menu Item';
    document.getElementById('menuItemForm').reset();
    document.getElementById('itemId').value = '';
    menuItemModal.show();
}

// Edit menu item
function editMenuItem(id) {
    const item = menuItems.find(i => i._id === id);
    if (!item) return;

    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemId').value = item._id;
    document.getElementById('name').value = item.name;
    document.getElementById('description').value = item.description || '';
    document.getElementById('price').value = item.price;
    document.getElementById('category').value = item.category || '';
    document.getElementById('available').checked = item.available;

    menuItemModal.show();
}

// Save menu item
async function saveMenuItem() {
    const formData = new FormData();
    const id = document.getElementById('itemId').value;

    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('category', document.getElementById('category').value);
    formData.append('available', document.getElementById('available').checked);

    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const url = id ? `/api/menu-items/${id}` : '/api/menu-items';
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });

        if (!response.ok) throw new Error('Failed to save menu item');

        menuItemModal.hide();
        await loadMenuItems();
        showNotification('Menu item saved successfully');
    } catch (error) {
        console.error('Error saving menu item:', error);
        showNotification('Failed to save menu item', 'error');
    }
}

// Toggle item availability
async function toggleAvailability(id, available) {
    try {
        const response = await fetch(`/api/menu-items/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ available })
        });

        if (!response.ok) throw new Error('Failed to update availability');
        await loadMenuItems();
        showNotification('Availability updated successfully');
    } catch (error) {
        console.error('Error updating availability:', error);
        showNotification('Failed to update availability', 'error');
    }
}

// Show delete confirmation
function showDeleteConfirm(id) {
    itemToDelete = id;
    deleteConfirmModal.show();
}

// Confirm delete
async function confirmDelete() {
    if (!itemToDelete) return;

    try {
        const response = await fetch(`/api/menu-items/${itemToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Failed to delete menu item');

        deleteConfirmModal.hide();
        await loadMenuItems();
        showNotification('Menu item deleted successfully');
    } catch (error) {
        console.error('Error deleting menu item:', error);
        showNotification('Failed to delete menu item', 'error');
    } finally {
        itemToDelete = null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modal instances
    menuItemModal = new bootstrap.Modal(document.getElementById('menuItemModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    // Check authentication first
    if (!checkAuth()) return;

    // Create menu toggle button for mobile
    createMenuToggle();

    setupEventListeners();
    showSection('dashboard'); // Show dashboard by default

    // Set up periodic updates
    setInterval(() => {
        if (checkAuth()) {
            const activeSection = document.querySelector('.section.active');
            if (activeSection) {
                switch (activeSection.id) {
                    case 'dashboard':
                        updateDashboard();
                        break;
                    case 'orders':
                        fetchAndRenderOrders();
                        break;
                }
            }
        }
    }, 30000); // Update every 30 seconds
});