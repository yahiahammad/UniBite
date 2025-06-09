document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  const currentYearElement = document.getElementById("current-year")
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear()
  }

  // Mobile menu functionality
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")
  const mobileMenu = document.getElementById("mobile-menu")
  const body = document.body

  if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
    // Create overlay element
    const overlay = document.createElement("div")
    overlay.className = "overlay"
    document.body.appendChild(overlay)

    function openMobileMenu() {
      mobileMenu.classList.add("active")
      overlay.classList.add("active")
      body.classList.add("mobile-menu-open")
    }

    function closeMobileMenu() {
      mobileMenu.classList.remove("active")
      overlay.classList.remove("active")
      body.classList.remove("mobile-menu-open")
    }

    if (mobileMenuToggle) {
      mobileMenuToggle.addEventListener("click", openMobileMenu)
    }

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", closeMobileMenu)
    }

    // Close mobile menu when clicking overlay
    overlay.addEventListener("click", closeMobileMenu)

    // Close mobile menu when pressing escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileMenu.classList.contains("active")) {
        closeMobileMenu()
      }
    })

    // Handle window resize
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992 && mobileMenu.classList.contains("active")) {
        closeMobileMenu()
      }
    })

    // Close menu when clicking on a link
    const mobileNavLinks = document.querySelectorAll(".mobile-nav a")
    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu)
    })
  }

  // Header scroll effect
  const header = document.getElementById("site-header")
  const page = document.body.getAttribute("data-page")

  if (header && page === "index") {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled")
      } else {
        header.classList.remove("scrolled")
      }
    })

    // Initialize scroll position check on page load
    if (window.scrollY > 50) {
      header.classList.add("scrolled")
    }
  }

  // User actions
  const userActions = document.getElementById("user-actions")
  if (userActions) {
    // Simulate user login state (replace with actual logic)
    const isLoggedIn = false // Change to `true` if the user is logged in

    if (isLoggedIn) {
      // User is logged in
      userActions.innerHTML = `
        <a href="/cart" class="btn btn-secondary">Cart</a>
        <a href="/account" class="btn btn-secondary">Account</a>
        <a href="/logout" class="btn btn-outline">Log out</a>
      `
    } else {
      // User is logged out
      userActions.innerHTML = `
        <a href="/login" class="btn btn-ghost">Log in</a>
        <a href="/signup" class="btn btn-primary">Sign up</a>
      `
    }
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const href = this.getAttribute("href")

      if (href !== "#") {
        e.preventDefault()

        const targetElement = document.querySelector(href)
        if (targetElement) {
          const headerOffset = 80
          const elementPosition = targetElement.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          })
        }
      }
    })
  })
})
