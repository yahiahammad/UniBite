document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".trending-products details").forEach((detail) => {
        let content = detail.querySelector(".trending-products-container");

        
        detail.querySelector("summary").addEventListener("click", function () {
            setTimeout(() => detail.dispatchEvent(new Event("toggle")), 10);
        });

        detail.addEventListener("toggle", function () {
            if (this.open) {
                content.style.display = "grid"; 
                content.style.maxHeight = "0px"; 
                content.style.opacity = "0";

                requestAnimationFrame(() => {
                    content.style.maxHeight = content.scrollHeight + "px";
                    content.style.opacity = "1";
                });
            } else {
                content.style.maxHeight = "0px";
                content.style.opacity = "0";

                setTimeout(() => {
                    if (!this.open) content.style.display = "none"; 
                }, 200);
            }
        });
    });
});
