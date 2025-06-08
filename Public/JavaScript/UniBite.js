document.addEventListener("DOMContentLoaded", () => {
    if (window.innerWidth > 768) {
        // Laptop Animation
        ScrollTrigger.create({
            animation: gsap.fromTo(".Main-logo", {
                y: "20vh", //Start position
                scale: 1.3, //Start Scale
            }, {
                y: "0vh", //ENd location
                scale: 0.6, //End Scale / size
                ease: "power2.out",
            }),
            scrub: true,
            trigger: ".Section2",
            start: "top bottom",
            end: "top bottom",
        });
    } else {
        // Mobile Animation
        ScrollTrigger.create({
            animation: gsap.fromTo(".Main-logo", {
                y: "20vh",
                scale: 2.5,
            }, {
                y: "2.5vh",
                scale: 1.5,
                ease: "power2.out",
            }),
            scrub: true,
            trigger: ".Section2",
            start: "top bottom",
            end: "top bottom",
        });
    }




});



