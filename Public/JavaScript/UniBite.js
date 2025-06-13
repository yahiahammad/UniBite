document.addEventListener("DOMContentLoaded", () => {
    // Mobile menu functionality
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
    const mobileMenuClose = document.querySelector(".mobile-menu-close")
    const mobileMenu = document.getElementById("mobile-menu")

    if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
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
    }

    // Header scroll effect
    const header = document.getElementById("site-header")
    if (header) {
        const scrollThreshold = 50

        window.addEventListener("scroll", () => {
            const currentScroll = window.scrollY

            if (currentScroll > scrollThreshold) {
                header.classList.add("scrolled")
            } else {
                header.classList.remove("scrolled")
            }
        })

        // Initialize scroll position check on page load
        if (window.scrollY > scrollThreshold) {
            header.classList.add("scrolled")
        }
    }
});



