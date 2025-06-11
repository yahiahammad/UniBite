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
          user.phone = document.getElementById("phone").value;
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

  // Toast notification
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
})
