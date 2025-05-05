document.addEventListener("DOMContentLoaded", () => {
    if (window.innerWidth > 768) {
        // Laptop Animation
        ScrollTrigger.create({
            animation: gsap.fromTo(".Main-logo", {
                y: "40vh", //Start position
                scale: 1.3, //Start Scale
            }, {
                y: "-2vh", //ENd location
                scale: 0.5, //End Scale / size
                ease: "power2.out",
            }),
            scrub: true,
            trigger: ".Section2",
            start: "top bottom",
            end: "top center",
        });
    } else {
        // Mobile Animation
        ScrollTrigger.create({
            animation: gsap.fromTo(".Main-logo", {
                y: "40vh",
                scale: 2.5,
            }, {
                y: "2vh",
                scale: 1,
                ease: "power2.out",
            }),
            scrub: true,
            trigger: ".Section2",
            start: "top bottom",
            end: "top center",
        });
    }
});
