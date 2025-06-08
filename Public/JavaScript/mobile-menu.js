// Mobile menu functionality
function initMobileMenu() {
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
    const mobileMenuClose = document.querySelector(".mobile-menu-close")
    const mobileMenu = document.getElementById("mobile-menu")

    if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
        // Create overlay element if it doesn't exist
        let overlay = document.querySelector(".overlay")
        if (!overlay) {
            overlay = document.createElement("div")
            overlay.className = "overlay"
            document.body.appendChild(overlay)
        }

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
    }
}

// Initialize mobile menu when DOM is loaded
document.addEventListener("DOMContentLoaded", initMobileMenu) 