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

// Hero carousel: auto-rotates slides with a soft zoom and pointer-reactive depth.
const heroSlider = document.querySelector("#heroSlider");

if (heroSlider) {
    const heroSection = heroSlider.closest(".hero-section");
    const slides = heroSlider.querySelectorAll(".hero-slide");
    const storyProgress = heroSection.querySelector(".hero-story-progress");
    const previousStoryTap = heroSection.querySelector(".hero-story-tap--prev");
    const nextStoryTap = heroSection.querySelector(".hero-story-tap--next");
    const storyDuration = 8000;

    let activeSlide = 0;
    let slideInterval;
    let heroLightFrame;
    let startX = 0;
    let endX = 0;
    const swipeDistance = 50;
    let storyProgressItems = [];
    const originalHeroBackgrounds = Array.from(slides, (slide) => {
        const background = slide.querySelector(".hero-slide-bg");
        return background ? background.style.backgroundImage : "";
    });

    const isMobileStory = () => window.matchMedia("(max-width: 767px)").matches;

    const applyMobileHeroImages = () => {
        if (!isMobileStory()) {
            slides.forEach((slide, index) => {
                const background = slide.querySelector(".hero-slide-bg");

                if (background) {
                    background.style.backgroundImage = originalHeroBackgrounds[index];
                }
            });
            return;
        }

        const mobileImages = [
            null,
            "assets/img/slider/mobile-slide-2.jpg",
            "assets/img/slider/mobile-slide-3.jpg"
        ];

        slides.forEach((slide, index) => {
            const mobileImage = mobileImages[index];
            const background = slide.querySelector(".hero-slide-bg");

            if (mobileImage && background) {
                background.style.backgroundImage = `url("${mobileImage}")`;
            }
        });
    };

    const updateSliderPosition = () => {
        heroSlider.style.transform = "none";
    };

    if (storyProgress) {
        storyProgress.innerHTML = Array.from(slides, (_, index) => (
            `<span class="hero-story-progress-item" data-story-index="${index}"><span></span></span>`
        )).join("");
        storyProgressItems = storyProgress.querySelectorAll(".hero-story-progress-item");
        heroSection.style.setProperty("--hero-story-duration", `${storyDuration}ms`);
    }

    const updateStoryProgress = () => {
        if (!storyProgressItems.length) {
            return;
        }

        storyProgressItems.forEach((item, index) => {
            item.classList.toggle("is-complete", index < activeSlide);
            item.classList.toggle("is-active", index === activeSlide);
        });

        const activeItem = storyProgressItems[activeSlide];

        if (activeItem) {
            activeItem.classList.remove("is-active");
            activeItem.offsetHeight;
            activeItem.classList.add("is-active");
        }
    };

    const showSlide = (index) => {
        slides[activeSlide].classList.remove("is-active");
        activeSlide = (index + slides.length) % slides.length;
        updateSliderPosition();
        slides[activeSlide].classList.add("is-active");
        updateStoryProgress();

        if (heroSection.classList.contains("is-visible")) {
            const content = slides[activeSlide].querySelector(".hero-content");

            if (content) {
                content.style.animation = "none";
                content.offsetHeight;
                content.style.animation = "";
            }
        }
    };

    const startAutoSlide = () => {
        clearInterval(slideInterval);
        slideInterval = setInterval(() => {
            showSlide(activeSlide + 1);
        }, storyDuration);
    };

    const resetAutoSlide = () => {
        clearInterval(slideInterval);
        startAutoSlide();
    };

    const updateHeroLight = (event) => {
        window.cancelAnimationFrame(heroLightFrame);

        heroLightFrame = window.requestAnimationFrame(() => {
            const rect = heroSection.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            const depthX = (x - 50) / 50;
            const depthY = (y - 50) / 50;

            heroSection.style.setProperty("--hero-light-x", `${x}%`);
            heroSection.style.setProperty("--hero-light-y", `${y}%`);
            heroSection.style.setProperty("--hero-content-x", `${(depthX * 10).toFixed(2)}px`);
            heroSection.style.setProperty("--hero-content-y", `${(depthY * 8).toFixed(2)}px`);
            heroSection.style.setProperty("--hero-bg-x", `${(-depthX * 8).toFixed(2)}px`);
            heroSection.style.setProperty("--hero-bg-y", `${(-depthY * 6).toFixed(2)}px`);
            heroSection.classList.add("is-pointer-active");
        });
    };

    const resetHeroLight = () => {
        window.cancelAnimationFrame(heroLightFrame);
        heroSection.classList.remove("is-pointer-active");
        heroSection.style.setProperty("--hero-content-x", "0px");
        heroSection.style.setProperty("--hero-content-y", "0px");
        heroSection.style.setProperty("--hero-bg-x", "0px");
        heroSection.style.setProperty("--hero-bg-y", "0px");
    };

    const handleMobileSwipe = () => {
        if (!isMobileStory()) {
            return;
        }

        const distance = startX - endX;

        if (Math.abs(distance) < swipeDistance) {
            return;
        }

        showSlide(distance > 0 ? activeSlide + 1 : activeSlide - 1);
        resetAutoSlide();
    };

    slides[activeSlide].classList.add("is-active");
    applyMobileHeroImages();
    updateSliderPosition();
    updateStoryProgress();
    startAutoSlide();

    window.addEventListener("resize", () => {
        applyMobileHeroImages();
        updateSliderPosition();
    });

    if (previousStoryTap && nextStoryTap) {
        previousStoryTap.addEventListener("click", () => {
            if (!isMobileStory()) {
                return;
            }

            showSlide(activeSlide - 1);
            resetAutoSlide();
        });

        nextStoryTap.addEventListener("click", () => {
            if (!isMobileStory()) {
                return;
            }

            showSlide(activeSlide + 1);
            resetAutoSlide();
        });
    }

    heroSlider.addEventListener("touchstart", (event) => {
        if (!isMobileStory()) {
            return;
        }

        startX = event.touches[0].clientX;
    }, { passive: true });

    heroSlider.addEventListener("touchend", (event) => {
        if (!isMobileStory()) {
            return;
        }

        endX = event.changedTouches[0].clientX;
        handleMobileSwipe();
    });

    heroSection.addEventListener("mousemove", updateHeroLight);
    heroSection.addEventListener("mouseleave", resetHeroLight);
}

// Sticky availability CTA: pins below the fixed header while later sections scroll over it.
const stickyAvailabilitySection = document.querySelector(".sticky-availability-section");
const stickyAvailabilityPanel = document.querySelector(".sticky-availability-panel");

if (stickyAvailabilitySection && stickyAvailabilityPanel) {
    const headerOffset = 86;

    const updateStickyAvailability = () => {
        const sectionRect = stickyAvailabilitySection.getBoundingClientRect();
        const sectionTop = sectionRect.top + window.scrollY;
        const sectionBottom = sectionTop + stickyAvailabilitySection.offsetHeight;
        const panelHeight = stickyAvailabilityPanel.offsetHeight;
        const pinStart = sectionTop - headerOffset;
        const pinEnd = sectionBottom - headerOffset - panelHeight;
        const scrollY = window.scrollY;
        const shouldPin = scrollY >= pinStart && scrollY < pinEnd;
        const shouldRelease = scrollY >= pinEnd;

        stickyAvailabilitySection.classList.toggle("is-pinned", shouldPin);
        stickyAvailabilitySection.classList.toggle("is-released", shouldRelease);
    };

    updateStickyAvailability();
    window.addEventListener("scroll", updateStickyAvailability, { passive: true });
    window.addEventListener("resize", updateStickyAvailability);
}

// About gallery: keeps the image depth effect and toggles the longer content panel.
const aboutSection = document.querySelector(".about-section");

if (aboutSection) {
    const aboutPhotos = aboutSection.querySelectorAll(".about-photo");
    const aboutToggle = aboutSection.querySelector("[data-about-toggle]");
    const aboutMore = aboutSection.querySelector("#aboutMore");

    aboutPhotos.forEach((photo) => {
        photo.addEventListener("mousemove", (event) => {
            const rect = photo.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;

            photo.style.setProperty("--about-tilt-x", `${(-y * 7).toFixed(2)}deg`);
            photo.style.setProperty("--about-tilt-y", `${(x * 7).toFixed(2)}deg`);
            photo.style.setProperty("--about-image-x", `${(-x * 10).toFixed(2)}px`);
            photo.style.setProperty("--about-image-y", `${(-y * 10).toFixed(2)}px`);
        });

        photo.addEventListener("mouseleave", () => {
            photo.style.setProperty("--about-tilt-x", "0deg");
            photo.style.setProperty("--about-tilt-y", "0deg");
            photo.style.setProperty("--about-image-x", "0px");
            photo.style.setProperty("--about-image-y", "0px");
        });
    });

    if (aboutToggle && aboutMore) {
        let aboutMoreTimer;

        aboutToggle.addEventListener("click", () => {
            const shouldOpen = aboutToggle.getAttribute("aria-expanded") !== "true";

            clearTimeout(aboutMoreTimer);
            aboutToggle.setAttribute("aria-expanded", String(shouldOpen));
            aboutToggle.querySelector("span:first-child").textContent = shouldOpen ? "Show Less" : "Read More";

            if (shouldOpen) {
                aboutMore.hidden = false;
                aboutSection.classList.add("is-about-expanded");
                requestAnimationFrame(() => {
                    aboutMore.classList.add("is-open");
                });
                return;
            }

            aboutMore.classList.remove("is-open");
            aboutMoreTimer = setTimeout(() => {
                aboutMore.hidden = true;
                aboutSection.classList.remove("is-about-expanded");
            }, 620);
        });
    }
}

// Scroll Story slider: traps scroll until the story has been viewed in that direction.
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
    let lastPageScrollY = window.scrollY;
    let isPinningStory = false;
    let isExitingStory = false;
    let storyTransitionTimer;
    let queuedStoryStepTimer;
    let storyExitTimer;
    const storyStepDelay = 620;
    const wheelStepThreshold = 90;
    const touchStepThreshold = 44;
    const wheelUnlockDelay = 260;
    const storyTransitionDuration = 860;
    const storyTransitionClasses = [
        "is-flipping-in",
        "is-entering-from-bottom",
        "is-entering-from-top",
        "is-leaving-to-top",
        "is-leaving-to-bottom"
    ];
    const isMobileStoryView = () => window.matchMedia("(max-width: 767px)").matches;
    const getStickyTop = () => isMobileStoryView() ? 0 : 86;
    const getStoryFocusOffset = () => getStickyTop() + 2;
    const releaseWheelGesture = () => {
        wheelDeltaTotal = 0;
        isWheelGestureLocked = false;
    };
    const scheduleWheelUnlock = () => {
        clearTimeout(wheelUnlockTimer);
        wheelUnlockTimer = setTimeout(releaseWheelGesture, wheelUnlockDelay);
    };

    const updateMobileStoryHeader = () => {
        if (!isMobileStoryView()) {
            document.body.classList.remove("is-story-header-hidden");
            return;
        }

        if (isExitingStory) {
            document.body.classList.remove("is-story-header-hidden");
            return;
        }

        const rect = scrollStorySection.getBoundingClientRect();
        const shouldHideHeader = rect.top <= 2 && rect.bottom > 64;

        document.body.classList.toggle("is-story-header-hidden", shouldHideHeader);

        if (shouldHideHeader && menuToggle && mobileMenu) {
            menuToggle.setAttribute("aria-expanded", "false");
            mobileMenu.classList.remove("is-open");
            document.body.classList.remove("menu-open");
        }
    };

    const clearStoryTransitionClasses = (slide) => {
        slide.classList.remove(...storyTransitionClasses);
    };

    const setStorySlide = (index, direction = index > activeStorySlide ? 1 : -1) => {
        if (index === activeStorySlide) {
            return;
        }

        const previousIndex = activeStorySlide;
        const previousSlide = storySlides[previousIndex];
        const nextSlide = storySlides[index];
        const enteringClass = direction > 0 ? "is-entering-from-bottom" : "is-entering-from-top";
        const leavingClass = direction > 0 ? "is-leaving-to-top" : "is-leaving-to-bottom";

        clearTimeout(storyTransitionTimer);
        storySlides.forEach((slide, slideIndex) => {
            clearStoryTransitionClasses(slide);

            if (slideIndex !== previousIndex && slideIndex !== index) {
                slide.classList.remove("is-active");
            }
        });

        nextSlide.classList.add("is-flipping-in", enteringClass);
        nextSlide.offsetHeight;
        previousSlide.classList.add(leavingClass);
        storyProgressItems[previousIndex].classList.remove("is-active");
        activeStorySlide = index;
        nextSlide.classList.add("is-active");
        storyProgressItems[activeStorySlide].classList.add("is-active");
        nextSlide.classList.remove(enteringClass);

        storyTransitionTimer = setTimeout(() => {
            previousSlide.classList.remove("is-active");
            clearStoryTransitionClasses(previousSlide);
            clearStoryTransitionClasses(nextSlide);
        }, storyTransitionDuration);
    };

    const isStoryInFocus = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        const storyFocusOffset = getStoryFocusOffset();
        return rect.top <= storyFocusOffset && rect.bottom > storyFocusOffset + 80;
    };

    const isStoryEnteringDown = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        const storyFocusOffset = getStoryFocusOffset();
        return rect.top > storyFocusOffset && rect.top < window.innerHeight;
    };

    const isStoryEnteringUp = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        const storyFocusOffset = getStoryFocusOffset();
        return rect.top < storyFocusOffset && rect.bottom > storyFocusOffset;
    };

    const isStoryInTrapRange = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        const storyFocusOffset = getStoryFocusOffset();
        return rect.top < window.innerHeight && rect.bottom > storyFocusOffset;
    };

    const pinStoryToTop = (behavior = "auto") => {
        const stickyTop = getStickyTop();
        isPinningStory = true;
        window.scrollTo({
            top: Math.max(scrollStorySection.offsetTop - stickyTop, 0),
            behavior
        });
        requestAnimationFrame(() => {
            isPinningStory = false;
            lastPageScrollY = window.scrollY;
            updateMobileStoryHeader();
        });
    };

    const canStepStory = () => {
        const now = Date.now();

        if (now - lastStoryStepTime < storyStepDelay) {
            return false;
        }

        lastStoryStepTime = now;
        return true;
    };

    const queueStoryStep = (direction) => {
        const remainingDelay = Math.max(storyStepDelay - (Date.now() - lastStoryStepTime), 0);

        clearTimeout(queuedStoryStepTimer);
        queuedStoryStepTimer = setTimeout(() => {
            if (!isStoryInFocus()) {
                return;
            }

            const nextIndex = activeStorySlide + direction;

            if (nextIndex < 0 || nextIndex >= storySlides.length) {
                return;
            }

            lastStoryStepTime = Date.now();
            pinStoryToTop();
            setStorySlide(nextIndex, direction);
        }, remainingDelay + 24);
    };

    const scrollPastStory = (direction) => {
        const rect = scrollStorySection.getBoundingClientRect();
        const stickyTop = getStickyTop();
        const bookingImage = document.querySelector("#booking-enquiry .booking-enquiry-image");

        if (direction > 0 && isMobileStoryView() && bookingImage) {
            const headerHeight = document.querySelector("header")?.offsetHeight || 86;
            const imageGap = 18;

            isExitingStory = true;
            clearTimeout(storyExitTimer);
            document.body.classList.remove("is-story-header-hidden");
            window.scrollTo({
                top: Math.max(window.scrollY + bookingImage.getBoundingClientRect().top - headerHeight - imageGap, 0),
                behavior: "smooth"
            });
            storyExitTimer = setTimeout(() => {
                isExitingStory = false;
                updateMobileStoryHeader();
            }, 900);
            return;
        }

        const targetY = direction > 0
            ? window.scrollY + rect.bottom - stickyTop + 1
            : window.scrollY + rect.top - window.innerHeight + stickyTop - 1;

        window.scrollTo({
            top: Math.max(targetY, 0),
            behavior: "smooth"
        });
    };

    const handleStoryStep = (direction, event) => {
        if (direction > 0 && isStoryEnteringDown()) {
            event.preventDefault();
            pinStoryToTop();
            return;
        }

        if (direction < 0 && isStoryEnteringUp() && !isStoryInFocus()) {
            event.preventDefault();
            setStorySlide(storySlides.length - 1, direction);
            pinStoryToTop();
            return;
        }

        if (!isStoryInFocus() && isStoryInTrapRange()) {
            const hasLockedSlidesInDirection = direction > 0
                ? activeStorySlide < storySlides.length - 1
                : activeStorySlide > 0;

            if (hasLockedSlidesInDirection) {
                event.preventDefault();
                pinStoryToTop();
                return;
            }
        }

        if (!isStoryInFocus()) {
            return;
        }

        const nextIndex = activeStorySlide + direction;
        const canMoveInsideStory = nextIndex >= 0 && nextIndex < storySlides.length;

        if (!canMoveInsideStory) {
            event.preventDefault();
            scrollPastStory(direction);
            return;
        }

        event.preventDefault();

        if (!canStepStory()) {
            queueStoryStep(direction);
            return;
        }

        pinStoryToTop();
        setStorySlide(nextIndex, direction);
    };

    window.addEventListener("wheel", (event) => {
        if (Math.abs(event.deltaY) < 4) {
            wheelDeltaTotal = 0;
            return;
        }

        const direction = event.deltaY > 0 ? 1 : -1;

        if (direction > 0 && isStoryEnteringDown()) {
            wheelDeltaTotal = 0;
            isWheelGestureLocked = true;
            handleStoryStep(direction, event);
            scheduleWheelUnlock();

            return;
        }

        if (direction < 0 && isStoryEnteringUp() && !isStoryInFocus()) {
            wheelDeltaTotal = 0;
            isWheelGestureLocked = true;
            handleStoryStep(direction, event);
            scheduleWheelUnlock();

            return;
        }

        if (!isStoryInFocus() && !isStoryInTrapRange()) {
            wheelDeltaTotal = 0;
            return;
        }

        if (isWheelGestureLocked) {
            event.preventDefault();
            return;
        }

        scheduleWheelUnlock();

        if (Math.sign(wheelDeltaTotal) !== direction) {
            wheelDeltaTotal = 0;
        }

        if (
            isStoryInFocus()
            && ((direction < 0 && activeStorySlide === 0) || (direction > 0 && activeStorySlide === storySlides.length - 1))
        ) {
            wheelDeltaTotal = 0;
            isWheelGestureLocked = true;
            handleStoryStep(direction, event);
            scheduleWheelUnlock();
            return;
        }

        wheelDeltaTotal += event.deltaY;

        if (Math.abs(wheelDeltaTotal) < wheelStepThreshold) {
            event.preventDefault();
            return;
        }

        wheelDeltaTotal = 0;
        isWheelGestureLocked = true;
        handleStoryStep(direction, event);
        scheduleWheelUnlock();
    }, { passive: false });

    window.addEventListener("touchstart", (event) => {
        touchStartY = event.touches[0].clientY;
    }, { passive: true });

    window.addEventListener("touchmove", (event) => {
        const touchDistance = touchStartY - event.touches[0].clientY;
        const direction = touchDistance > 0 ? 1 : -1;

        if (direction > 0 && isStoryEnteringDown()) {
            event.preventDefault();
            pinStoryToTop();
            return;
        }

        if (direction < 0 && isStoryEnteringUp() && !isStoryInFocus()) {
            event.preventDefault();
            setStorySlide(storySlides.length - 1, direction);
            pinStoryToTop();
            return;
        }

        if (!isStoryInFocus() && !isStoryInTrapRange()) {
            return;
        }

        const hasLockedSlidesInDirection = direction > 0
            ? activeStorySlide < storySlides.length - 1
            : activeStorySlide > 0;

        if (!isStoryInFocus() && !hasLockedSlidesInDirection) {
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

    window.addEventListener("scroll", () => {
        updateMobileStoryHeader();

        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastPageScrollY + 1;
        const isScrollingUp = currentScrollY < lastPageScrollY - 1;
        const hasUnseenSlides = activeStorySlide < storySlides.length - 1;
        const hasPreviousSlides = activeStorySlide > 0;
        const stickyTop = getStickyTop();
        const storyFocusOffset = getStoryFocusOffset();
        const storyStartY = Math.max(scrollStorySection.offsetTop - stickyTop, 0);
        const storyEndY = storyStartY + scrollStorySection.offsetHeight;

        if (!isPinningStory && isScrollingDown && hasUnseenSlides && currentScrollY >= storyStartY) {
            const rect = scrollStorySection.getBoundingClientRect();
            const hasReachedStory = rect.top < window.innerHeight && rect.bottom > storyFocusOffset;
            const hasSkippedStory = currentScrollY >= storyEndY;

            if (hasReachedStory || hasSkippedStory) {
                pinStoryToTop();
            }
        }

        if (!isPinningStory && isScrollingUp && hasPreviousSlides && currentScrollY <= storyEndY) {
            const rect = scrollStorySection.getBoundingClientRect();
            const hasReachedStory = rect.top < window.innerHeight && rect.bottom >= storyFocusOffset;
            const hasSkippedStory = currentScrollY <= storyStartY;

            if (hasReachedStory || hasSkippedStory) {
                pinStoryToTop();
            }
        }

        lastPageScrollY = window.scrollY;
    }, { passive: true });

    window.addEventListener("resize", updateMobileStoryHeader);
    updateMobileStoryHeader();
}

const mobileHeaderMedia = window.matchMedia("(max-width: 767px)");
const updateMobileHeaderVisibility = () => {
    if (!mobileHeaderMedia.matches) {
        document.body.classList.remove("is-mobile-header-hidden", "is-mobile-header-visible");
        return;
    }

    const heroSection = document.querySelector(".hero-section");
    const heroHeight = heroSection ? heroSection.offsetHeight : 0;
    const hideAtTop = window.scrollY < Math.max(110, heroHeight * 0.18);
    let hideInStory = false;

    if (scrollStorySection) {
        const storyRect = scrollStorySection.getBoundingClientRect();
        hideInStory = storyRect.top <= 2 && storyRect.bottom > 64;
    }

    const shouldHideHeader = hideAtTop || hideInStory;

    document.body.classList.toggle("is-mobile-header-hidden", shouldHideHeader);
    document.body.classList.toggle("is-mobile-header-visible", !shouldHideHeader);

    if (shouldHideHeader && menuToggle && mobileMenu) {
        menuToggle.setAttribute("aria-expanded", "false");
        mobileMenu.classList.remove("is-open");
        document.body.classList.remove("menu-open");
    }
};

window.addEventListener("scroll", updateMobileHeaderVisibility, { passive: true });
window.addEventListener("resize", updateMobileHeaderVisibility);
updateMobileHeaderVisibility();

// Ideal floor: activates size and floor tabs, then refreshes the visible details.
const idealFloorSection = document.querySelector(".ideal-floor-section");

if (idealFloorSection) {
    const sizeTabs = idealFloorSection.querySelectorAll("[data-ideal-size]");
    const floorTabs = idealFloorSection.querySelectorAll("[data-ideal-floor]");
    const badgeSizeFloor = idealFloorSection.querySelector(".ideal-floor-badges span");
    const badgeFeature = idealFloorSection.querySelector(".ideal-floor-badges strong");
    const badgeFeatureIcon = badgeFeature.querySelector("svg").outerHTML;
    const panelSubtitle = idealFloorSection.querySelector(".ideal-floor-panel > div:first-child p");
    const specValues = idealFloorSection.querySelectorAll(".ideal-floor-spec strong");
    const idealImage = idealFloorSection.querySelector(".ideal-floor-media img");

    let activeSize = "230";
    let activeFloor = "1st";
    let idealImageTimer;

    const sizeDetails = {
        230: {
            label: "230 Sq.Yd",
            area: "230 Sq.Yds",
            image: "assets/img/choose ideal/banner.jpg"
        },
        219: {
            label: "219 Sq.Yd",
            area: "219 Sq.Yds",
            image: "assets/img/choose ideal/banner.png"
        },
        205: {
            label: "205 Sq.Yd",
            area: "205 Sq.Yds",
            image: "assets/img/choose ideal/banner.jpg"
        }
    };

    const featureCopy = {
        "1st": "Low-Rise Living",
        "2nd": "Lift Access",
        "3rd": "Open View",
        "4th": "Roof Right"
    };

    const refreshIdealFloor = () => {
        const size = sizeDetails[activeSize];
        const feature = featureCopy[activeFloor] || "Premium Floor";

        if (!size) {
            return;
        }

        badgeSizeFloor.textContent = `${size.label} - ${activeFloor} Floor`;
        badgeFeature.innerHTML = `${badgeFeatureIcon}${feature}`;
        panelSubtitle.textContent = `${activeSize} Sq. Yd ${activeFloor} Floor Selected`;
        specValues[0].textContent = size.area;

        if (idealImage && size.image && idealImage.getAttribute("src") !== size.image) {
            clearTimeout(idealImageTimer);
            idealImage.classList.add("is-switching");
            idealImageTimer = setTimeout(() => {
                idealImage.src = size.image;
                idealImage.classList.remove("is-switching");
            }, 160);
        }
    };

    sizeTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activeSize = tab.dataset.idealSize;

            sizeTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
            refreshIdealFloor();
        });
    });

    floorTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            activeFloor = tab.dataset.idealFloor;

            floorTabs.forEach((item) => item.classList.toggle("is-active", item === tab));
            refreshIdealFloor();
        });
    });

    refreshIdealFloor();
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
            meta: "<strong>3 BHK</strong> - 1,650 Sq.Ft Carpet",
            variants: ["230 Sq.Yd", "219 Sq.Yd", "205 Sq.Yd"],
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
            badge: "230 Sq.Yd Stack Plan",
            title: "3 BHK Stack Plan - 230 Sq.Yd",
            copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
            meta: "<strong>3 BHK</strong> - Stilt+4 Floors",
            variants: ["230 Sq.Yd", "219 Sq.Yd", "205 Sq.Yd"],
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
                badge.textContent = `${label} Floor Plan`;
                footerTitle.textContent = `3 BHK Floor Plan - ${label}`;
                meta.innerHTML = "<strong>3 BHK</strong> - 1,650 Sq.Ft Carpet";
            }

            if (activePlan === "tower") {
                const towerDetails = {
                    "230 Sq.Yd": {
                        badge: "230 Sq.Yd Stack Plan",
                        title: "3 BHK Stack Plan - 230 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
                    },
                    "219 Sq.Yd": {
                        badge: "219 Sq.Yd Stack Plan",
                        title: "3 BHK Stack Plan - 219 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
                    },
                    "205 Sq.Yd": {
                        badge: "205 Sq.Yd Stack Plan",
                        title: "3 BHK Stack Plan - 205 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
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

// Transparent pricing: size tabs, floor selection, and reveal state.
const pricingSection = document.querySelector(".transparent-pricing-section");

if (pricingSection) {
    const pricingTabs = pricingSection.querySelectorAll("[data-pricing-tab]");
    const pricingCard = pricingSection.querySelector(".pricing-card");
    const floorButtons = pricingSection.querySelectorAll("[data-floor-price]");
    const pricingTitle = pricingSection.querySelector(".pricing-title-block h3");
    const pricingFloor = pricingSection.querySelector(".pricing-title-block p");
    const imageBadge = pricingSection.querySelector(".pricing-image-badge");
    const pricingImage = pricingSection.querySelector(".pricing-image-wrap img");
    const selectedPrice = pricingSection.querySelector(".selected-price-box strong");
    const selectedMeta = pricingSection.querySelector(".selected-price-box p");
    const unlockButton = pricingSection.querySelector(".pricing-unlock-btn");
    const unlockModal = pricingSection.querySelector(".pricing-unlock-modal");
    const unlockForm = pricingSection.querySelector(".pricing-unlock-form");
    const unlockCloseButtons = pricingSection.querySelectorAll("[data-pricing-unlock-close]");
    const unlockSizeInput = pricingSection.querySelector(".pricing-unlock-size");
    const pricingCelebration = pricingSection.querySelector(".pricing-celebration");

    if (unlockModal && unlockModal.parentElement !== document.body) {
        document.body.appendChild(unlockModal);
    }

    if (pricingCelebration && pricingCelebration.parentElement !== document.body) {
        document.body.appendChild(pricingCelebration);
    }

    const pricingContent = {
        230: {
            title: "3 BHK - 230 Sq. Yd",
            badge: "3 BHK - 230 Sq. Yd",
            area: "2,190 Sq.Ft",
            prices: ["2.85 Cr", "2.95 Cr", "3.05 Cr", "3.25 Cr"],
            image: "assets/img/priceing and investment/photo-1600566753190-17f0baa2a6c3.avif"
        },
        219: {
            title: "3 BHK - 219 Sq. Yd",
            badge: "3 BHK - 219 Sq. Yd",
            area: "2,080 Sq.Ft",
            prices: ["2.72 Cr", "2.82 Cr", "2.92 Cr", "3.12 Cr"],
            image: "assets/img/priceing and investment/photo-1600596542815-ffad4c1539a9.avif"
        },
        205: {
            title: "3 BHK - 205 Sq. Yd",
            badge: "3 BHK - 205 Sq. Yd",
            area: "1,950 Sq.Ft",
            prices: ["2.58 Cr", "2.68 Cr", "2.78 Cr", "2.98 Cr"],
            image: "assets/img/priceing and investment/photo-1600607687939-ce8a6c25118c.avif"
        }
    };

    let activeSize = "230";
    let isPricingUnlocked = false;
    let pricingImageTimer;
    let pricingCelebrationTimer;
    const unlockedIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-2.2" /><path d="M6 11h12v10H6V11Z" /></svg>`;
    const getActiveSizeLabel = () => `${activeSize} Sq.Yd`;

    const updateSelectedPrice = (button) => {
        const floorLabel = button.querySelector("span").textContent;
        const price = button.dataset.floorPrice;

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        pricingFloor.textContent = floorLabel;
        selectedPrice.innerHTML = `<span class="pricing-currency">&#8377;</span>${price}*`;
        selectedMeta.innerHTML = `${floorLabel} · <span>${activeSize} Sq.Yd</span>`;
    };

    const syncPricingUnlockSize = () => {
        if (unlockSizeInput) {
            unlockSizeInput.value = getActiveSizeLabel();
        }
    };

    const openPricingUnlockForm = () => {
        if (!unlockModal || isPricingUnlocked) {
            return;
        }

        syncPricingUnlockSize();
        unlockModal.hidden = false;
        document.body.classList.add("is-pricing-modal-open");

        const firstInput = unlockModal.querySelector("input:not([readonly])");

        if (firstInput) {
            setTimeout(() => firstInput.focus(), 60);
        }
    };

    const closePricingUnlockForm = () => {
        if (!unlockModal) {
            return;
        }

        unlockModal.hidden = true;
        document.body.classList.remove("is-pricing-modal-open");
    };

    const showPricingCelebration = () => {
        if (!pricingCelebration) {
            return;
        }

        clearTimeout(pricingCelebrationTimer);
        pricingCelebration.hidden = false;

        pricingCelebrationTimer = setTimeout(() => {
            pricingCelebration.hidden = true;
        }, 2750);
    };

    const unlockPricing = () => {
        if (isPricingUnlocked) {
            return;
        }

        isPricingUnlocked = true;
        pricingSection.classList.add("is-pricing-unlocked");
        pricingCard.classList.add("is-unlocked");
        updateSelectedPrice(pricingSection.querySelector(".floor-price-grid button.is-active"));
        unlockButton.innerHTML = `${unlockedIcon}<span>All Prices Unlocked</span>`;
        unlockButton.setAttribute("aria-label", "All floor prices are unlocked");
    };

    const updatePricingSize = (size) => {
        const content = pricingContent[size];

        if (!content) {
            return;
        }

        activeSize = size;
        syncPricingUnlockSize();
        pricingTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.pricingTab === size);
        });

        pricingTitle.textContent = content.title;
        imageBadge.textContent = content.badge;
        pricingSection.querySelector(".pricing-spec strong").textContent = content.area;

        if (pricingImage && content.image && pricingImage.getAttribute("src") !== content.image) {
            clearTimeout(pricingImageTimer);
            pricingImage.classList.add("is-switching");
            pricingImageTimer = setTimeout(() => {
                pricingImage.src = content.image;
                pricingImage.alt = `${content.title} premium residence view`;
                pricingImage.classList.remove("is-switching");
            }, 160);
        }

        floorButtons.forEach((button, index) => {
            button.dataset.floorPrice = content.prices[index];
            button.querySelector("strong").innerHTML = `<span class="pricing-currency">&#8377;</span>${content.prices[index]}`;
        });

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        floorButtons[0].classList.add("is-active");
        pricingFloor.textContent = "1st Floor";
        selectedMeta.innerHTML = `1st Floor · <span>${activeSize} Sq.Yd</span>`;

        updateSelectedPrice(floorButtons[0]);
    };

    pricingTabs.forEach((tab) => {
        tab.addEventListener("click", () => updatePricingSize(tab.dataset.pricingTab));
    });

    floorButtons.forEach((button) => {
        button.addEventListener("click", () => {
            if (!isPricingUnlocked) {
                return;
            }

            updateSelectedPrice(button);
        });
    });

    unlockButton.addEventListener("click", () => {
        openPricingUnlockForm();
    });

    unlockCloseButtons.forEach((button) => {
        button.addEventListener("click", closePricingUnlockForm);
    });

    if (unlockForm) {
        unlockForm.addEventListener("submit", (event) => {
            event.preventDefault();
            closePricingUnlockForm();
            showPricingCelebration();

            setTimeout(() => {
                unlockPricing();
            }, 520);
        });
    }

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && unlockModal && !unlockModal.hidden) {
            closePricingUnlockForm();
        }
    });

    updatePricingSize(activeSize);
}

// Premium specifications: rotates the quality proof gallery and keeps dots in sync.
const premiumSpecsSection = document.querySelector(".premium-specs-section");

if (premiumSpecsSection) {
    const specTrack = premiumSpecsSection.querySelector(".premium-specs-track");
    const specSlides = premiumSpecsSection.querySelectorAll(".premium-specs-slide");
    const specDots = premiumSpecsSection.querySelectorAll(".premium-specs-dots button");
    const brandTrack = premiumSpecsSection.querySelector(".premium-specs-brand-list");
    const brandItems = premiumSpecsSection.querySelectorAll(".premium-specs-brand");
    const brandDots = premiumSpecsSection.querySelectorAll(".premium-specs-brand-dots button");
    let activeSpecSlide = 1;
    let specSliderInterval;
    let specStartX = 0;
    let specEndX = 0;
    let didSpecSwipe = false;
    let specAnimationTimer;
    let brandIndicatorFrame;
    const specSwipeDistance = 44;
    const specAnimationDuration = 860;

    const setActiveBrand = (index) => {
        brandItems.forEach((item, itemIndex) => {
            item.classList.toggle("is-active", itemIndex === index);
        });

        brandDots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === index);
        });
    };

    const updateBrandIndicator = () => {
        if (!brandTrack || !brandItems.length || !brandDots.length) {
            return;
        }

        const trackRect = brandTrack.getBoundingClientRect();
        const trackCenter = trackRect.left + trackRect.width / 2;
        let activeBrandIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        brandItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(itemCenter - trackCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeBrandIndex = index;
            }
        });

        setActiveBrand(activeBrandIndex);
    };

    const requestBrandIndicatorUpdate = () => {
        cancelAnimationFrame(brandIndicatorFrame);
        brandIndicatorFrame = requestAnimationFrame(updateBrandIndicator);
    };

    const getSpecDirection = (index) => {
        const normalizedIndex = (index + specSlides.length) % specSlides.length;

        if (normalizedIndex === activeSpecSlide) {
            return 0;
        }

        const forwardDistance = (normalizedIndex - activeSpecSlide + specSlides.length) % specSlides.length;
        const backwardDistance = (activeSpecSlide - normalizedIndex + specSlides.length) % specSlides.length;

        return forwardDistance <= backwardDistance ? 1 : -1;
    };

    const setSpecAnimationDirection = (direction) => {
        clearTimeout(specAnimationTimer);
        premiumSpecsSection.classList.remove("is-spec-forward", "is-spec-backward");

        if (!direction) {
            return;
        }

        void premiumSpecsSection.offsetHeight;
        premiumSpecsSection.classList.add(direction > 0 ? "is-spec-forward" : "is-spec-backward");

        specAnimationTimer = setTimeout(() => {
            premiumSpecsSection.classList.remove("is-spec-forward", "is-spec-backward");
        }, specAnimationDuration);
    };

    const setSpecSlide = (index, direction = getSpecDirection(index)) => {
        const previousSpecSlide = activeSpecSlide;

        activeSpecSlide = (index + specSlides.length) % specSlides.length;
        const previousIndex = (activeSpecSlide - 1 + specSlides.length) % specSlides.length;
        const nextIndex = (activeSpecSlide + 1) % specSlides.length;

        setSpecAnimationDirection(previousSpecSlide !== activeSpecSlide ? direction : 0);

        specSlides.forEach((slide, slideIndex) => {
            slide.classList.toggle("is-prev", slideIndex === previousIndex);
            slide.classList.toggle("is-active", slideIndex === activeSpecSlide);
            slide.classList.toggle("is-next", slideIndex === nextIndex);
        });

        specDots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === activeSpecSlide);
        });
    };

    const startSpecSlider = () => {
        specSliderInterval = setInterval(() => {
            setSpecSlide(activeSpecSlide + 1, 1);
        }, 5000);
    };

    const resetSpecSlider = () => {
        clearInterval(specSliderInterval);
        startSpecSlider();
    };

    const handleSpecSwipe = () => {
        const distance = specStartX - specEndX;

        if (Math.abs(distance) < specSwipeDistance) {
            return;
        }

        didSpecSwipe = true;
        setSpecSlide(distance > 0 ? activeSpecSlide + 1 : activeSpecSlide - 1, distance > 0 ? 1 : -1);
        resetSpecSlider();

        setTimeout(() => {
            didSpecSwipe = false;
        }, 0);
    };

    specDots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            setSpecSlide(index);
            resetSpecSlider();
        });
    });

    specSlides.forEach((slide, index) => {
        slide.addEventListener("click", () => {
            if (didSpecSwipe) {
                return;
            }

            if (index === activeSpecSlide) {
                setSpecSlide(activeSpecSlide + 1, 1);
                resetSpecSlider();
                return;
            }

            setSpecSlide(index);
            resetSpecSlider();
        });
    });

    specTrack.addEventListener("touchstart", (event) => {
        specStartX = event.touches[0].clientX;
    }, { passive: true });

    specTrack.addEventListener("touchend", (event) => {
        specEndX = event.changedTouches[0].clientX;
        handleSpecSwipe();
    });

    specTrack.addEventListener("mousedown", (event) => {
        specStartX = event.clientX;
    });

    specTrack.addEventListener("mouseup", (event) => {
        specEndX = event.clientX;
        handleSpecSwipe();
    });

    if (brandTrack && brandItems.length && brandDots.length) {
        brandDots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                brandItems[index].scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
                setActiveBrand(index);
            });
        });

        brandTrack.addEventListener("scroll", requestBrandIndicatorUpdate, { passive: true });
        window.addEventListener("resize", requestBrandIndicatorUpdate);
        updateBrandIndicator();
    }

    setSpecSlide(activeSpecSlide);
    startSpecSlider();
}

// Visual showcase: switches gallery tabs, copy, and walkthrough/construction views.
const visualShowcaseSection = document.querySelector(".visual-showcase-section");

if (visualShowcaseSection) {
    const galleryTabs = visualShowcaseSection.querySelectorAll("[data-gallery-tab]");
    const galleryPanels = visualShowcaseSection.querySelectorAll("[data-gallery-panel]");
    const galleryCopies = visualShowcaseSection.querySelectorAll("[data-gallery-copy]");
    const galleryUpdate = visualShowcaseSection.querySelector(".visual-showcase-update");
    const galleryGrids = visualShowcaseSection.querySelectorAll(".visual-showcase-grid");
    const galleryGridState = new Map();
    let activeGalleryTab = "sample";
    let gallerySwitchTimer;
    const isMobileGallery = () => window.matchMedia("(max-width: 767px)").matches;

    const setActiveGalleryImage = (grid, index) => {
        const state = galleryGridState.get(grid);

        if (!state) {
            return;
        }

        state.cards.forEach((card, cardIndex) => {
            card.classList.toggle("is-active", cardIndex === index);
        });

        state.dots.forEach((dot, dotIndex) => {
            dot.classList.toggle("is-active", dotIndex === index);
        });
    };

    const updateGalleryIndicator = (grid) => {
        const state = galleryGridState.get(grid);

        if (!state || !isMobileGallery() || grid.closest("[hidden]")) {
            return;
        }

        const gridRect = grid.getBoundingClientRect();
        const gridCenter = gridRect.left + gridRect.width / 2;
        let activeIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        state.cards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - gridCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeIndex = index;
            }
        });

        setActiveGalleryImage(grid, activeIndex);
    };

    const requestGalleryIndicatorUpdate = (grid) => {
        const state = galleryGridState.get(grid);

        if (!state) {
            return;
        }

        cancelAnimationFrame(state.frame);
        state.frame = requestAnimationFrame(() => updateGalleryIndicator(grid));
    };

    const updateActiveGalleryGrid = () => {
        galleryGrids.forEach((grid) => updateGalleryIndicator(grid));
    };

    galleryGrids.forEach((grid) => {
        const cards = Array.from(grid.querySelectorAll(".visual-gallery-card"));

        if (cards.length < 2) {
            return;
        }

        const dotsWrap = document.createElement("div");
        dotsWrap.className = "visual-gallery-dots";
        dotsWrap.setAttribute("aria-label", "Gallery image controls");

        const dots = cards.map((card, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.setAttribute("aria-label", `Show gallery image ${index + 1}`);
            dot.classList.toggle("is-active", index === 0);
            dotsWrap.appendChild(dot);

            dot.addEventListener("click", () => {
                card.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
                setActiveGalleryImage(grid, index);
            });

            return dot;
        });

        grid.insertAdjacentElement("afterend", dotsWrap);
        galleryGridState.set(grid, { cards, dots, frame: 0 });
        setActiveGalleryImage(grid, 0);
        grid.addEventListener("scroll", () => requestGalleryIndicatorUpdate(grid), { passive: true });
    });

    const setGalleryTab = (key) => {
        if (key === activeGalleryTab) {
            return;
        }

        activeGalleryTab = key;
        clearTimeout(gallerySwitchTimer);
        visualShowcaseSection.classList.add("is-gallery-switching");

        galleryTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.galleryTab === key);
        });

        gallerySwitchTimer = setTimeout(() => {
            galleryPanels.forEach((panel) => {
                const isActive = panel.dataset.galleryPanel === key;

                panel.hidden = !isActive;
                panel.classList.toggle("is-active", isActive);
            });

            galleryCopies.forEach((copy) => {
                copy.hidden = copy.dataset.galleryCopy !== key;
            });

            galleryUpdate.hidden = key !== "construction";

            requestAnimationFrame(() => {
                visualShowcaseSection.classList.remove("is-gallery-switching");
                updateActiveGalleryGrid();
            });
        }, 320);
    };

    galleryTabs.forEach((tab) => {
        tab.addEventListener("click", () => setGalleryTab(tab.dataset.galleryTab));
    });

    window.addEventListener("resize", updateActiveGalleryGrid);
    updateActiveGalleryGrid();
}

// Prime location: switches the map card between the designed image and embedded Google Map.
const primeLocationSection = document.querySelector(".prime-location-section");

if (primeLocationSection) {
    const primeMap = primeLocationSection.querySelector(".prime-location-map");
    const mapTabs = primeLocationSection.querySelectorAll("[data-prime-map-tab]");
    const mapPanels = primeLocationSection.querySelectorAll("[data-prime-map-panel]");
    const mapOpenButtons = primeLocationSection.querySelectorAll("[data-prime-map-open]");
    const distanceGrid = primeLocationSection.querySelector(".prime-distance-grid");
    const distanceCards = distanceGrid ? Array.from(distanceGrid.querySelectorAll(".prime-distance-card")) : [];
    const distanceProgress = primeLocationSection.querySelector(".prime-distance-progress span");
    let distanceFrame = 0;
    let locationCtaFrame = 0;
    let isLocationCtaShifted = false;
    const isMobileDistanceSlider = () => window.matchMedia("(max-width: 767px)").matches;

    const setPrimeMapPanel = (key) => {
        mapTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.primeMapTab === key);
        });

        mapPanels.forEach((panel) => {
            const isActive = panel.dataset.primeMapPanel === key;

            panel.hidden = !isActive;
            panel.classList.toggle("is-active", isActive);
        });

        primeMap.classList.toggle("is-google-active", key === "google");
    };

    mapTabs.forEach((tab) => {
        tab.addEventListener("click", () => setPrimeMapPanel(tab.dataset.primeMapTab));
    });

    mapOpenButtons.forEach((button) => {
        button.addEventListener("click", () => {
            setPrimeMapPanel(button.dataset.primeMapOpen);
            primeMap.scrollIntoView({ block: "center", behavior: "smooth" });
        });
    });

    const setActiveDistanceCard = (activeIndex) => {
        distanceCards.forEach((card, index) => {
            card.classList.toggle("is-active", index === activeIndex);
        });
    };

    const updateDistanceSlider = () => {
        if (!distanceGrid || !distanceCards.length || !isMobileDistanceSlider()) {
            return;
        }

        const maxScroll = distanceGrid.scrollWidth - distanceGrid.clientWidth;
        const progress = maxScroll > 0 ? distanceGrid.scrollLeft / maxScroll : 0;
        const progressWidth = Math.max(18, Math.min(100, 18 + (progress * 82)));

        if (distanceProgress) {
            distanceProgress.style.width = `${progressWidth}%`;
        }

        const gridRect = distanceGrid.getBoundingClientRect();
        const gridCenter = gridRect.left + gridRect.width / 2;
        let activeIndex = 0;
        let closestDistance = Number.POSITIVE_INFINITY;

        distanceCards.forEach((card, index) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - gridCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeIndex = index;
            }
        });

        setActiveDistanceCard(activeIndex);
    };

    const requestDistanceSliderUpdate = () => {
        cancelAnimationFrame(distanceFrame);
        distanceFrame = requestAnimationFrame(updateDistanceSlider);
    };

    const updateLocationCtaShift = () => {
        const distanceBlock = distanceGrid ? distanceGrid.closest(".prime-distance-block") : null;

        if (!distanceBlock || !distanceGrid) {
            isLocationCtaShifted = false;
            primeLocationSection.classList.remove("is-distance-cta-shifted");
            return;
        }

        const viewportHeight = window.innerHeight;
        const distanceRect = distanceGrid.getBoundingClientRect();
        const shouldShiftCta = isMobileDistanceSlider()
            ? (
                isLocationCtaShifted
                    ? distanceRect.top <= viewportHeight * 0.74
                    : distanceRect.top <= viewportHeight * 0.62
            )
            : (
                isLocationCtaShifted
                    ? distanceRect.top <= viewportHeight * 0.56
                    : distanceRect.bottom <= viewportHeight * 0.92
            );

        if (shouldShiftCta === isLocationCtaShifted) {
            return;
        }

        isLocationCtaShifted = shouldShiftCta;
        primeLocationSection.classList.toggle("is-distance-cta-shifted", isLocationCtaShifted);
    };

    const requestLocationCtaShiftUpdate = () => {
        cancelAnimationFrame(locationCtaFrame);
        locationCtaFrame = requestAnimationFrame(updateLocationCtaShift);
    };

    if (distanceGrid && distanceCards.length) {
        setActiveDistanceCard(0);
        distanceGrid.addEventListener("scroll", requestDistanceSliderUpdate, { passive: true });
        window.addEventListener("resize", requestDistanceSliderUpdate);
        window.addEventListener("scroll", requestLocationCtaShiftUpdate, { passive: true });
        window.addEventListener("resize", requestLocationCtaShiftUpdate);
        requestDistanceSliderUpdate();
        requestLocationCtaShiftUpdate();
    }
}

// Project essentials: hover over each item to update the preview images with a smooth transform effect.
const projectEssentialsSection = document.querySelector(".project-essentials-section");

if (projectEssentialsSection) {
    const visuals = projectEssentialsSection.querySelector(".project-essentials-visual");
    const previewPrevImg = projectEssentialsSection.querySelector(".project-essentials-preview--prev img");
    const previewActiveImg = projectEssentialsSection.querySelector(".project-essentials-preview--active img");
    const previewNextImg = projectEssentialsSection.querySelector(".project-essentials-preview--next img");
    const previewButtons = projectEssentialsSection.querySelectorAll(".project-essentials-btn[data-preview-active]");
    const originalPreviews = {
        prev: previewPrevImg?.src,
        active: previewActiveImg?.src,
        next: previewNextImg?.src
    };

    const fadeImageTo = (img, src) => {
        if (!img || img.getAttribute("src") === src) {
            return;
        }

        const preloader = new Image();
        preloader.onload = () => {
            img.style.opacity = "0";
            setTimeout(() => {
                img.src = src;
                img.style.opacity = "1";
            }, 175); // Half the transition duration for smooth crossfade
        };
        preloader.src = src;
    };

    const updatePreviews = (previewData) => {
        if (!previewPrevImg || !previewActiveImg || !previewNextImg) {
            return;
        }

        fadeImageTo(previewPrevImg, previewData.prev);
        fadeImageTo(previewActiveImg, previewData.active);
        fadeImageTo(previewNextImg, previewData.next);
        visuals?.classList.add("is-preview-hovered");
    };

    const resetPreviews = () => {
        if (!previewPrevImg || !previewActiveImg || !previewNextImg) {
            return;
        }

        fadeImageTo(previewPrevImg, originalPreviews.prev);
        fadeImageTo(previewActiveImg, originalPreviews.active);
        fadeImageTo(previewNextImg, originalPreviews.next);
        visuals?.classList.remove("is-preview-hovered");
        previewButtons.forEach((btn) => btn.classList.remove("is-active"));
    };

    const setActiveButton = (button) => {
        previewButtons.forEach((btn) => {
            btn.classList.toggle("is-active", btn === button);
        });
    };

    previewButtons.forEach((button) => {
        const previewData = {
            active: button.dataset.previewActive,
            prev: button.dataset.previewPrev,
            next: button.dataset.previewNext
        };

        button.addEventListener("mouseenter", () => {
            setActiveButton(button);
            updatePreviews(previewData);
        });

        button.addEventListener("focus", () => {
            setActiveButton(button);
            updatePreviews(previewData);
        });
    });

    projectEssentialsSection.addEventListener("mouseleave", resetPreviews);
    projectEssentialsSection.addEventListener("focusout", (event) => {
        if (!projectEssentialsSection.contains(event.relatedTarget)) {
            resetPreviews();
        }
    });
}

// Lifestyle amenities: filters the screenshot-style amenity grid by category.
const lifestyleAmenitiesSection = document.querySelector(".lifestyle-amenities-section");

if (lifestyleAmenitiesSection) {
    const amenityTabsWrap = lifestyleAmenitiesSection.querySelector(".lifestyle-amenities-tabs");
    const amenityTabs = lifestyleAmenitiesSection.querySelectorAll("[data-amenity-tab]");
    const amenityCards = lifestyleAmenitiesSection.querySelectorAll("[data-amenity-type]");
    const amenityGrid = lifestyleAmenitiesSection.querySelector(".lifestyle-amenities-grid");
    const amenityTabProgress = lifestyleAmenitiesSection.querySelector(".lifestyle-amenities-tab-progress span");
    const amenityProgress = lifestyleAmenitiesSection.querySelector(".lifestyle-amenities-progress span");
    let amenityFrame = 0;
    let amenityTabFrame = 0;
    const isMobileAmenitySlider = () => window.matchMedia("(max-width: 767px)").matches;

    const getVisibleAmenityCards = () => Array.from(amenityCards).filter((card) => !card.classList.contains("is-hidden"));

    const setActiveAmenityCard = (activeCard) => {
        amenityCards.forEach((card) => {
            card.classList.toggle("is-active", card === activeCard);
        });
    };

    const updateAmenitySlider = () => {
        if (!amenityGrid || !isMobileAmenitySlider()) {
            return;
        }

        const visibleCards = getVisibleAmenityCards();

        if (!visibleCards.length) {
            return;
        }

        if (visibleCards.length <= 1) {
            if (amenityProgress) {
                amenityProgress.style.width = "100%";
            }

            setActiveAmenityCard(visibleCards[0]);
            return;
        }

        const maxScroll = amenityGrid.scrollWidth - amenityGrid.clientWidth;
        const progress = maxScroll > 0 ? amenityGrid.scrollLeft / maxScroll : 0;
        const progressWidth = Math.max(18, Math.min(100, 18 + (progress * 82)));

        if (amenityProgress) {
            amenityProgress.style.width = `${progressWidth}%`;
        }

        const gridRect = amenityGrid.getBoundingClientRect();
        const gridCenter = gridRect.left + gridRect.width / 2;
        let activeCard = visibleCards[0];
        let closestDistance = Number.POSITIVE_INFINITY;

        visibleCards.forEach((card) => {
            const cardRect = card.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - gridCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeCard = card;
            }
        });

        setActiveAmenityCard(activeCard);
    };

    const requestAmenitySliderUpdate = () => {
        cancelAnimationFrame(amenityFrame);
        amenityFrame = requestAnimationFrame(updateAmenitySlider);
    };

    const updateAmenityTabProgress = () => {
        if (!amenityTabsWrap || !amenityTabProgress || !isMobileAmenitySlider()) {
            return;
        }

        const maxScroll = amenityTabsWrap.scrollWidth - amenityTabsWrap.clientWidth;
        const progress = maxScroll > 0 ? amenityTabsWrap.scrollLeft / maxScroll : 1;
        const progressWidth = maxScroll > 0 ? Math.max(24, Math.min(100, 24 + (progress * 76))) : 100;

        amenityTabProgress.style.width = `${progressWidth}%`;
    };

    const requestAmenityTabProgressUpdate = () => {
        cancelAnimationFrame(amenityTabFrame);
        amenityTabFrame = requestAnimationFrame(updateAmenityTabProgress);
    };

    const setAmenityTab = (key) => {
        let activeTab = null;

        amenityTabs.forEach((tab) => {
            const isActive = tab.dataset.amenityTab === key;
            tab.classList.toggle("is-active", isActive);

            if (isActive) {
                activeTab = tab;
            }
        });

        amenityCards.forEach((card) => {
            const shouldShow = key === "all" || card.dataset.amenityType === key;
            card.classList.toggle("is-hidden", !shouldShow);
        });

        if (activeTab && isMobileAmenitySlider()) {
            activeTab.scrollIntoView({
                behavior: "smooth",
                block: "nearest",
                inline: "center"
            });
        }

        if (amenityGrid) {
            amenityGrid.scrollTo({ left: 0, behavior: isMobileAmenitySlider() ? "smooth" : "auto" });
        }

        requestAmenitySliderUpdate();
        requestAmenityTabProgressUpdate();
    };

    amenityTabs.forEach((tab) => {
        tab.addEventListener("click", () => setAmenityTab(tab.dataset.amenityTab));
    });

    if (amenityGrid) {
        amenityGrid.addEventListener("scroll", requestAmenitySliderUpdate, { passive: true });
        window.addEventListener("resize", requestAmenitySliderUpdate);
        requestAmenitySliderUpdate();
    }

    if (amenityTabsWrap) {
        amenityTabsWrap.addEventListener("scroll", requestAmenityTabProgressUpdate, { passive: true });
        window.addEventListener("resize", requestAmenityTabProgressUpdate);
        requestAmenityTabProgressUpdate();
    }
}

// Buyer testimonials: slider progress fill.
const buyerAppreciationSection = document.querySelector(".buyer-appreciation-section");

if (buyerAppreciationSection) {
    const testimonialSlider = buyerAppreciationSection.querySelector(".buyer-testimonials-slider");
    const testimonialProgress = buyerAppreciationSection.querySelector(".buyer-testimonials-progress span");
    let testimonialFrame = 0;
    let testimonialPointerDown = false;
    let testimonialStartX = 0;
    let testimonialStartScroll = 0;

    const updateTestimonialProgress = () => {
        if (!testimonialSlider || !testimonialProgress) {
            return;
        }

        const maxScroll = testimonialSlider.scrollWidth - testimonialSlider.clientWidth;
        const progress = maxScroll > 0 ? testimonialSlider.scrollLeft / maxScroll : 1;
        const progressWidth = maxScroll > 0 ? Math.max(18, Math.min(100, 18 + (progress * 82))) : 100;

        testimonialProgress.style.width = `${progressWidth}%`;
    };

    const requestTestimonialProgressUpdate = () => {
        cancelAnimationFrame(testimonialFrame);
        testimonialFrame = requestAnimationFrame(updateTestimonialProgress);
    };

    if (testimonialSlider) {
        testimonialSlider.addEventListener("scroll", requestTestimonialProgressUpdate, { passive: true });

        testimonialSlider.addEventListener("wheel", (event) => {
            if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }

            event.preventDefault();
            testimonialSlider.scrollLeft += event.deltaY;
            requestTestimonialProgressUpdate();
        }, { passive: false });

        testimonialSlider.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
                return;
            }

            testimonialPointerDown = true;
            testimonialStartX = event.clientX;
            testimonialStartScroll = testimonialSlider.scrollLeft;
            testimonialSlider.classList.add("is-dragging");
            testimonialSlider.setPointerCapture(event.pointerId);
        });

        testimonialSlider.addEventListener("pointermove", (event) => {
            if (!testimonialPointerDown) {
                return;
            }

            const distance = event.clientX - testimonialStartX;
            testimonialSlider.scrollLeft = testimonialStartScroll - distance;
            requestTestimonialProgressUpdate();
        });

        const stopTestimonialDrag = (event) => {
            if (!testimonialPointerDown) {
                return;
            }

            testimonialPointerDown = false;
            testimonialSlider.classList.remove("is-dragging");

            if (testimonialSlider.hasPointerCapture(event.pointerId)) {
                testimonialSlider.releasePointerCapture(event.pointerId);
            }
        };

        testimonialSlider.addEventListener("pointerup", stopTestimonialDrag);
        testimonialSlider.addEventListener("pointercancel", stopTestimonialDrag);
        testimonialSlider.addEventListener("pointerleave", stopTestimonialDrag);
        window.addEventListener("resize", requestTestimonialProgressUpdate);
        requestTestimonialProgressUpdate();
    }
}

// Construction progress: fills the status ring and count after reveal.
const constructionProgressSection = document.querySelector(".construction-progress-section");

if (constructionProgressSection) {
    const progressCount = constructionProgressSection.querySelector("[data-construction-progress-count]");
    let constructionProgressStarted = false;
    let constructionProgressFrame = 0;
    let constructionProgressRun = 0;

    const getConstructionProgressTarget = () => {
        if (!progressCount) {
            return 35;
        }

        const target = Number(progressCount.dataset.progressTarget || progressCount.textContent || 35);
        return Number.isFinite(target) ? Math.max(0, Math.min(100, target)) : 35;
    };

    const resetConstructionProgress = () => {
        cancelAnimationFrame(constructionProgressFrame);
        constructionProgressRun += 1;
        constructionProgressStarted = false;
        constructionProgressSection.classList.remove("is-progress-animated");

        if (progressCount) {
            progressCount.textContent = "0";
        }
    };

    const animateConstructionProgress = () => {
        if (!progressCount || constructionProgressStarted) {
            return;
        }

        const safeTarget = getConstructionProgressTarget();
        const duration = 1450;
        const startTime = performance.now();
        const runId = ++constructionProgressRun;

        constructionProgressStarted = true;
        constructionProgressSection.classList.add("is-progress-animated");
        progressCount.textContent = "0";

        const tick = (time) => {
            if (runId !== constructionProgressRun) {
                return;
            }

            const progress = Math.min((time - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = Math.round(safeTarget * eased);

            progressCount.textContent = String(value);

            if (progress < 1) {
                constructionProgressFrame = requestAnimationFrame(tick);
                return;
            }

            progressCount.textContent = String(safeTarget);
        };

        constructionProgressFrame = requestAnimationFrame(tick);
    };

    if (progressCount) {
        progressCount.textContent = "0";

        if ("IntersectionObserver" in window) {
            const constructionProgressObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animateConstructionProgress();
                        return;
                    }

                    resetConstructionProgress();
                });
            }, {
                threshold: 0.34
            });

            constructionProgressObserver.observe(constructionProgressSection);
        } else {
            animateConstructionProgress();
        }
    }
}

// FAQ: switches category tabs and opens one answer at a time inside each category.
const faqSection = document.querySelector(".faq-section");

if (faqSection) {
    const faqTabs = faqSection.querySelectorAll("[data-faq-tab]");
    const faqPanels = faqSection.querySelectorAll("[data-faq-panel]");
    const faqTabsWrap = faqSection.querySelector(".faq-tabs");
    const faqTabProgress = faqSection.querySelector(".faq-tab-progress span");
    let faqTabProgressFrame = 0;

    const isMobileFaqTabs = () => window.matchMedia("(max-width: 991px)").matches;

    const updateFaqTabProgress = () => {
        if (!faqTabsWrap || !faqTabProgress || !isMobileFaqTabs()) {
            return;
        }

        const maxScroll = faqTabsWrap.scrollWidth - faqTabsWrap.clientWidth;
        const progress = maxScroll > 0 ? faqTabsWrap.scrollLeft / maxScroll : 1;
        const progressWidth = maxScroll > 0 ? Math.max(24, Math.min(100, 24 + (progress * 76))) : 100;

        faqTabProgress.style.width = `${progressWidth}%`;
    };

    const requestFaqTabProgressUpdate = () => {
        cancelAnimationFrame(faqTabProgressFrame);
        faqTabProgressFrame = requestAnimationFrame(updateFaqTabProgress);
    };

    const setFaqPanel = (key) => {
        faqTabs.forEach((tab) => {
            const isActive = tab.dataset.faqTab === key;
            tab.classList.toggle("is-active", isActive);
            tab.setAttribute("aria-selected", String(isActive));
        });

        faqPanels.forEach((panel) => {
            const isActive = panel.dataset.faqPanel === key;
            panel.hidden = !isActive;
            panel.classList.toggle("is-active", isActive);
        });
    };

    const setFaqItem = (item, shouldOpen) => {
        const button = item.querySelector("[data-faq-toggle]");
        const answer = item.querySelector(".faq-answer");

        item.classList.toggle("is-open", shouldOpen);
        button.setAttribute("aria-expanded", String(shouldOpen));
        answer.hidden = !shouldOpen;
    };

    faqTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            setFaqPanel(tab.dataset.faqTab);

            if (faqTabsWrap && isMobileFaqTabs()) {
                tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
                requestFaqTabProgressUpdate();
            }
        });
    });

    if (faqTabsWrap) {
        faqTabsWrap.addEventListener("scroll", requestFaqTabProgressUpdate, { passive: true });
        window.addEventListener("resize", requestFaqTabProgressUpdate);
        requestFaqTabProgressUpdate();
    }

    faqSection.querySelectorAll("[data-faq-toggle]").forEach((button) => {
        button.addEventListener("click", () => {
            const item = button.closest(".faq-item");
            const panel = button.closest("[data-faq-panel]");
            const shouldOpen = !item.classList.contains("is-open");

            panel.querySelectorAll(".faq-item").forEach((panelItem) => {
                setFaqItem(panelItem, panelItem === item && shouldOpen);
            });
        });
    });
}

// Site visit form: keeps the static landing page from reloading on submit.
const siteVisitForm = document.querySelector(".site-visit-form");

if (siteVisitForm) {
    siteVisitForm.addEventListener("submit", (event) => {
        event.preventDefault();
    });
}

// Scroll reveal: toggles .is-visible for sections that animate when entering the viewport.
const revealSections = document.querySelectorAll(".reveal-on-scroll");

if (revealSections.length) {
    if ("IntersectionObserver" in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const isDifferentiationSection = entry.target.classList.contains("differentiation-section");
                const shouldReveal = isDifferentiationSection
                    ? entry.isIntersecting && entry.intersectionRatio >= 0.50
                    : entry.isIntersecting;

                entry.target.classList.toggle("is-visible", shouldReveal);
            });
        }, {
            threshold: [0.04, 0.16, 0.28, 0.42, 0.50, 0.62],
            rootMargin: "0px 0px -120px 0px"
        });

        revealSections.forEach((section) => revealObserver.observe(section));
    } else {
        revealSections.forEach((section) => section.classList.add("is-visible"));
    }
}
