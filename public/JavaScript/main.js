document.addEventListener("DOMContentLoaded", () => {
  
  const currentYearElement = document.getElementById("current-year")
  if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear()
  }

  
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")
  const mobileMenu = document.getElementById("mobile-menu")
  const body = document.body

  if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
    
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

    
    overlay.addEventListener("click", closeMobileMenu)

    
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && mobileMenu.classList.contains("active")) {
        closeMobileMenu()
      }
    })

    
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 992 && mobileMenu.classList.contains("active")) {
        closeMobileMenu()
      }
    })

    
    const mobileNavLinks = document.querySelectorAll(".mobile-nav a")
    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu)
    })
  }

  
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

    
    if (window.scrollY > 50) {
      header.classList.add("scrolled")
    }
  }

  
  const userActions = document.getElementById("user-actions")
  if (userActions) {
    
    const isLoggedIn = false 

    if (isLoggedIn) {
      
      userActions.innerHTML = `
        <a href="/cart" class="btn btn-secondary">Cart</a>
        <a href="/account" class="btn btn-secondary">Account</a>
        <a href="/logout" class="btn btn-outline">Log out</a>
      `
    } else {
      
      userActions.innerHTML = `
        <a href="/login" class="btn btn-ghost">Log in</a>
        <a href="/signup" class="btn btn-primary">Sign up</a>
      `
    }
  }

  
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
