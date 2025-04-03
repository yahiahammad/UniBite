document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".trending-products details").forEach((detail) => {
        let content = detail.querySelector(".trending-products-container");

        // Ensure summary click triggers toggle event correctly
        detail.querySelector("summary").addEventListener("click", function () {
            setTimeout(() => detail.dispatchEvent(new Event("toggle")), 10);
        });

        detail.addEventListener("toggle", function () {
            if (this.open) {
                content.style.display = "grid"; // Ensure it's visible before measuring
                content.style.maxHeight = "0px"; // Reset height before animation
                content.style.opacity = "0";

                requestAnimationFrame(() => {
                    content.style.maxHeight = content.scrollHeight + "px";
                    content.style.opacity = "1";
                });
            } else {
                content.style.maxHeight = "0px";
                content.style.opacity = "0";

                setTimeout(() => {
                    if (!this.open) content.style.display = "none"; // Hide after transition
                }, 200);
            }
        });
    });
});
