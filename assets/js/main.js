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
    let touchStartY = 0;
    const storyStepDelay = 520;
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
        return rect.top < window.innerHeight - 20 && rect.bottom > stickyTop + 20;
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
        const direction = event.deltaY > 0 ? 1 : -1;
        handleStoryStep(direction, event);
    }, { passive: false });

    window.addEventListener("touchstart", (event) => {
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        const touchDistance = touchStartY - event.touches[0].clientY;

        if (Math.abs(touchDistance) < 36) {
            return;
        }

        const direction = touchDistance > 0 ? 1 : -1;
        handleStoryStep(direction, event);
        touchStartY = event.touches[0].clientY;
    }, { passive: false });
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
            threshold: 0.22,
            rootMargin: "0px 0px -80px 0px"
        });

        revealSections.forEach((section) => revealObserver.observe(section));
    } else {
        revealSections.forEach((section) => section.classList.add("is-visible"));
    }
}
