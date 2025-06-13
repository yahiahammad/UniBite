document.addEventListener("DOMContentLoaded", () => {
  // Check if user is logged in
  const user = JSON.parse(localStorage.getItem("unibite-user"))
  if (!user) {
    window.location.href = "/login.html"
    return
  }

  // Tab functionality
  const tabButtons = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")

  tabButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons and panes
      tabButtons.forEach((btn) => btn.classList.remove("active"))
      tabPanes.forEach((pane) => pane.classList.remove("active"))

      // Add active class to clicked button and corresponding pane
      this.classList.add("active")
      const tabId = this.getAttribute("data-tab")
      document.getElementById(tabId).classList.add("active")

      // Update URL hash
      window.location.hash = tabId
    })
  })

  // Check URL hash on page load
  if (window.location.hash) {
    const hash = window.location.hash.substring(1)
    const tabButton = document.querySelector(`.tab-btn[data-tab="${hash}"]`)
    if (tabButton) {
      tabButton.click()
    }
  }

  // Password visibility toggle
  const passwordToggles = document.querySelectorAll(".password-toggle")
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input")
      const type = input.getAttribute("type") === "password" ? "text" : "password"
      input.setAttribute("type", type)

      // Update icon
      const eyeIcon = this.querySelector(".eye-icon")
      if (type === "text") {
        eyeIcon.innerHTML = `
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        `
      } else {
        eyeIcon.innerHTML = `
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        `
      }
    })
  })

  // Personal info form submission
  const personalInfoForm = document.getElementById("personal-info-form")
  if (personalInfoForm) {
    personalInfoForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]')
      submitButton.textContent = "Saving..."
      submitButton.disabled = true

      try {
        const response = await fetch('/api/users/update-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: document.getElementById("name").value,
            phone: document.getElementById("phone").value
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Update user data in localStorage
          user.name = document.getElementById("name").value;
          user.phoneNumber = document.getElementById("phone").value;
          localStorage.setItem("unibite-user", JSON.stringify(user));

          showToast("Success", "Your personal information has been updated successfully.");
        } else {
          showToast("Error", data.message || "Failed to update profile", "error");
        }
      } catch (error) {
        showToast("Error", "An error occurred while updating profile", "error");
      } finally {
        // Reset button state
        submitButton.textContent = "Save Changes"
        submitButton.disabled = false
      }
    })
  }

  // Password form submission
  const passwordForm = document.getElementById("password-form")
  if (passwordForm) {
    passwordForm.addEventListener("submit", async function (e) {
      e.preventDefault()

      const currentPassword = document.getElementById("currentPassword").value
      const newPassword = document.getElementById("newPassword").value
      const confirmNewPassword = document.getElementById("confirmNewPassword").value

      // Validate passwords
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        showToast("Error", "Please fill in all password fields.", "error")
        return
      }

      if (newPassword.length < 8) {
        showToast("Error", "New password must be at least 8 characters long.", "error")
        return
      }

      if (newPassword !== confirmNewPassword) {
        showToast("Error", "New passwords do not match.", "error")
        return
      }

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]')
      submitButton.textContent = "Changing..."
      submitButton.disabled = true

      try {
        const response = await fetch('/api/users/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });

        const data = await response.json();

        if (response.ok) {
          // Reset form
          this.reset();
          showToast("Success", "Your password has been changed successfully.");
        } else {
          showToast("Error", data.message || "Failed to change password", "error");
        }
      } catch (error) {
        showToast("Error", "An error occurred while changing password", "error");
      } finally {
        // Reset button state
        submitButton.textContent = "Change Password"
        submitButton.disabled = false
      }
    })
  }

  // Newsletter toggle functionality
  const newsletterToggle = document.getElementById('newsletter');
  if (newsletterToggle) {
    newsletterToggle.addEventListener('change', async function() {
      const isSubscribed = this.checked;
      const user = JSON.parse(localStorage.getItem("unibite-user"));
      
      const lastToggle = user.lastNewsletterToggle;
      if (lastToggle) {
        const timeSinceLastToggle = Date.now() - new Date(lastToggle).getTime();
        const hoursSinceLastToggle = timeSinceLastToggle / (1000 * 60 * 60);
        
        if (hoursSinceLastToggle < 24) {
          this.checked = !isSubscribed;
          const hoursRemaining = Math.ceil(24 - hoursSinceLastToggle);
          showToast(
            "Error", 
            `Please wait ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} before changing your newsletter preference again.`,
            "error"
          );
          return;
        }
      }

      try {
        const endpoint = isSubscribed ? '/api/newsletter/subscribe' : '/api/newsletter/unsubscribe';
        const token = localStorage.getItem('token');

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
          user.newsletterSubscribed = isSubscribed;
          user.lastNewsletterToggle = Date.now();
          localStorage.setItem("unibite-user", JSON.stringify(user));

          showToast(
            "Success", 
            isSubscribed ? "Successfully subscribed to newsletter" : "Successfully unsubscribed from newsletter"
          );
        } else {
          this.checked = !isSubscribed;
          showToast("Error", data.message || "Failed to update newsletter preference", "error");
        }
      } catch (error) {
        this.checked = !isSubscribed;
        showToast("Error", "An error occurred while updating newsletter preference", "error");
      }
    });
  }

  // Sync newsletter toggle state with user's database state
  const newsletterToggleSync = document.getElementById('newsletter');
  if (newsletterToggleSync) {
    if (user && user.newsletterSubscribed !== undefined) {
      newsletterToggleSync.checked = user.newsletterSubscribed;
    }
  }

  // Format and display member since date
  const memberSinceElement = document.getElementById('member-since');
  if (memberSinceElement) {
    if (user && user.createdAt) {
      const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      memberSinceElement.textContent = memberSince;
    }
  }

  // Logout functionality
  const logoutButtons = document.querySelectorAll("#logout-btn, #mobile-logout-btn")
  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem("unibite-user")
      window.location.href = "/login.html"
    })
  })

  // Order history functionality
  function switchTab(tabName) {
    // Hide all sections
    document.querySelectorAll('.order-section').forEach(section => {
      section.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
    });
    
    // Show selected section and activate tab
    const section = document.getElementById(tabName + '-order-history');
    const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
    
    if (section) section.classList.remove('hidden');
    if (tab) tab.classList.add('active');
  }

  // Add click event listeners to order tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      switchTab(tab.dataset.tab);
    });
  });

  // Function to load orders
  async function loadOrders() {
    try {
      const response = await fetch('/api/orders/user');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const orders = await response.json();
      
      // Separate ongoing and completed orders
      const ongoingOrders = orders.filter(order => 
        ['pending', 'preparing', 'ready for pickup'].includes(order.status.toLowerCase())
      );
      const completedOrders = orders.filter(order => 
        ['picked up', 'cancelled'].includes(order.status.toLowerCase())
      );

      // Sort orders by date (newest first)
      ongoingOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));
      completedOrders.sort((a, b) => new Date(b.orderTime) - new Date(a.orderTime));

      // Render ongoing orders
      const ongoingList = document.getElementById('ongoing-orders-list');
      if (ongoingOrders.length === 0) {
        ongoingList.innerHTML = '<p class="no-orders">No ongoing orders at the moment.</p>';
      } else {
        ongoingList.innerHTML = ongoingOrders.map(order => createOrderCard(order)).join('');
      }

      // Render order history
      const historyList = document.getElementById('order-history-list');
      if (completedOrders.length === 0) {
        historyList.innerHTML = '<p class="no-orders">No order history available.</p>';
      } else {
        historyList.innerHTML = completedOrders.map(order => createOrderCard(order)).join('');
      }

      // Make sure the correct tab is shown
      const activeTab = document.querySelector('.tab.active');
      if (activeTab) {
        switchTab(activeTab.dataset.tab);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      document.getElementById('ongoing-orders-list').innerHTML = 
        '<p class="error-message">Error loading orders. Please try again later.</p>';
      document.getElementById('order-history-list').innerHTML = 
        '<p class="error-message">Error loading orders. Please try again later.</p>';
    }
  }

  // Function to create order card HTML
  function createOrderCard(order) {
    const statusClass = order.status.toLowerCase().replace(/\s+/g, '-');
    const paymentClass = order.paymentStatus.toLowerCase();
    
    return `
      <div class="order-card ${statusClass}">
        <div class="order-header">
          <div>
            <span class="order-id">Order #${order._id.toString().slice(-6)}</span>
            <span class="payment-status payment-${paymentClass}">
              ${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
            </span>
          </div>
          <div class="order-status-container">
            <span class="order-status status-${statusClass}">
              ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
            ${order.status === 'preparing' ? `
              <div class="estimated-time">
                <i class="fas fa-hourglass-half"></i>
                <span>Estimated time: 15-20 mins</span>
              </div>
            ` : order.status === 'ready for pickup' ? `
              <div class="estimated-time">
                <i class="fas fa-box"></i>
                <span>Ready for pickup now</span>
              </div>
            ` : ''}
          </div>
        </div>

        <div class="vendor-info">
          <img src="${order.vendorId.logoURL ? order.vendorId.logoURL : '/Images/default-food.webp'}" alt="${order.vendorId.name} Logo" class="vendor-logo">
          <span>${order.vendorId.name}</span>
        </div>

        <div class="order-times">
          <div class="order-time">
            <i class="fas fa-clock"></i>
            <span>Ordered: ${new Date(order.orderTime).toLocaleString()}</span>
          </div>
          ${order.acceptedTime ? `
            <div class="order-time">
              <i class="fas fa-check-circle"></i>
              <span>Accepted: ${new Date(order.acceptedTime).toLocaleString()}</span>
            </div>
          ` : ''}
          ${order.pickupTime ? `
            <div class="order-time">
              <i class="fas fa-box"></i>
              <span>Picked Up: ${new Date(order.pickupTime).toLocaleString()}</span>
            </div>
          ` : ''}
        </div>

        <div class="order-items">
          ${order.items.map(item => `
            <div class="order-item">
              <span>${item.nameAtOrder}</span>
              <span>x${item.quantity} - ${item.priceAtOrder} EGP</span>
            </div>
          `).join('')}
        </div>

        ${order.notes ? `
          <div class="order-notes">
            <i class="fas fa-info-circle"></i>
            ${order.notes}
          </div>
        ` : ''}

        <div class="order-total">
          Total: ${order.totalPrice} EGP
        </div>

        <!-- Review Button/Modal Placement -->
        <div class="order-review-placement">
          <!-- Show review button only for picked up, unreviewed orders -->
          ${(order.status === 'picked up' && order.reviewed === false) ? `
            <button class="btn btn-review" onclick="openReviewModal('${order._id}', '${order.vendorId._id}', '${order.vendorId.name}')">Leave a Review</button>
          ` : (order.status === 'picked up' && order.reviewed === true ? `
            <span class="reviewed-message">Thank you for your review!</span>
          ` : '')}
        </div>
      </div>
    `;
  }

  // Load orders when the orders tab is clicked
  const ordersTab = document.querySelector('[data-tab="orders"]');
  if (ordersTab) {
    ordersTab.addEventListener('click', loadOrders);
  }

  // Load orders immediately if we're on the orders page
  if (document.getElementById('orders')) {
    loadOrders();
  }

  // --- Review Modal Logic ---
  // Modal HTML
  if (!document.getElementById('review-modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'review-modal';
    modalDiv.className = 'review-modal';
    modalDiv.style.display = 'none';
    modalDiv.innerHTML = `
      <div class="modal-content">
        <span class="close" id="close-review-modal">&times;</span>
        <div class="review-title">Leave a Review</div>
        <div class="review-vendor" id="review-vendor-name"></div>
        <div class="enhanced-stars" id="review-stars">
          ${[1,2,3,4,5].map(i => `<span class="star" data-value="${i}">&#9733;</span>`).join('')}
        </div>
        <textarea class="review-comment" id="review-comment" placeholder="Share your experience..."></textarea>
        <div class="review-actions">
          <button class="btn btn-primary" id="submit-review-btn">Submit Review</button>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv);
  }

  // Modal open/close logic
  window.openReviewModal = function(orderId, vendorId, vendorName) {
    const modal = document.getElementById('review-modal');
    modal.style.display = 'flex';
    document.getElementById('review-vendor-name').textContent = vendorName;
    modal.dataset.orderId = orderId;
    modal.dataset.vendorId = vendorId;
    // Reset stars and comment
    document.getElementById('review-comment').value = '';
    document.querySelectorAll('#review-stars .star').forEach(star => {
      star.classList.remove('selected', 'hovered');
    });
    window.selectedRating = 0;
  };
  document.getElementById('close-review-modal').onclick = function() {
    document.getElementById('review-modal').style.display = 'none';
  };
  window.onclick = function(event) {
    const modal = document.getElementById('review-modal');
    if (event.target === modal) modal.style.display = 'none';
  };

  // Star rating logic
  document.querySelectorAll('#review-stars .star').forEach(star => {
    star.addEventListener('mouseenter', function() {
      const val = parseInt(this.dataset.value);
      document.querySelectorAll('#review-stars .star').forEach(s => {
        s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
      });
    });
    star.addEventListener('mouseleave', function() {
      document.querySelectorAll('#review-stars .star').forEach(s => s.classList.remove('hovered'));
    });
    star.addEventListener('click', function() {
      const val = parseInt(this.dataset.value);
      window.selectedRating = val;
      document.querySelectorAll('#review-stars .star').forEach(s => {
        s.classList.toggle('selected', parseInt(s.dataset.value) <= val);
      });
    });
  });

  // Submit review logic
  document.getElementById('submit-review-btn').onclick = async function() {
    const modal = document.getElementById('review-modal');
    const orderId = modal.dataset.orderId;
    const vendorId = modal.dataset.vendorId;
    const rating = window.selectedRating;
    const comment = document.getElementById('review-comment').value;
    if (!rating) {
      showToast('Error', 'Please select a star rating.', 'error');
      return;
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId, vendorId, rating, comment })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Success', 'Review submitted successfully!');
        modal.style.display = 'none';
        loadOrders();
      } else {
        showToast('Error', data.message || 'Error submitting review', 'error');
      }
    } catch (err) {
      showToast('Error', 'Error submitting review', 'error');
    }
  };
});

// Toast notification function
function showToast(title, message, type = "success") {
  const toast = document.getElementById("toast")
  const toastTitle = toast.querySelector("h4")
  const toastMessage = toast.querySelector("p")
  const toastIcon = toast.querySelector(".toast-icon")

  toastTitle.textContent = title
  toastMessage.textContent = message

  // Set icon based on type
  if (type === "success") {
    toastIcon.innerHTML = `
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    `
    toast.classList.remove('error');
  } else if (type === "error") {
    toastIcon.innerHTML = `
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    `
    toast.classList.add('error');
  }

  // Show toast
  toast.classList.add("show")

  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove("show")
  }, 3000)
}

// Close toast on click
const toastClose = document.querySelector(".toast-close")
if (toastClose) {
  toastClose.addEventListener("click", () => {
    document.getElementById("toast").classList.remove("show")
  })
}
