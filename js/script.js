(function () {
    "use strict";

    // ---------- Settings ----------
    const THEME_KEY = "portfolio-theme";
    const HIDDEN_PROJECTS_KEY = "portfolio-hidden-projects";
    const CUSTOM_PROJECTS_KEY = "portfolio-custom-projects";
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB

    // ---------- Default projects ----------
    // Projects that always appear on the site.
    // To remove one permanently, delete its block from this list.
    const DEFAULT_PROJECTS = [
        {
            id: "calculator",
            title: "Calculator",
            category: "CLUCLATER",
            description: "A responsive calculator with a clean interface and interactive buttons.",
            tags: ["HTML", "CSS", "JavaScript"],
            live: "https://cluclater.vercel.app/",
            color: "#3B82F6",
            icon: "fa-calculator",
            image: "assets/images/calculator.png"
        },
        {
            id: "shop",
            title: "Shop Website",
            category: "SHOP",
            description: "A clean and responsive shop website built using HTML and CSS, with simple styling and an attractive design.",
            tags: ["HTML", "CSS"],
            live: "https://bookstore-vert-eta.vercel.app/",
            color: "#22D3EE",
            icon: "fa-laptop-code",
            image: "assets/images/shop.png"
        },
        {
            id: "weather",
            title: "Weather Website",
            category: "WEATHER",
            description: "A responsive weather website that displays current weather conditions, temperature, and forecasts for different locations.",
            tags: ["HTML", "CSS", "JavaScript"],
            live: "https://weather-five-navy-39.vercel.app/",
            color: "#A78BFA",
            icon: "fa-cloud-sun",
            image: "assets/images/weather.png"
        }
    ];

    // ---------- Helpers ----------
    function escapeHTML(text) {
        const div = document.createElement("div");
        div.textContent = text == null ? "" : String(text);
        return div.innerHTML;
    }

    // Keeps a value safe inside url('...') in an inline style
    function cssUrl(value) {
        return String(value || "").replace(/['"()\\\n\r]/g, "");
    }

    // localStorage can throw (private mode, disabled storage, quota full)
    function storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            return false;
        }
    }

    function loadList(key) {
        try {
            return JSON.parse(storageGet(key)) || [];
        } catch (e) {
            return [];
        }
    }

    function loadHiddenProjects() {
        return loadList(HIDDEN_PROJECTS_KEY);
    }

    function saveHiddenProjects(list) {
        storageSet(HIDDEN_PROJECTS_KEY, JSON.stringify(list));
    }

    function loadCustomProjects() {
        return loadList(CUSTOM_PROJECTS_KEY);
    }

    function saveCustomProjects(list) {
        // Returns false when storage is full (usually because of large images)
        return storageSet(CUSTOM_PROJECTS_KEY, JSON.stringify(list));
    }

    // ---------- 1. Theme (light / dark) ----------
    const root = document.documentElement;
    const themeBtn = document.getElementById("theme-toggle");

    function applyTheme(theme) {
        root.setAttribute("data-theme", theme);
        themeBtn.innerHTML = theme === "light"
            ? '<i class="fa-solid fa-moon"></i>'
            : '<i class="fa-solid fa-sun"></i>';
        themeBtn.setAttribute("aria-label", theme === "light" ? "Switch to dark mode" : "Switch to light mode");
    }

    applyTheme(storageGet(THEME_KEY) || root.getAttribute("data-theme") || "dark");

    themeBtn.addEventListener("click", function () {
        const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        storageSet(THEME_KEY, next);
        applyTheme(next);
    });

    // ---------- 2. Page loader ----------
    const loader = document.getElementById("page-loader");

    function hideLoader() {
        setTimeout(function () {
            loader.classList.add("loaded");
        }, 1200);
    }

    if (document.readyState === "complete") {
        hideLoader();
    } else {
        window.addEventListener("load", hideLoader);
    }

    // ---------- 3. Navbar: mobile menu, sticky header, scroll progress ----------
    const menuToggle = document.getElementById("menu-toggle");
    const navLinks = document.getElementById("nav-links");
    const header = document.getElementById("header");
    const progressBar = document.getElementById("scroll-progress");

    menuToggle.addEventListener("click", function () {
        const isOpen = navLinks.classList.toggle("open");
        menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("click", function () {
            navLinks.classList.remove("open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

    function onScroll() {
        header.classList.toggle("scrolled", window.scrollY > 50);

        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const percent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
        progressBar.style.width = percent + "%";
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const navItems = navLinks.querySelectorAll(".nav-link");
    const sectionObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                navItems.forEach(function (link) {
                    link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
                });
            }
        });
    }, { rootMargin: "-45% 0px -50% 0px" });

    document.querySelectorAll("main section[id]").forEach(function (section) {
        sectionObserver.observe(section);
    });

    // ---------- 4. Scroll reveal ----------
    const revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll(".reveal").forEach(function (el) {
        revealObserver.observe(el);
    });

    // ---------- 5. Rotating hero text ----------
    const animatedText = document.getElementById("animated-text");
    const words = ["DIGITAL EXPERIENCES", "FRONTEND INTERFACES", "FULL-STACK APPS"];
    let wordIndex = 0;

    setInterval(function () {
        animatedText.style.opacity = 0;
        setTimeout(function () {
            wordIndex = (wordIndex + 1) % words.length;
            animatedText.textContent = words[wordIndex];
            animatedText.style.opacity = 1;
        }, 400);
    }, 2500);

    // ---------- 6. Projects: render, remove, restore ----------
    const grid = document.getElementById("projects-grid");
    const restoreBtn = document.getElementById("restore-projects");

    // Default projects (minus hidden ones) + projects the visitor added
    function getAllProjects() {
        const hidden = loadHiddenProjects();

        const defaults = DEFAULT_PROJECTS
            .filter(function (p) { return hidden.indexOf(p.id) === -1; })
            .map(function (p) { return Object.assign({}, p, { custom: false }); });

        const customs = loadCustomProjects()
            .map(function (p) { return Object.assign({}, p, { custom: true }); });

        return defaults.concat(customs);
    }

    function renderProjects() {
        const projects = getAllProjects();

        if (projects.length === 0) {
            grid.innerHTML = '<p class="skills-note">No projects to show right now.</p>';
        } else {
            grid.innerHTML = projects.map(function (p, index) {
                const hasImage = Boolean(p.image);
                const color = escapeHTML(p.color || "#3B82F6");
                const previewStyle = hasImage
                    ? "background-image: url('" + cssUrl(p.image) + "'), radial-gradient(circle at 50% 40%, " + color + ", #0B0F19 85%);"
                    : "--c: " + color + ";";

                const tags = (p.tags || []).map(function (t) {
                    return "<span>" + escapeHTML(t) + "</span>";
                }).join("");

                const hasLive = Boolean(p.live) && p.live !== "#";
                const liveLink = hasLive
                    ? '<a href="' + escapeHTML(p.live) + '" target="_blank" rel="noopener noreferrer" class="text-link">Live Demo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>'
                    : "";

                return (
                    '<article class="project-card visible" style="transition-delay:' + (index * 0.05) + 's">' +
                        '<button class="delete-project" data-id="' + escapeHTML(p.id) +
                            '" data-custom="' + (p.custom ? "1" : "0") +
                            '" aria-label="Remove project" title="Remove project">' +
                            '<i class="fa-solid fa-trash"></i>' +
                        '</button>' +
                        '<div class="project-preview' + (hasImage ? " has-image" : "") + '" style="' + previewStyle + '">' +
                            (hasImage ? "" : '<i class="fa-solid ' + escapeHTML(p.icon || "fa-code") + '"></i>') +
                            '<span>' + escapeHTML(p.category || "PROJECT") + '</span>' +
                        '</div>' +
                        '<div class="project-info">' +
                            '<div class="project-tags">' + tags + '</div>' +
                            '<h3>' + escapeHTML(p.title) + '</h3>' +
                            '<p>' + escapeHTML(p.description || "") + '</p>' +
                            '<div class="project-links">' + liveLink + '</div>' +
                        '</div>' +
                    '</article>'
                );
            }).join("");
        }

        // Restore button only when some default project is hidden
        restoreBtn.hidden = loadHiddenProjects().length === 0;
    }

    // Remove a project when its trash button is clicked
    grid.addEventListener("click", function (e) {
        const btn = e.target.closest(".delete-project");
        if (!btn) return;

        const title = btn.closest(".project-card").querySelector("h3").textContent;
        if (!confirm('"' + title + '" ko remove karna hai?')) return;

        const id = btn.getAttribute("data-id");

        if (btn.getAttribute("data-custom") === "1") {
            // Custom project: deleted for good
            saveCustomProjects(loadCustomProjects().filter(function (p) {
                return p.id !== id;
            }));
        } else {
            // Default project: hidden, can be restored
            const hidden = loadHiddenProjects();
            if (hidden.indexOf(id) === -1) hidden.push(id);
            saveHiddenProjects(hidden);
        }

        renderProjects();
    });

    // Bring back all removed default projects
    restoreBtn.addEventListener("click", function () {
        saveHiddenProjects([]);
        renderProjects();
    });

    renderProjects();

    // ---------- 7. Add Project modal ----------
    const modal = document.getElementById("project-modal");
    const form = document.getElementById("project-form");
    const formError = document.getElementById("form-error");

    function openModal() {
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        form.querySelector('input[name="title"]').focus();
    }

    function closeModal() {
        modal.hidden = true;
        document.body.style.overflow = "";
        form.reset();
        formError.textContent = "";
    }

    document.getElementById("open-project-modal").addEventListener("click", openModal);
    document.getElementById("close-project-modal").addEventListener("click", closeModal);
    document.getElementById("cancel-project").addEventListener("click", closeModal);

    modal.addEventListener("click", function (e) {
        if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modal.hidden) closeModal();
    });

    // Convert the image to a Base64 string
    function readImage(file) {
        return new Promise(function (resolve, reject) {
            if (!file || !file.name) {
                resolve("");
                return;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                reject(new Error("Image 2 MB se choti honi chahiye."));
                return;
            }
            const reader = new FileReader();
            reader.onload = function () { resolve(reader.result); };
            reader.onerror = function () { reject(new Error("Image read nahi ho saki.")); };
            reader.readAsDataURL(file);
        });
    }

    form.addEventListener("submit", async function (e) {
        e.preventDefault();
        formError.textContent = "";

        const data = new FormData(form);
        const title = String(data.get("title") || "").trim();

        if (!title) {
            formError.textContent = "Project ka title likhein.";
            return;
        }

        let image = "";
        try {
            image = await readImage(data.get("image"));
        } catch (err) {
            formError.textContent = err.message;
            return;
        }

        const project = {
            id: "custom-" + Date.now(),
            title: title,
            category: String(data.get("category") || "PROJECT").trim().toUpperCase(),
            description: String(data.get("description") || "").trim(),
            tags: String(data.get("tags") || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean),
            live: String(data.get("live") || "").trim() || "#",
            color: String(data.get("color") || "#3B82F6"),
            icon: String(data.get("icon") || "fa-code"),
            image: image
        };

        const saved = saveCustomProjects(loadCustomProjects().concat(project));
        if (!saved) {
            formError.textContent = "Storage bhar gaya hai. Chhoti image lein ya koi project remove karein.";
            return;
        }

        renderProjects();
        closeModal();
    });

    // ---------- 8. Footer year ----------
    document.getElementById("year").textContent = new Date().getFullYear();

})();