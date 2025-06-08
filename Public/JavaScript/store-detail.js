document.addEventListener("DOMContentLoaded", () => {
  // Menu tabs functionality
  const menuTabs = document.querySelectorAll(".menu-tab")
  const menuCategories = document.querySelectorAll(".menu-category")

  menuTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs and categories
      menuTabs.forEach((t) => t.classList.remove("active"))
      menuCategories.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked tab
      this.classList.add("active")

      // Show corresponding category
      const category = this.getAttribute("data-category")
      document.getElementById(category).classList.add("active")
    })
  })

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
