document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  document.getElementById("current-year").textContent = new Date().getFullYear()

  // Mobile menu functionality
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")
  const mobileMenu = document.getElementById("mobile-menu")

  // Create overlay element
  const overlay = document.createElement("div")
  overlay.className = "overlay"
  document.body.appendChild(overlay)

  // Toggle mobile menu
  mobileMenuToggle.addEventListener("click", () => {
    mobileMenu.classList.add("active")
    overlay.classList.add("active")
    document.body.style.overflow = "hidden"
  })

  // Close mobile menu
  mobileMenuClose.addEventListener("click", closeMenu)
  overlay.addEventListener("click", closeMenu)

  function closeMenu() {
    mobileMenu.classList.remove("active")
    overlay.classList.remove("active")
    document.body.style.overflow = ""
  }

  // Close menu when clicking on a link
  const mobileNavLinks = document.querySelectorAll(".mobile-nav a")
  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", closeMenu)
  })

  // Header scroll effect
  const header = document.getElementById("site-header")
  const page = document.body.getAttribute("data-page");

  if (page === "index") {

    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    });

    // Initialize scroll position check on page load
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const userActions = document.getElementById("user-actions");

    // Simulate user login state (replace with actual logic)
    const isLoggedIn = true; // Change to `true` if the user is logged in

    if (isLoggedIn) {
      // User is logged in
      userActions.innerHTML = `
      <a href="/cart" class="btn btn-secondary">Cart</a>
      <a href="/account" class="btn btn-secondary">Account</a>
      <a href="/logout" class="btn btn-outline">Log out</a>
    `;
    } else {
      // User is logged out
      userActions.innerHTML = `
      <a href="/login" class="btn btn-secondary">Log in</a>
      <a href="/signup" class="btn btn-outline">Sign up</a>
    `;
    }
  });



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
