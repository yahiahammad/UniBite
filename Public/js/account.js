// Tab switching functionality
document.addEventListener('DOMContentLoaded', function() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Password form handling
    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            // Validate passwords
            if (newPassword.length < 8) {
                showToast('Error', 'New password must be at least 8 characters long', 'error');
                return;
            }

            if (newPassword !== confirmNewPassword) {
                showToast('Error', 'New passwords do not match', 'error');
                return;
            }

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
                    showToast('Success', 'Password changed successfully');
                    passwordForm.reset();
                } else {
                    showToast('Error', data.message || 'Failed to change password', 'error');
                }
            } catch (error) {
                showToast('Error', 'An error occurred while changing password', 'error');
            }
        });
    }

    // Personal info form handling
    const personalInfoForm = document.getElementById('personal-info-form');
    if (personalInfoForm) {
        personalInfoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;

            try {
                const response = await fetch('/api/users/update-profile', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name,
                        phone
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('Success', 'Profile updated successfully');
                } else {
                    showToast('Error', data.message || 'Failed to update profile', 'error');
                }
            } catch (error) {
                showToast('Error', 'An error occurred while updating profile', 'error');
            }
        });
    }

    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const input = toggle.previousElementSibling;
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            
            // Update icon
            const icon = toggle.querySelector('.eye-icon');
            if (type === 'text') {
                icon.innerHTML = `
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                `;
            } else {
                icon.innerHTML = `
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                `;
            }
        });
    });

    // Newsletter toggle functionality
    const newsletterToggle = document.getElementById('newsletter');
    console.log('Newsletter toggle element:', newsletterToggle);

    if (newsletterToggle) {
        newsletterToggle.addEventListener('change', async function() {
            console.log('Newsletter toggle changed:', this.checked);
            const isSubscribed = this.checked;
            const user = JSON.parse(localStorage.getItem("unibite-user"));
            console.log('Current user:', user);
            
            // Check if enough time has passed since last toggle (24 hours)
            const lastToggle = user.lastNewsletterToggle;
            if (lastToggle) {
                const timeSinceLastToggle = Date.now() - new Date(lastToggle).getTime();
                const hoursSinceLastToggle = timeSinceLastToggle / (1000 * 60 * 60);
                console.log('Hours since last toggle:', hoursSinceLastToggle);
                
                if (hoursSinceLastToggle < 24) {
                    this.checked = !isSubscribed; // Revert the toggle
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
                console.log('Making request to:', endpoint);
                const token = localStorage.getItem('token');
                console.log('Auth token:', token ? 'Present' : 'Missing');

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                console.log('Response status:', response.status);
                const data = await response.json();
                console.log('Response data:', data);

                if (response.ok) {
                    // Update user data in localStorage
                    user.newsletterSubscribed = isSubscribed;
                    user.lastNewsletterToggle = Date.now();
                    localStorage.setItem("unibite-user", JSON.stringify(user));

                    showToast(
                        "Success", 
                        isSubscribed ? "Successfully subscribed to newsletter" : "Successfully unsubscribed from newsletter"
                    );
                } else {
                    this.checked = !isSubscribed; // Revert the toggle
                    showToast("Error", data.message || "Failed to update newsletter preference", "error");
                }
            } catch (error) {
                console.error('Newsletter toggle error:', error);
                this.checked = !isSubscribed; // Revert the toggle
                showToast("Error", "An error occurred while updating newsletter preference", "error");
            }
        });
    }

    // Debug logs for user data
    const user = JSON.parse(localStorage.getItem("unibite-user"));
    console.log('User data from localStorage:', user);
    console.log('Newsletter subscription status:', user?.newsletterSubscribed);

    // Sync newsletter toggle state with user's database state
    const newsletterToggleSync = document.getElementById('newsletter');
    if (newsletterToggleSync) {
        if (user && user.newsletterSubscribed !== undefined) {
            console.log('Setting newsletter toggle to:', user.newsletterSubscribed);
            newsletterToggleSync.checked = user.newsletterSubscribed;
        } else {
            console.log('No newsletter subscription status found in user data');
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
});

// Toast notification function
function showToast(title, message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastTitle = toast.querySelector('h4');
    const toastMessage = toast.querySelector('p');
    const toastIcon = toast.querySelector('.toast-icon');

    // Update toast content
    toastTitle.textContent = title;
    toastMessage.textContent = message;

    // Update icon based on type
    if (type === 'error') {
        toastIcon.innerHTML = `
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        `;
        toast.classList.add('error');
    } else {
        toastIcon.innerHTML = `
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        `;
        toast.classList.remove('error');
    }

    // Show toast
    toast.classList.add('show');

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Close toast when clicking the close button
document.querySelector('.toast-close').addEventListener('click', () => {
    document.getElementById('toast').classList.remove('show');
}); 