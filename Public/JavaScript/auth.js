document.addEventListener("DOMContentLoaded", () => {
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

  // Login form submission
  const loginForm = document.getElementById("login-form")
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault()

      // Get form data
      const email = document.getElementById("email").value
      const password = document.getElementById("password").value
      const remember = document.getElementById("remember").checked

      // Validate email domain
      if (!email.endsWith("@miuegypt.edu.eg")) {
        showError("email", "Please use your MIU email address (@miuegypt.edu.eg)")
        return
      }

      // Show loading state
      const submitButton = this.querySelector('button[type="submit"]')
      submitButton.classList.add("btn-loading")

      // Simulate API call
      setTimeout(() => {
        // Simulate successful login
        localStorage.setItem(
          "unibite-user",
          JSON.stringify({
            id: "user-1",
            name: email.split("@")[0].replace(".", " "),
            email,
            role: "student",
          }),
        )

        // Redirect to stores page
        window.location.href = "/stores.html"
      }, 1500)
    })
  }

  // Show error message
  function showError(inputId, message) {
    const input = document.getElementById(inputId)
    const errorElement = document.createElement("div")
    errorElement.className = "error-message"
    errorElement.textContent = message

    // Remove existing error message
    const existingError = input.parentElement.querySelector(".error-message")
    if (existingError) {
      existingError.remove()
    }

    // Add error styles
    input.style.borderColor = "#e53935"

    // Add error message
    input.parentElement.appendChild(errorElement)

    // Focus input
    input.focus()

    // Remove error on input change
    input.addEventListener(
      "input",
      function () {
        const error = this.parentElement.querySelector(".error-message")
        if (error) {
          error.remove()
        }
        this.style.borderColor = ""
      },
      { once: true },
    )
  }
})
