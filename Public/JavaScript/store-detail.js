document.addEventListener("DOMContentLoaded", () => {
  // Menu tabs functionality
  const menuTabs = document.querySelectorAll(".menu-tab")
  const menuCategories = document.querySelectorAll(".menu-category")

  menuTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and categories
      menuTabs.forEach((t) => t.classList.remove("active"))
      menuCategories.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab
      tab.classList.add("active")

      // Show corresponding category
      const categoryId = tab.getAttribute("data-category")
      const category = document.getElementById(categoryId)
      if (category) {
        category.classList.add("active")
      }
    })
  })

  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
  const mobileMenu = document.getElementById("mobile-menu")
  const mobileMenuClose = document.querySelector(".mobile-menu-close")

  if (mobileMenuToggle && mobileMenu && mobileMenuClose) {
    mobileMenuToggle.addEventListener("click", () => {
      mobileMenu.classList.add("active")
    })

    mobileMenuClose.addEventListener("click", () => {
      mobileMenu.classList.remove("active")
    })
  }

  // Header scroll effect
  const header = document.getElementById("site-header")
  let lastScroll = 0

  if (header) {
    window.addEventListener("scroll", () => {
      const currentScroll = window.pageYOffset

      if (currentScroll <= 0) {
        header.classList.remove("scrolled")
        header.classList.remove("hidden")
        return
      }

      if (currentScroll > lastScroll && !header.classList.contains("hidden")) {
        // Scrolling down
        header.classList.add("hidden")
      } else if (currentScroll < lastScroll && header.classList.contains("hidden")) {
        // Scrolling up
        header.classList.remove("hidden")
      }

      header.classList.add("scrolled")
      lastScroll = currentScroll
    })
  }

  // Add to cart functionality (placeholder)
  const menuItems = document.querySelectorAll(".menu-item")

  menuItems.forEach((item) => {
    item.addEventListener("click", function () {
      const itemName = this.querySelector("h3").textContent
      const itemPrice = this.querySelector(".menu-item-price").textContent

      // Show a simple alert for now
      alert(`Added to cart: ${itemName} (${itemPrice})`)
    })
  })
})
