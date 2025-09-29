let restaurantStatus = 'closed';
let orders = [];
let menuItems = [];
let pendingStatusChange = null;


let menuToggle;
const sidebar = document.querySelector('.sidebar');
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.section');
const statusIndicator = document.getElementById('statusIndicator');
const statusConfirmModal = document.getElementById('statusConfirmModal');
const statusConfirmMessage = document.getElementById('statusConfirmMessage');
const confirmStatusChange = document.getElementById('confirmStatusChange');
const cancelStatusChange = document.getElementById('cancelStatusChange');


const overlay = document.createElement('div');
overlay.className = 'sidebar-overlay';
document.body.appendChild(overlay);


function createMenuToggle() {
    menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
    document.body.appendChild(menuToggle);
}


const getAuthHeaders = () => {
    return {
        'Content-Type': 'application/json'
    };
};


function checkAuth() {
    return true; 
}


function toggleSidebar() {
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}


function showStatusConfirmation(currentStatus, newStatus) {
    statusConfirmMessage.textContent = `Are you sure you want to change the status from "${currentStatus}" to "${newStatus}"?`;
    statusConfirmModal.style.display = 'block';
    pendingStatusChange = newStatus;
}


function hideStatusConfirmation() {
    statusConfirmModal.style.display = 'none';
    pendingStatusChange = null;
}


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


function setupEventListeners() {
    
    menuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleSidebar();
    });

    
    overlay.addEventListener('click', () => {
        toggleSidebar();
    });

    
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !menuToggle.contains(e.target) &&
            sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    });

    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const section = item.dataset.section;
            showSection(section);

            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });

    
    const statusControls = document.querySelector('.status-controls');
    if (statusControls) {
        statusControls.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const newStatus = button.dataset.status;
            if (!newStatus) return;

            
            const currentStatus = statusIndicator.textContent.toLowerCase();

            
            if (currentStatus === newStatus) return;

            
            showStatusConfirmation(currentStatus, newStatus);
        });
    }

    
    confirmStatusChange?.addEventListener('click', handleStatusChange);
    cancelStatusChange?.addEventListener('click', hideStatusConfirmation);

    
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

    
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('show');
            overlay.classList.remove('show');
        }
    });

    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('show')) {
            toggleSidebar();
        }
    });
}


function showSection(sectionId) {
    sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === sectionId) {
            section.classList.add('active');
        }
    });

    
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


function updateStatsDisplay(stats) {
    document.querySelector('.stat-card:nth-child(1) p').textContent = stats.totalOrders;
    document.querySelector('.stat-card:nth-child(2) p').textContent = stats.todayOrders;
    document.querySelector('.stat-card:nth-child(3) p').textContent = `${stats.totalRevenue.toFixed(2)} EGP`;
    document.querySelector('.stat-card:nth-child(4) p').textContent = `${stats.todayRevenue.toFixed(2)} EGP`;
}


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


async function fetchAndRenderOrders(page = 1) {
    try {
        const headers = getAuthHeaders();
        const input = document.getElementById('ordersSearchInput');
        const q = input && input.value.trim() ? `&q=${encodeURIComponent(input.value.trim())}` : '';
        const response = await fetch(`/api/admin/orders?page=${page}&limit=15${q}`, {
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
        const paginationContainer = document.getElementById('ordersPagination');

        if (!ordersGrid) {
            console.error('Orders grid element not found');
            return;
        }

        if (data.orders.length === 0) {
            ordersGrid.innerHTML = q ? '<p class="no-orders">No matching orders found</p>' : '<p class="no-orders">No orders found</p>';
            paginationContainer.innerHTML = '';
            return;
        }

        
        ordersGrid.innerHTML = '';
        data.orders.forEach(order => {
            if (order.status === 'cancelled') return; // skip cancelled
            const orderCard = createOrderCard(order);
            ordersGrid.appendChild(orderCard);
        });

        
        const totalPages = Math.ceil(data.total / 15);
        updatePagination(page, totalPages);
    } catch (error) {
        console.error('Error fetching orders:', error);
        const ordersGrid = document.getElementById('allOrdersGrid');
        if (ordersGrid) {
            ordersGrid.innerHTML = '<p class="no-orders">Error loading orders. Please try again.</p>';
        }
    }
}


function updatePagination(currentPage, totalPages) {
    const paginationContainer = document.getElementById('ordersPagination');
    if (!paginationContainer) return;

    paginationContainer.innerHTML = '';
    
    
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Previous" data-page="${currentPage - 1}">
            <span aria-hidden="true">&laquo;</span>
        </a>
    `;
    paginationContainer.appendChild(prevLi);

    
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        `;
        paginationContainer.appendChild(li);
    }

    
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" aria-label="Next" data-page="${currentPage + 1}">
            <span aria-hidden="true">&raquo;</span>
        </a>
    `;
    paginationContainer.appendChild(nextLi);

    
    paginationContainer.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.closest('.page-link').dataset.page);
            if (page && page !== currentPage && page > 0 && page <= totalPages) {
                fetchAndRenderOrders(page);
            }
        });
    });
}


function statusToClass(status) {
    switch ((status || '').toLowerCase()) {
        case 'pending': return 'status-pending';
        case 'preparing': return 'status-preparing';
        case 'ready for pickup': return 'status-ready';
        case 'picked up': return 'status-completed';
        case 'cancelled': return 'status-cancelled';
        default: return '';
    }
}


function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'order-card';
    card.dataset.orderId = order._id;
    const statusClass = statusToClass(order.status);
    card.innerHTML = `
        <div class="order-header">
            <h3>Order #${order._id.toString().slice(-6)}</h3>
            <span class="order-time">${new Date(order.orderTime).toLocaleString()}</span>
        </div>
        <div class="order-status ${statusClass}">
            ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </div>
        <div class="order-items">
            ${order.items.map(item => {
                const name = item.nameAtOrder || (item.menuItemId && item.menuItemId.name) || 'Item';
                const unitPrice = (typeof item.priceAtOrder === 'number') ? item.priceAtOrder : ((item.menuItemId && item.menuItemId.price) || 0);
                return `
                <div class="order-item">
                    <span class="order-item-quantity">${item.quantity}x</span>
                    <span class="order-item-name">${name}</span>
                    <span class="order-item-price">${(unitPrice * item.quantity).toFixed(2)} EGP</span>
                </div>
                `;
            }).join('')}
        </div>
        <div class="order-footer">
            <div class="customer-info">
                <i class="fas fa-user"></i>
                ${order.userId ? order.userId.name : 'Unknown User'}
            </div>
            <div class="order-total">
                Total: ${order.totalPrice.toFixed(2)} EGP
            </div>
        </div>
        <div class="order-actions">
            ${getOrderActionButtons(order)}
        </div>
    `;

    
    card.addEventListener('click', (e) => {
        
        if (e.target.closest('.order-actions')) return;
        showOrderModal(order);
    });

    return card;
}


function showOrderModal(order) {
    
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
                        <span class="order-detail-value ${statusToClass(order.status)}">${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
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
                        <span class="order-detail-value">${order.totalPrice.toFixed(2)} EGP</span>
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
                            <span class="order-item-price">${(itemPrice * item.quantity).toFixed(2)} EGP</span>
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

    
    const closeButtons = modal.querySelectorAll('.close, .close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        });
    });

    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        }
    });

    
    document.addEventListener('keydown', function closeOnEscape(e) {
        if (e.key === 'Escape') {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
            document.removeEventListener('keydown', closeOnEscape);
        }
    });
}


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

        
        const updatedOrderResponse = await fetch(`/api/admin/orders/${orderId}`, { headers: getAuthHeaders() });
        if (!updatedOrderResponse.ok) {
            throw new Error('Failed to fetch updated order details');
        }
        const updatedOrder = await updatedOrderResponse.json();

        
        const orderCard = document.querySelector(`[data-order-id="${orderId}"]`);
        if (orderCard) {
            const newOrderCard = createOrderCard(updatedOrder);
            orderCard.replaceWith(newOrderCard);
        }

        
        const currentModal = document.querySelector('.order-modal.show');
        if (currentModal && currentModal.querySelector(`h3`).textContent.includes(orderId.toString().slice(-6))) {
            currentModal.remove(); 
            showOrderModal(updatedOrder); 
        }

        
        const activeSection = document.querySelector('.section.active');
        if (activeSection && activeSection.id === 'orders') {
            fetchAndRenderOrders();
        }

        
        updateDashboard();

        
        showNotification('Order status updated successfully', 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to update order status', 'error');
    }
}


function updateRestaurantStatusDisplay(status) {
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
        statusIndicator.className = `status-indicator status-${status}`;
        statusIndicator.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
}


function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-title">${type === 'success' ? 'Success' : 'Error'}</div>
        <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);

    
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}


let itemToDelete = null;
let menuItemModal;
let deleteConfirmModal;


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
            <td>${item.price.toFixed(2)} EGP</td>
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


function openAddItemModal() {
    document.getElementById('modalTitle').textContent = 'Add New Menu Item';
    document.getElementById('menuItemForm').reset();
    document.getElementById('itemId').value = '';
    menuItemModal.show();
}


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


function showDeleteConfirm(id) {
    itemToDelete = id;
    deleteConfirmModal.show();
}


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


let incomingQueue = [];
let showingIncoming = false;
const POPUP_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes

function ensureHighlightStyle() {
    if (document.getElementById('order-highlight-style')) return;
    const style = document.createElement('style');
    style.id = 'order-highlight-style';
    style.textContent = `
        .order-card.order-highlight { 
            animation: orderFlash 1600ms ease-out 1; 
        }
        @keyframes orderFlash {
            0% { box-shadow: 0 0 0 rgba(49,208,151,0); background: #eafff5; }
            30% { box-shadow: 0 0 0 rgba(49,208,151,0.35); background: #d9ffef; }
            60% { box-shadow: 0 0 0 rgba(49,208,151,0.2); background: #eafff5; }
            100% { box-shadow: none; background: transparent; }
        }
    `;
    document.head.appendChild(style);
}

function addOrderCardToGrid(order, gridId) {
    ensureHighlightStyle();
    const grid = document.getElementById(gridId);
    if (!grid) return;
    const card = createOrderCard(order);
    grid.prepend(card);
    // transient highlight
    requestAnimationFrame(() => {
        card.classList.add('order-highlight');
        setTimeout(() => card.classList.remove('order-highlight'), 1700);
    });
}

function addOrderToLists(order) {
    addOrderCardToGrid(order, 'recentOrdersGrid');
    addOrderCardToGrid(order, 'allOrdersGrid');
}

function persistQueue() {
    try {
        const data = incomingQueue.map(o => ({ _id: o._id, ts: o.__arrivalTs || Date.now(), order: o }));
        sessionStorage.setItem('vendor_incoming_queue', JSON.stringify(data));
    } catch (_) {}
}

function loadQueueFromStorage() {
    try {
        const raw = sessionStorage.getItem('vendor_incoming_queue');
        if (!raw) return;
        const arr = JSON.parse(raw);
        const now = Date.now();
        const pending = arr.filter(x => now - x.ts < POPUP_TIMEOUT_MS).map(x => ({ ...x.order, __arrivalTs: x.ts }));
        incomingQueue.push(...pending);
        sessionStorage.removeItem('vendor_incoming_queue');
    } catch (_) {}
}

async function showIncomingOrderModal(order) {
    showingIncoming = true;
    const existing = document.querySelector('.incoming-order-modal');
    if (existing) existing.remove();

    // Play notification sound if possible
    try {
        const notificationSound = document.getElementById('notificationSound');
        if (notificationSound) await notificationSound.play().catch(() => {});
    } catch (_) {}

    const modal = document.createElement('div');
    modal.className = 'incoming-order-modal';
    modal.innerHTML = `
        <div class="incoming-modal-backdrop"></div>
        <div class="incoming-modal">
            <div class="incoming-header">
                <h3>New Order #${order._id.toString().slice(-6)}</h3>
            </div>
            <div class="incoming-body">
                <div class="incoming-items">
                    ${order.items.map(item => `
                        <div class="incoming-item">
                            <span class="q">${item.quantity}x</span>
                            <span class="n">${item.nameAtOrder || (item.menuItemId && item.menuItemId.name) || 'Item'}</span>
                            <span class="p">${(item.priceAtOrder * item.quantity).toFixed(2)} EGP</span>
                        </div>
                    `).join('')}
                </div>
                <div class="incoming-total">Total: <strong>${order.totalPrice.toFixed(2)} EGP</strong></div>
                <div class="incoming-timer">Auto-adding to list in <span id="incoming-countdown">180</span>s</div>
            </div>
            <div class="incoming-actions">
                <button class="btn btn-success" id="incoming-accept"><i class="fas fa-check"></i> Accept</button>
                <button class="btn btn-danger" id="incoming-cancel"><i class="fas fa-times"></i> Cancel</button>
            </div>
        </div>
    `;

    // Minimal styles
    const style = document.createElement('style');
    style.textContent = `
        .incoming-order-modal{position:fixed;inset:0;z-index:1050;display:flex;align-items:center;justify-content:center}
        .incoming-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45)}
        .incoming-modal{position:relative;background:#fff;border-radius:10px;max-width:560px;width:92%;box-shadow:0 10px 30px rgba(0,0,0,.25);animation:pop .15s ease-out;padding:16px}
        .incoming-header{margin-bottom:8px}
        .incoming-items{max-height:240px;overflow:auto;margin-bottom:8px}
        .incoming-item{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid #eee}
        .incoming-total{margin:8px 0}
        .incoming-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:8px}
        .incoming-timer{font-size:12px;color:#666}
        @keyframes pop{from{transform:scale(.97);opacity:.8}to{transform:scale(1);opacity:1}}
    `;
document.body.appendChild(style);

    document.body.appendChild(modal);

    // Countdown
    let secs = 180;
    const countdownEl = modal.querySelector('#incoming-countdown');
    const interval = setInterval(() => {
        secs -= 1;
        if (countdownEl) countdownEl.textContent = String(secs);
        if (secs <= 0) {
            clearInterval(interval);
        }
    }, 1000);

    let timeoutId = setTimeout(() => {
        // Add to lists as pending
        addOrderToLists(order);
        close();
    }, POPUP_TIMEOUT_MS);

    function close() {
        clearTimeout(timeoutId);
        clearInterval(interval);
        modal.remove();
        showingIncoming = false;
        // Process next in queue
        if (incomingQueue.length) {
            const next = incomingQueue.shift();
            persistQueue();
            showIncomingOrderModal(next);
        }
    }

    modal.querySelector('#incoming-accept').addEventListener('click', async () => {
        try {
            await updateOrderStatus(order._id, 'preparing');
            addOrderToLists(order);
            close();
        } catch (e) {
            showNotification(e.message || 'Failed to accept order', 'error');
        }
    });
    modal.querySelector('#incoming-cancel').addEventListener('click', async () => {
        try {
            await updateOrderStatus(order._id, 'cancelled');
            addOrderToLists(order);
            close();
        } catch (e) {
            showNotification(e.message || 'Failed to cancel order', 'error');
        }
    });
}

function handleIncomingOrder(order) {
    order.__arrivalTs = Date.now();
    if (showingIncoming) {
        incomingQueue.push(order);
        persistQueue();
        return;
    }
    showIncomingOrderModal(order);
}

// Expose to global for inline script to call
window.handleIncomingOrder = handleIncomingOrder;

// Rebuild any pending popups after reload
document.addEventListener('DOMContentLoaded', () => {
    ensureHighlightStyle();
    loadQueueFromStorage();
    if (incomingQueue.length && !showingIncoming) {
        const next = incomingQueue.shift();
        persistQueue();
        showIncomingOrderModal(next);
    }
});


document.addEventListener('DOMContentLoaded', () => {
    
    menuItemModal = new bootstrap.Modal(document.getElementById('menuItemModal'));
    deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));

    
    if (!checkAuth()) return;

    
    createMenuToggle();

    setupEventListeners();
    showSection('dashboard'); 

    
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
    }, 30000); 


    // Attach Orders search listeners (debounced)
    const input = document.getElementById('ordersSearchInput');
    const clearBtn = document.getElementById('ordersClearSearch');
    if (input) {
        const onSearch = debounce(() => fetchAndRenderOrders(1), 300);
        input.addEventListener('input', onSearch);
    }
    if (clearBtn && input) {
        clearBtn.addEventListener('click', () => {
            if (input.value) {
                input.value = '';
                fetchAndRenderOrders(1);
            }
            input.focus();
        });
    }
});

function debounce(fn, wait = 300) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}
