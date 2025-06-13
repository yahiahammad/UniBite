document.addEventListener("DOMContentLoaded", () => {
  
  const passwordToggles = document.querySelectorAll(".password-toggle")

  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input")
      const type = input.getAttribute("type") === "password" ? "text" : "password"
      input.setAttribute("type", type)

      
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

  
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault()

      
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const remember = document.getElementById("remember").checked

      
      if (!email.endsWith("@miuegypt.edu.eg")) {
        showError("email", "Please use your MIU email address (@miuegypt.edu.eg)")
        return
      }

      
      login(email, password, remember)
    })
  }

  
  async function login(email, password, remember = false) {
    const submitButton = document.querySelector('button[type="submit"]')

    
    if (submitButton) {
      submitButton.classList.add("btn-loading")
    }


    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (response.ok) {
        
        const userData = {
          id: result.user.id || result.user._id,
          name: result.user.name || email.split("@")[0].replace(".", " "),
          email: result.user.email,
          role: result.user.role || "student",
          newsletterSubscribed: result.user.newsletterSubscribed || false,
          lastNewsletterToggle: result.user.lastNewsletterToggle || null,
          createdAt: result.user.createdAt || new Date().toISOString(),
          phoneNumber: result.user.phoneNumber || null
        }

        localStorage.setItem("unibite-user", JSON.stringify(userData))

        
        setTimeout(() => {
          window.location.href = "/stores"
        }, 1000)

      } else {
        showError("password", result.message)
      }
    } catch (error) {
      console.error('Login error:', error)
      const errorMessage = '❌ Server error. Please try again.'

      showError("email", "Connection failed. Please check your internet connection.")
    } finally {
      
      if (submitButton) {
        submitButton.classList.remove("btn-loading")
      }
    }
  }

  
  function showError(inputId, message) {
    const input = document.getElementById(inputId)
    if (!input) return

    const errorElement = document.createElement("div")
    errorElement.className = "error-message"
    errorElement.textContent = message

    
    let errorContainer = input.parentElement

    
    if (errorContainer.classList.contains('password-input-wrapper')) {
      errorContainer = errorContainer.parentElement
    }

    
    const existingError = errorContainer.querySelector(".error-message")
    if (existingError) {
      existingError.remove()
    }

    
    input.style.borderColor = "#e53935"

    
    errorContainer.appendChild(errorElement)

    
    input.focus()

    
    input.addEventListener(
        "input",
        function () {
          const error = errorContainer.querySelector(".error-message")
          if (error) {
            error.remove()
          }
          this.style.borderColor = ""
        },
        { once: true }
    )
  }

  
  function isLoggedIn() {
    const user = localStorage.getItem("unibite-user")
    return user !== null
  }

  
  function getCurrentUser() {
    const userStr = localStorage.getItem("unibite-user")
    return userStr ? JSON.parse(userStr) : null
  }

  
  function logout() {
    localStorage.removeItem("unibite-user")
    window.location.href = "/login.html"
  }

  
  window.authUtils = {
    isLoggedIn,
    getCurrentUser,
    logout
  }
})