const menuToggle = document.getElementById("menu-toggle");
const navLinks = document.getElementById("nav-links");
const header = document.querySelector(".header");

// Mobile Menu
if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", function () {
        navLinks.classList.toggle("active");
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("active");
        });
    });
}

// Sticky Header
window.addEventListener("scroll", function () {
    if (header) {
        header.classList.toggle("scrolled", window.scrollY > 50);
    }
});
