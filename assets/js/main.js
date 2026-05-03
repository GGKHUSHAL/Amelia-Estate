// Mobile header menu: opens/closes the dropdown and keeps aria state in sync.
const menuToggle = document.querySelector("#menuToggle");
const mobileMenu = document.querySelector("#mobileMenu");

if (menuToggle && mobileMenu) {
    menuToggle.addEventListener("click", () => {
        const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
        const shouldOpen = !isExpanded;

        menuToggle.setAttribute("aria-expanded", String(shouldOpen));
        mobileMenu.classList.toggle("is-open", shouldOpen);
        document.body.classList.toggle("menu-open", shouldOpen);
    });

    mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            menuToggle.setAttribute("aria-expanded", "false");
            mobileMenu.classList.remove("is-open");
            document.body.classList.remove("menu-open");
        });
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1280) {
            menuToggle.setAttribute("aria-expanded", "false");
            mobileMenu.classList.remove("is-open");
            document.body.classList.remove("menu-open");
        }
    });
}

// Hero carousel: auto-rotates slides and supports horizontal swipe/drag.
const heroSlider = document.querySelector("#heroSlider");

if (heroSlider) {
    const heroSection = heroSlider.closest(".hero-section");
    const slides = heroSlider.querySelectorAll(".hero-slide");

    let activeSlide = 0;
    let slideInterval;
    let startX = 0;
    let endX = 0;
    const swipeDistance = 50;

    const showSlide = (index) => {
        slides[activeSlide].classList.remove("is-active");
        activeSlide = (index + slides.length) % slides.length;
        heroSlider.style.transform = `translateX(-${activeSlide * 100}%)`;
        slides[activeSlide].classList.add("is-active");

        if (heroSection.classList.contains("is-visible")) {
            const content = slides[activeSlide].querySelector(".hero-content");
            content.style.animation = "none";
            content.offsetHeight;
            content.style.animation = "";
        }
    };

    const startAutoSlide = () => {
        slideInterval = setInterval(() => {
            showSlide(activeSlide + 1);
        }, 8000);
    };

    const resetAutoSlide = () => {
        clearInterval(slideInterval);
        startAutoSlide();
    };

    const handleSwipe = () => {
        const distance = startX - endX;

        if (Math.abs(distance) < swipeDistance) {
            return;
        }

        showSlide(distance > 0 ? activeSlide + 1 : activeSlide - 1);
        resetAutoSlide();
    };

    slides[activeSlide].classList.add("is-active");
    startAutoSlide();

    heroSlider.addEventListener("touchstart", (event) => {
        startX = event.touches[0].clientX;
    });

    heroSlider.addEventListener("touchend", (event) => {
        endX = event.changedTouches[0].clientX;
        handleSwipe();
    });

    heroSlider.addEventListener("mousedown", (event) => {
        startX = event.clientX;
    });

    heroSlider.addEventListener("mouseup", (event) => {
        endX = event.clientX;
        handleSwipe();
    });
}

// Scroll Story slider: traps wheel/touch inside the section until all story slides are viewed.
const scrollStorySection = document.querySelector(".scroll-story-section");

if (scrollStorySection) {
    const storySlides = scrollStorySection.querySelectorAll(".scroll-story-slide");
    const storyProgressItems = scrollStorySection.querySelectorAll(".scroll-story-progress span");

    let activeStorySlide = 0;
    let lastStoryStepTime = 0;
    let wheelDeltaTotal = 0;
    let isWheelGestureLocked = false;
    let wheelUnlockTimer;
    let touchStartY = 0;
    const storyStepDelay = 1100;
    const wheelStepThreshold = 260;
    const touchStepThreshold = 76;
    const wheelUnlockDelay = 720;
    const stickyTop = 86;

    const setStorySlide = (index) => {
        if (index === activeStorySlide) {
            return;
        }

        storySlides[activeStorySlide].classList.remove("is-active");
        storyProgressItems[activeStorySlide].classList.remove("is-active");
        activeStorySlide = index;
        storySlides[activeStorySlide].classList.add("is-active");
        storyProgressItems[activeStorySlide].classList.add("is-active");
    };

    const isStoryInFocus = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        return rect.top <= stickyTop + 8 && rect.bottom > stickyTop + 120;
    };

    const canStepStory = () => {
        const now = Date.now();

        if (now - lastStoryStepTime < storyStepDelay) {
            return false;
        }

        lastStoryStepTime = now;
        return true;
    };

    const scrollPastStory = (direction) => {
        const rect = scrollStorySection.getBoundingClientRect();
        const targetY = direction > 0
            ? window.scrollY + rect.bottom - stickyTop + 1
            : window.scrollY + rect.top - window.innerHeight + stickyTop - 1;

        window.scrollTo({
            top: Math.max(targetY, 0),
            behavior: "smooth"
        });
    };

    const handleStoryStep = (direction, event) => {
        if (!isStoryInFocus()) {
            return;
        }

        const nextIndex = activeStorySlide + direction;
        const canMoveInsideStory = nextIndex >= 0 && nextIndex < storySlides.length;

        if (!canMoveInsideStory) {
            event.preventDefault();

            if (canStepStory()) {
                scrollPastStory(direction);
            }

            return;
        }

        event.preventDefault();

        if (!canStepStory()) {
            return;
        }

        scrollStorySection.scrollIntoView({ block: "start" });
        setStorySlide(nextIndex);
    };

    window.addEventListener("wheel", (event) => {
        if (!isStoryInFocus() || Math.abs(event.deltaY) < 4) {
            wheelDeltaTotal = 0;
            return;
        }

        clearTimeout(wheelUnlockTimer);
        wheelUnlockTimer = setTimeout(() => {
            wheelDeltaTotal = 0;
            isWheelGestureLocked = false;
        }, wheelUnlockDelay);

        if (isWheelGestureLocked) {
            event.preventDefault();
            return;
        }

        const direction = event.deltaY > 0 ? 1 : -1;

        if (Math.sign(wheelDeltaTotal) !== direction) {
            wheelDeltaTotal = 0;
        }

        wheelDeltaTotal += event.deltaY;

        if (Math.abs(wheelDeltaTotal) < wheelStepThreshold) {
            event.preventDefault();
            return;
        }

        wheelDeltaTotal = 0;
        isWheelGestureLocked = true;
        handleStoryStep(direction, event);
    }, { passive: false });

    window.addEventListener("touchstart", (event) => {
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        if (!isStoryInFocus()) {
            return;
        }

        event.preventDefault();
    }, { passive: false });

    window.addEventListener("touchend", (event) => {
        const touchDistance = touchStartY - event.changedTouches[0].clientY;

        if (Math.abs(touchDistance) < touchStepThreshold) {
            return;
        }

        const direction = touchDistance > 0 ? 1 : -1;
        handleStoryStep(direction, event);
    }, { passive: false });
}

// Project plans: switches the main viewer between floor, site, and tower plan modes.
const projectPlansSection = document.querySelector(".project-plans-section");

if (projectPlansSection) {
    const planTabs = projectPlansSection.querySelectorAll("[data-plan-tab]");
    const variantBar = projectPlansSection.querySelector(".project-plan-variant-bar");
    const variants = projectPlansSection.querySelector(".project-plan-variants");
    const variantButtons = variants.querySelectorAll("button");
    const meta = projectPlansSection.querySelector(".project-plan-meta");
    const visual = projectPlansSection.querySelector(".project-plan-visual");
    const image = projectPlansSection.querySelector(".project-plan-image");
    const badge = projectPlansSection.querySelector(".project-plan-badge");
    const footerTitle = projectPlansSection.querySelector(".project-plan-footer h3");
    const footerCopy = projectPlansSection.querySelector(".project-plan-footer p");
    const toolLinks = projectPlansSection.querySelectorAll(".project-plan-tools a");

    const floorImage = "assets/img/project plans/90009c575573f8f004b5343f065db6963be4f203.png";
    const siteImage = "assets/img/project plans/site plan.jpg";
    let activePlan = "floor";

    const planContent = {
        floor: {
            image: floorImage,
            alt: "3 BHK floor plan layout",
            badge: "230 Sq.Yd Floor Plan",
            title: "3 BHK Floor Plan - 230 Sq.Yd",
            copy: "Detailed layout with dimensions. Vastu compliant design.",
            meta: "<strong>3 BHK</strong> · 1,650 Sq.Ft Carpet",
            variants: ["230 Sq. Yds", "219 Sq. Yds", "205 Sq. Yds"],
            showVariants: true
        },
        site: {
            image: siteImage,
            alt: "Master site plan layout",
            badge: "Master Site Plan",
            title: "Complete Project Layout",
            copy: "Tower positions, amenities, roads & landscape plan.",
            meta: "",
            variants: [],
            showVariants: false
        },
        tower: {
            image: floorImage,
            alt: "Tower plan layout",
            badge: "Tower A Plan",
            title: "Tower A - 4 BHK Layout",
            copy: "4 BHK · Tower A · Pool View",
            meta: "<strong>4 BHK</strong> · 2,400 Sq.Ft Carpet",
            variants: ["Tower A 4Bhk", "Tower B 5Bhk", "Tower C Penthouse"],
            showVariants: true
        }
    };

    const updatePlan = (key) => {
        const content = planContent[key];

        if (!content) {
            return;
        }

        activePlan = key;

        planTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.planTab === key);
        });

        image.classList.add("is-switching");

        setTimeout(() => {
            image.src = content.image;
            image.alt = content.alt;
            badge.textContent = content.badge;
            footerTitle.textContent = content.title;
            footerCopy.textContent = content.copy;
            meta.innerHTML = content.meta;
            visual.classList.toggle("is-site", key === "site");
            variantBar.hidden = !content.showVariants;
            variants.hidden = !content.showVariants;
            meta.hidden = !content.meta;

            variantButtons.forEach((button, index) => {
                const label = content.variants[index];
                button.hidden = !label;
                button.textContent = label || "";
                button.classList.toggle("is-active", index === 0 && Boolean(label));
            });

            toolLinks.forEach((link) => {
                link.href = content.image;
            });

            image.classList.remove("is-switching");
        }, 120);
    };

    planTabs.forEach((tab) => {
        tab.addEventListener("click", () => updatePlan(tab.dataset.planTab));
    });

    variantButtons.forEach((button) => {
        button.addEventListener("click", () => {
            variantButtons.forEach((item) => item.classList.remove("is-active"));
            button.classList.add("is-active");

            const label = button.textContent.trim();

            if (activePlan === "floor") {
                badge.textContent = `${label.replace(" Sq. Yds", " Sq.Yd")} Floor Plan`;
                footerTitle.textContent = `3 BHK Floor Plan - ${label.replace(" Yds", "Yd")}`;
                meta.innerHTML = "<strong>3 BHK</strong> · 1,650 Sq.Ft Carpet";
            }

            if (activePlan === "tower") {
                const towerDetails = {
                    "Tower A 4Bhk": {
                        badge: "Tower A Plan",
                        title: "Tower A - 4 BHK Layout",
                        copy: "4 BHK · Tower A · Pool View",
                        meta: "<strong>4 BHK</strong> · 2,400 Sq.Ft Carpet"
                    },
                    "Tower B 5Bhk": {
                        badge: "Tower B Plan",
                        title: "Tower B - 5 BHK Layout",
                        copy: "5 BHK · Tower B · Park View",
                        meta: "<strong>5 BHK</strong> · 2,850 Sq.Ft Carpet"
                    },
                    "Tower C Penthouse": {
                        badge: "Tower C Plan",
                        title: "Tower C - Penthouse Layout",
                        copy: "Penthouse · Tower C · Premium Terrace",
                        meta: "<strong>Penthouse</strong> · 3,250 Sq.Ft Carpet"
                    }
                };
                const detail = towerDetails[label];

                if (detail) {
                    badge.textContent = detail.badge;
                    footerTitle.textContent = detail.title;
                    footerCopy.textContent = detail.copy;
                    meta.innerHTML = detail.meta;
                }
            }
        });
    });
}

// Scroll reveal: toggles .is-visible for sections that animate when entering the viewport.
const revealSections = document.querySelectorAll(".reveal-on-scroll");

if (revealSections.length) {
    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                entry.target.classList.toggle("is-visible", entry.isIntersecting);
            });
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px -30px 0px"
        });

        revealSections.forEach((section) => revealObserver.observe(section));
    } else {
        revealSections.forEach((section) => section.classList.add("is-visible"));
    }
}
