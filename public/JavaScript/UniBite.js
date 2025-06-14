document.addEventListener("DOMContentLoaded", () => {
    
    const mobileMenuToggle = document.querySelector(".mobile-menu-toggle")
    const mobileMenuClose = document.querySelector(".mobile-menu-close")
    const mobileMenu = document.getElementById("mobile-menu")

    if (mobileMenuToggle && mobileMenuClose && mobileMenu) {
        
        const overlay = document.createElement("div")
        overlay.className = "overlay"
        document.body.appendChild(overlay)

        
        mobileMenuToggle.addEventListener("click", () => {
            mobileMenu.classList.add("active")
            overlay.classList.add("active")
            document.body.style.overflow = "hidden"
        })

        
        mobileMenuClose.addEventListener("click", closeMenu)
        overlay.addEventListener("click", closeMenu)

        function closeMenu() {
            mobileMenu.classList.remove("active")
            overlay.classList.remove("active")
            document.body.style.overflow = ""
        }

        
        const mobileNavLinks = document.querySelectorAll(".mobile-nav a")
        mobileNavLinks.forEach((link) => {
            link.addEventListener("click", closeMenu)
        })
    }

    
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

        
        if (window.scrollY > scrollThreshold) {
            header.classList.add("scrolled")
        }
    }
});



