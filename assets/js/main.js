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
    const desktopStoryDuration = 6500;
    const mobileStoryDuration = 4200;

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
    const getStoryDuration = () => (isMobileStory() ? mobileStoryDuration : desktopStoryDuration);

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
        heroSection.style.setProperty("--hero-story-duration", `${getStoryDuration()}ms`);
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
        const storyDuration = getStoryDuration();
        heroSection.style.setProperty("--hero-story-duration", `${storyDuration}ms`);
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
        updateStoryProgress();
        resetAutoSlide();
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

// Structured story slider (ported from github.com/Anil-0001/Amelia-Estate/js/script.js; scroll lock extended for this layout).
const structSliderSection = document.querySelector(".struct-slider-section");
const structSlides = structSliderSection?.querySelectorAll(".struct-slide") || [];
const structCopies = structSliderSection?.querySelectorAll(".struct-copy") || [];
const structIndexes = structSliderSection?.querySelectorAll(".struct-index") || [];
const structDots = structSliderSection?.querySelectorAll(".struct-dot") || [];

let activeStructSlide = 0;
let structTouchStartY = 0;
let structAnimating = false;
let structLocked = false;
let structReleasedDirection = 0;

const updateStructSlide = (nextIndex) => {
    if (!structSlides.length || structAnimating || nextIndex === activeStructSlide) {
        return;
    }

    structAnimating = true;
    structSlides[activeStructSlide]?.classList.remove("is-active");
    structCopies[activeStructSlide]?.classList.remove("is-active");
    structIndexes[activeStructSlide]?.classList.remove("is-active");
    structDots[activeStructSlide]?.classList.remove("is-active");

    activeStructSlide = nextIndex;
    structSlides[activeStructSlide]?.classList.add("is-active");
    structCopies[activeStructSlide]?.classList.add("is-active");
    structIndexes[activeStructSlide]?.classList.add("is-active");
    structDots[activeStructSlide]?.classList.add("is-active");

    window.setTimeout(() => {
        structAnimating = false;
    }, 700);
};

if (structSliderSection && structSlides.length > 1) {
    const canMoveStructSlide = (direction) =>
        (direction > 0 && activeStructSlide < structSlides.length - 1) ||
        (direction < 0 && activeStructSlide > 0);

    const isStructInFocus = () => {
        const rect = structSliderSection.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.72 && rect.bottom > window.innerHeight * 0.28;
    };

    const isStructSectionFullyOutOfView = () => {
        const rect = structSliderSection.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight || 1;

        return rect.bottom < 1 || rect.top > vh - 1;
    };

    const setStructLock = (shouldLock) => {
        if (shouldLock === structLocked) {
            return;
        }

        structLocked = shouldLock;
        document.documentElement.classList.toggle("struct-slider-locked", shouldLock);
        document.body.classList.toggle("struct-slider-locked", shouldLock);

        if (shouldLock) {
            structSliderSection.scrollIntoView({ block: "start" });
        }
    };

    const syncStructLock = () => {
        if (!isStructInFocus()) {
            if (isStructSectionFullyOutOfView()) {
                structReleasedDirection = 0;
            }

            setStructLock(false);
            return;
        }

        if (
            (structReleasedDirection === 1 && activeStructSlide === structSlides.length - 1) ||
            (structReleasedDirection === -1 && activeStructSlide === 0)
        ) {
            setStructLock(false);
            return;
        }

        setStructLock(true);
    };

    const handleStructDirection = (direction, event) => {
        if (!isStructInFocus()) {
            syncStructLock();
            return;
        }

        if (canMoveStructSlide(direction)) {
            event.preventDefault();
            structReleasedDirection = 0;
            setStructLock(true);
            updateStructSlide(activeStructSlide + direction);
            return;
        }

        structReleasedDirection = direction;
        setStructLock(false);
    };

    const handleStructWheel = (event) => {
        const dy = event.deltaY;

        if (dy === 0) {
            return;
        }

        const atFirstSlide = activeStructSlide === 0;
        const atLastSlide = activeStructSlide === structSlides.length - 1;
        const boundaryWheelExit =
            isStructInFocus() &&
            ((atFirstSlide && dy < 0) || (atLastSlide && dy > 0));

        if (Math.abs(dy) <= 12 && !boundaryWheelExit) {
            return;
        }

        handleStructDirection(dy > 0 ? 1 : -1, event);
    };

    const handleStructTouchStart = (event) => {
        structTouchStartY = event.touches[0]?.clientY || 0;
    };

    const handleStructTouchMove = (event) => {
        if (!isStructInFocus()) {
            return;
        }

        const currentY = event.touches[0]?.clientY || 0;
        const deltaY = structTouchStartY - currentY;

        if (Math.abs(deltaY) > 16) {
            handleStructDirection(deltaY > 0 ? 1 : -1, event);
            structTouchStartY = currentY;
        }
    };

    const handleStructKeydown = (event) => {
        if (!isStructInFocus()) {
            return;
        }

        if (["ArrowDown", "PageDown", "Space"].includes(event.code)) {
            handleStructDirection(1, event);
        } else if (["ArrowUp", "PageUp"].includes(event.code)) {
            handleStructDirection(-1, event);
        }
    };

    window.addEventListener("scroll", syncStructLock, { passive: true });
    window.addEventListener("wheel", handleStructWheel, { passive: false });
    window.addEventListener("touchstart", handleStructTouchStart, { passive: true });
    window.addEventListener("touchmove", handleStructTouchMove, { passive: false });
    window.addEventListener("keydown", handleStructKeydown);
    syncStructLock();
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
            const aboutToggleLabel = aboutToggle.querySelector("span:first-child");

            if (shouldOpen) {
                aboutToggleLabel.textContent = "Show Less";
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
                aboutToggleLabel.textContent = "Read More";
            }, 620);
        });
    }
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
    let hideInStruct = false;

    if (structSliderSection) {
        const structRect = structSliderSection.getBoundingClientRect();
        hideInStruct = structRect.top <= 2 && structRect.bottom > 64;
    }

    const shouldHideHeader = hideAtTop || hideInStruct;

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
    let activeFloor = "4th";
    let idealImageTimer;
    let idealImageRequest = 0;

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

    Object.values(sizeDetails).forEach(({ image }) => {
        if (image) {
            const preload = new Image();
            preload.src = image;
        }
    });

    const switchIdealImage = (src) => {
        if (!idealImage || !src || idealImage.getAttribute("src") === src) {
            return;
        }

        const requestId = ++idealImageRequest;
        clearTimeout(idealImageTimer);
        idealFloorSection.querySelectorAll(".ideal-floor-media-next").forEach((image) => image.remove());

        const nextImage = new Image();
        nextImage.className = "ideal-floor-media-next";
        nextImage.alt = idealImage.alt;
        nextImage.setAttribute("aria-hidden", "true");
        nextImage.src = src;
        const minimumFade = new Promise((resolve) => {
            setTimeout(resolve, 180);
        });

        const finishSwitch = () => {
            if (requestId !== idealImageRequest) {
                return;
            }

            idealImage.parentElement.appendChild(nextImage);
            requestAnimationFrame(() => {
                nextImage.classList.add("is-visible");
            });

            idealImageTimer = setTimeout(() => {
                if (requestId === idealImageRequest) {
                    idealImage.src = src;
                    nextImage.remove();
                }
            }, 620);
        };

        const imageReady = nextImage.decode
            ? nextImage.decode().catch(() => undefined)
            : new Promise((resolve) => {
                nextImage.onload = resolve;
                nextImage.onerror = resolve;
            });

        if (nextImage.decode) {
            Promise.all([imageReady, minimumFade]).then(finishSwitch);
        } else {
            Promise.all([imageReady, minimumFade]).then(finishSwitch);
        }
    };

    const refreshIdealFloor = () => {
        const size = sizeDetails[activeSize];
        const feature = featureCopy[activeFloor] || "Premium Floor";

        if (!size) {
            return;
        }

        badgeSizeFloor.textContent = `${size.label} - ${activeFloor} Floor`;
        if (activeFloor === "4th") {
            badgeFeature.style.display = "";
            badgeFeature.innerHTML = `${badgeFeatureIcon}${feature}`;
        } else {
            badgeFeature.style.display = "none";
        }
        panelSubtitle.textContent = `${activeSize} Sq. Yd ${activeFloor} Floor Selected`;
        specValues[0].textContent = size.area;

        switchIdealImage(size.image);
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
    const badgeLabel = projectPlansSection.querySelector(".project-plan-badge-label");
    const badgeAccentText = projectPlansSection.querySelector(".project-plan-badge-accent-text");
    const footerTitle = projectPlansSection.querySelector(".project-plan-footer h3");
    const footerCopy = projectPlansSection.querySelector(".project-plan-footer p");
    const toolLinks = projectPlansSection.querySelectorAll(".project-plan-tools a");
    const lightbox = document.getElementById("project-plan-lightbox");
    const lightboxImage = lightbox?.querySelector(".project-plan-lightbox-image");
    const lightboxTitle = lightbox?.querySelector(".project-plan-lightbox-title");
    const lightboxCloseButtons = lightbox?.querySelectorAll(".project-plan-lightbox-close, .project-plan-lightbox-backdrop");

    const floorImage = "assets/img/project plans/90009c575573f8f004b5343f065db6963be4f203.png";
    const siteImage = "assets/img/project plans/site plan.jpg";
    let activePlan = "floor";

    [floorImage, siteImage].forEach((src) => {
        const preload = new Image();
        preload.src = src;
    });

    const planContent = {
        floor: {
            image: floorImage,
            alt: "3 BHK floor plan layout",
            badge: "230 Sq.Yd Floor Plan",
            badgeAccent: "3 BHK layout",
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
            badgeAccent: "Site layout",
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
            badgeAccent: "Stack view",
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

        image.classList.remove("is-switching");
        image.src = content.image;
        image.alt = content.alt;
        badgeLabel.textContent = content.badge;
        badgeAccentText.textContent = content.badgeAccent;
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
    };

    const openPlanLightbox = () => {
        if (!lightbox || !lightboxImage || !lightboxTitle) {
            return;
        }

        lightboxImage.src = image.currentSrc || image.src;
        lightboxImage.alt = image.alt;
        lightboxTitle.textContent = badgeLabel.textContent;
        lightbox.removeAttribute("hidden");
        document.body.classList.add("is-project-plan-lightbox-open");
    };

    const closePlanLightbox = () => {
        if (!lightbox) {
            return;
        }

        lightbox.setAttribute("hidden", "");
        document.body.classList.remove("is-project-plan-lightbox-open");
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
                badgeLabel.textContent = `${label} Floor Plan`;
                badgeAccentText.textContent = "3 BHK layout";
                footerTitle.textContent = `3 BHK Floor Plan - ${label}`;
                meta.innerHTML = "<strong>3 BHK</strong> - 1,650 Sq.Ft Carpet";
            }

            if (activePlan === "tower") {
                const towerDetails = {
                    "230 Sq.Yd": {
                        badge: "230 Sq.Yd Stack Plan",
                        badgeAccent: "Stack view",
                        title: "3 BHK Stack Plan - 230 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
                    },
                    "219 Sq.Yd": {
                        badge: "219 Sq.Yd Stack Plan",
                        badgeAccent: "Stack view",
                        title: "3 BHK Stack Plan - 219 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
                    },
                    "205 Sq.Yd": {
                        badge: "205 Sq.Yd Stack Plan",
                        badgeAccent: "Stack view",
                        title: "3 BHK Stack Plan - 205 Sq.Yd",
                        copy: "Stilt+4 low-rise stack reference for the selected 3 BHK variant.",
                        meta: "<strong>3 BHK</strong> - Stilt+4 Floors"
                    }
                };
                const detail = towerDetails[label];

                if (detail) {
                    badgeLabel.textContent = detail.badge;
                    badgeAccentText.textContent = detail.badgeAccent;
                    footerTitle.textContent = detail.title;
                    footerCopy.textContent = detail.copy;
                    meta.innerHTML = detail.meta;
                }
            }
        });
    });

    image.addEventListener("click", openPlanLightbox);
    image.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openPlanLightbox();
        }
    });

    lightboxCloseButtons?.forEach((button) => {
        button.addEventListener("click", closePlanLightbox);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox && !lightbox.hasAttribute("hidden")) {
            closePlanLightbox();
        }
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
    const selectedPriceBox = pricingSection.querySelector(".selected-price-box");
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
            area: "230 Sq.Yds",
            prices: ["1.54 Cr", "1.49 Cr", "1.49 Cr", "1.67 Cr"],
            image: "assets/img/priceing and investment/photo-1600566753190-17f0baa2a6c3.avif"
        },
        219: {
            title: "3 BHK - 219 Sq. Yd",
            badge: "3 BHK - 219 Sq. Yd",
            area: "219 Sq.Yds",
            prices: ["1.47 Cr", "1.42 Cr", "1.42 Cr", "1.60 Cr"],
            image: "assets/img/priceing and investment/photo-1600596542815-ffad4c1539a9.avif"
        },
        205: {
            title: "3 BHK - 205 Sq. Yd",
            badge: "3 BHK - 205 Sq. Yd",
            area: "205 Sq.Yds",
            prices: ["1.37 Cr", "1.325 Cr", "1.325 Cr", "1.505 Cr"],
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
        const isVisiblePrice = isPricingUnlocked || button.classList.contains("is-price-visible");

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        selectedPriceBox?.classList.toggle("is-price-visible", isVisiblePrice);
        pricingFloor.textContent = floorLabel;
        selectedPrice.innerHTML = `<span class="pricing-currency">&#8377;</span>${price}*`;
        selectedMeta.innerHTML = `${floorLabel} &middot; <span>${activeSize} Sq.Yd</span>`;
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
            button.querySelector("strong").innerHTML = `<span class="pricing-currency">&#8377;</span>${content.prices[index]}*`;
            button.classList.toggle("is-price-visible", index === 0 || isPricingUnlocked);
        });

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        floorButtons[0].classList.add("is-active");
        pricingFloor.textContent = "1st Floor";
        selectedMeta.innerHTML = `1st Floor &middot; <span>${activeSize} Sq.Yd</span>`;

        updateSelectedPrice(floorButtons[0]);
    };

    pricingTabs.forEach((tab) => {
        tab.addEventListener("click", () => updatePricingSize(tab.dataset.pricingTab));
    });

    floorButtons.forEach((button) => {
        button.addEventListener("click", () => {
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
    const specsModal = document.getElementById("premium-specs-modal");
    const specsModalImage = specsModal?.querySelector(".premium-specs-modal-image");
    const specsModalTitle = specsModal?.querySelector("#premiumSpecsModalTitle");
    const specsModalCopy = specsModal?.querySelector(".premium-specs-modal-copy");
    const specsModalBrands = specsModal?.querySelector(".premium-specs-modal-brand-box strong");
    const specsModalDetailList = specsModal?.querySelector(".premium-specs-modal-detail-list");
    const specsModalCloseButtons = specsModal?.querySelectorAll("[data-premium-specs-close]");
    let activeSpecSlide = 1;
    let specSliderInterval;
    let specStartX = 0;
    let specEndX = 0;
    let didSpecSwipe = false;
    let specAnimationTimer;
    let brandIndicatorFrame;
    let brandMarqueeFrame;
    let isBrandMarqueePaused = false;
    const specSwipeDistance = 44;
    const specAnimationDuration = 860;
    const specDetails = {
        "classic-kitchen": {
            title: "Classic Kitchen",
            copy: "Bright white cabinetry with a stone countertop, built-in cooking zone, and practical storage planning for daily family use.",
            brands: "Hettich, Jaquar, Hindware, Kajaria",
            details: [
                ["Countertop", "Polished stone/granite working top with easy-clean surface"],
                ["Cabinet Finish", "White modular shutters with soft-close hardware provision"],
                ["Cooking Zone", "Hob/cooktop platform with chimney and exhaust provision"],
                ["Sink & Utility", "Stainless steel sink with RO, dishwasher and washing machine point provision"]
            ]
        },
        "modern-kitchen": {
            title: "Modern Modular Kitchen",
            copy: "Sleek matte shutters, marble-look backsplash, under-cabinet lighting, and a clean island-style counter for a premium kitchen feel.",
            brands: "Hettich, Hafele, Kajaria, Jaquar",
            details: [
                ["Backsplash", "Marble-look dado/backsplash with concealed task lighting"],
                ["Shutters", "Matte-finish modular shutters with soft-close channels"],
                ["Counter & Island", "Premium stone countertop with spacious preparation surface"],
                ["Appliance Points", "Provision for chimney, hob, microwave, RO and refrigerator"]
            ]
        },
        bathroom: {
            title: "Luxury Bathroom",
            copy: "Designer bathroom with bathtub zone, feature wall tiles, vanity counter, premium sanitaryware, and branded CP fittings.",
            brands: "Jaquar, Hindware, Kajaria",
            details: [
                ["Sanitaryware", "Wall-hung WC, bathtub and premium wash basin provision"],
                ["Vanity Counter", "Stone/wood-finish vanity slab with under-counter storage"],
                ["Wall & Floor Tiles", "Designer wall tiles with anti-skid bathroom floor tiles"],
                ["CP Fittings", "Branded mixer, shower, health faucet and towel rail provision"]
            ]
        },
        bedroom: {
            title: "Premium Bedroom",
            copy: "A calm, well-lit bedroom with large window opening, soft wall finish, warm wooden flooring, and planned electrical points.",
            brands: "Asian Paints, Havells, Legrand",
            details: [
                ["Flooring", "Wooden-finish flooring for a warmer bedroom look"],
                ["Wall Finish", "Smooth putty finish with premium emulsion paint"],
                ["Window & Light", "Large window opening with curtain track provision"],
                ["Electrical Points", "AC point, TV point, bedside sockets and modular switch plates"]
            ]
        }
    };

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

        const visibleBrandItems = brandTrack.querySelectorAll(".premium-specs-brand");

        visibleBrandItems.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(itemCenter - trackCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                activeBrandIndex = index % brandItems.length;
            }
        });

        setActiveBrand(activeBrandIndex);
    };

    const requestBrandIndicatorUpdate = () => {
        cancelAnimationFrame(brandIndicatorFrame);
        brandIndicatorFrame = requestAnimationFrame(updateBrandIndicator);
    };

    const setupBrandMarquee = () => {
        if (!brandTrack || !brandItems.length) {
            return;
        }

        brandTrack.classList.add("is-marquee");
        brandItems.forEach((item) => {
            const clone = item.cloneNode(true);
            clone.setAttribute("aria-hidden", "true");
            clone.classList.remove("is-active");
            brandTrack.appendChild(clone);
        });
    };

    const startBrandMarquee = () => {
        if (!brandTrack || !brandItems.length) {
            return;
        }

        const step = () => {
            if (!isBrandMarqueePaused) {
                brandTrack.scrollLeft += 0.9;

                if (brandTrack.scrollLeft >= brandTrack.scrollWidth / 2) {
                    brandTrack.scrollLeft = 0;
                }

                requestBrandIndicatorUpdate();
            }

            brandMarqueeFrame = requestAnimationFrame(step);
        };

        cancelAnimationFrame(brandMarqueeFrame);
        brandMarqueeFrame = requestAnimationFrame(step);
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
        clearInterval(specSliderInterval);
    };

    const resetSpecSlider = () => {
        clearInterval(specSliderInterval);
    };

    const openSpecsModal = (slide) => {
        if (!specsModal || !specsModalImage || !specsModalTitle || !specsModalCopy || !specsModalBrands || !specsModalDetailList) {
            return;
        }

        const image = slide.querySelector("img");
        const detail = specDetails[slide.dataset.specKey] || specDetails["modern-kitchen"];

        specsModalImage.src = image.currentSrc || image.src;
        specsModalImage.alt = image.alt;
        specsModalTitle.textContent = detail.title;
        specsModalCopy.textContent = detail.copy;
        specsModalBrands.textContent = detail.brands;
        specsModalDetailList.innerHTML = detail.details.map(([label, value]) => (
            `<div class="premium-specs-modal-detail"><strong>${label}</strong><span>${value}</span></div>`
        )).join("");
        specsModal.hidden = false;
        document.body.classList.add("is-premium-specs-modal-open");
    };

    const closeSpecsModal = () => {
        if (!specsModal) {
            return;
        }

        specsModal.hidden = true;
        document.body.classList.remove("is-premium-specs-modal-open");
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

            if (index !== activeSpecSlide) {
                setSpecSlide(index);
                resetSpecSlider();
                return;
            }

            setSpecSlide(index);
            resetSpecSlider();
            openSpecsModal(slide);
        });
    });

    specsModalCloseButtons?.forEach((button) => {
        button.addEventListener("click", closeSpecsModal);
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
        setupBrandMarquee();

        brandDots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                isBrandMarqueePaused = true;
                brandItems[index].scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
                setActiveBrand(index);

                setTimeout(() => {
                    isBrandMarqueePaused = false;
                }, 1400);
            });
        });

        brandTrack.addEventListener("scroll", requestBrandIndicatorUpdate, { passive: true });
        window.addEventListener("resize", requestBrandIndicatorUpdate);
        document.addEventListener("visibilitychange", () => {
            isBrandMarqueePaused = document.hidden;
        });
        updateBrandIndicator();
        startBrandMarquee();
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && specsModal && !specsModal.hidden) {
            closeSpecsModal();
        }
    });

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
    const galleryCards = visualShowcaseSection.querySelectorAll(".visual-gallery-card, .visual-walkthrough-card");
    const visualDetailModal = document.getElementById("visual-detail-modal");
    const visualDetailImage = visualDetailModal?.querySelector(".visual-detail-modal-image");
    const visualDetailTitle = visualDetailModal?.querySelector("#visualDetailTitle");
    const visualDetailCopy = visualDetailModal?.querySelector(".visual-detail-modal-copy");
    const visualDetailCategory = visualDetailModal?.querySelector("[data-visual-detail-category]");
    const visualDetailList = visualDetailModal?.querySelector(".visual-detail-modal-detail-list");
    const visualDetailCloseButtons = visualDetailModal?.querySelectorAll("[data-visual-detail-close]");
    const galleryGridState = new Map();
    let activeGalleryTab = "sample";
    let gallerySwitchTimer;
    const isMobileGallery = () => window.matchMedia("(max-width: 767px)").matches;

    const galleryPanelLabels = {
        sample: "Sample Flat",
        walkthrough: "Walkthrough",
        exterior: "Exterior",
        construction: "Construction"
    };

    const galleryDetailByFile = {
        "0be2e6c5e9842f9e20d65c054d0f4df90ec098c0.jpg": {
            title: "Modular Island Kitchen",
            description: "Warm cabinetry, island counter and built-in appliances for a ready-to-use premium kitchen.",
            focus: "Kitchen planning, storage wall, island counter and appliance placement",
            finish: "Wood-look cabinetry, light countertop, pendant lighting and premium fittings"
        },
        "71f1fe9bf7b83056f21dcc38fe0297862834698b.png": {
            title: "Sunlit Living Lounge",
            description: "A bright living and dining zone planned for natural light, family seating and everyday comfort.",
            focus: "Living room volume, window light, lounge seating and dining connection",
            finish: "Soft neutral palette, curtains, pendant lights and warm decor accents"
        },
        "bdec928ef1c3f2fad9db07ae04140d3f77543c80.jpg": {
            title: "Luxury Bathroom Suite",
            description: "Premium bathroom finish with vanity counter, wall cladding and modern sanitary fittings.",
            focus: "Vanity counter, shower/bath zone, wall tiles and sanitaryware positioning",
            finish: "Dark feature wall, stone-look surfaces, mirror lighting and branded fittings"
        },
        "9d36bc9e1115936b757064117ba22e4770259b28.png": {
            title: "Family Living Area",
            description: "Open lounge planning with natural light, calm finishes and practical furniture placement.",
            focus: "Daily-use living layout, sofa placement, table zone and window-side seating",
            finish: "Warm neutral finishes, soft furnishings and elegant ceiling lighting"
        },
        "f4b90b41d2921d5f3eb4fe1272f937640e7f3dfe.png": {
            title: "Premium Lounge Interior",
            description: "A refined lounge view showing material depth, curated lighting and comfortable proportions.",
            focus: "Interior mood, lounge depth, lighting and material continuity",
            finish: "Premium textures, warm lights, feature furniture and polished surfaces"
        },
        "ffbfb80a4618358645f60806327606317538f142.jpg": {
            title: "Classic Kitchen Finish",
            description: "A practical kitchen detail focused on countertop workspace, storage and everyday utility.",
            focus: "Countertop work area, cabinetry, sink position and compact kitchen workflow",
            finish: "Classic cabinets, durable counter surface and clean appliance provisions"
        },
        "walktrough.jpg": {
            title: "Project Walkthrough Preview",
            description: "A full visual preview to understand elevation, approach, scale and overall project experience.",
            focus: "Project frontage, massing, entry experience and visual walkthrough context",
            finish: "Exterior lighting, facade rhythm, landscape edges and low-rise presentation"
        }
    };

    const escapeHtml = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
    })[character]);

    const getGalleryFileName = (img) => (img?.getAttribute("src") || "").split("/").pop() || "";

    const getVisualGalleryDetail = (card) => {
        const img = card.querySelector("img");
        const panelKey = card.closest("[data-gallery-panel]")?.dataset.galleryPanel || activeGalleryTab;
        const category = galleryPanelLabels[panelKey] || "Project Gallery";
        const fileName = getGalleryFileName(img);
        const base = galleryDetailByFile[fileName] || {
            title: img?.alt || "Project Gallery View",
            description: "A closer look at the project finish, scale and presentation.",
            focus: "Project visual reference and finish quality",
            finish: "Premium real-estate presentation details"
        };
        const title = panelKey === "construction"
            ? base.title.replace("Preview", "Progress View")
            : panelKey === "exterior" && fileName === "walktrough.jpg"
                ? "Exterior Elevation Preview"
                : base.title;
        const description = panelKey === "construction"
            ? `Construction update reference showing ${base.title.toLowerCase()} quality and site progress context.`
            : panelKey === "exterior"
                ? `Exterior-focused view highlighting ${base.focus.toLowerCase()}.`
                : base.description;

        return {
            title,
            description,
            category,
            imageSrc: img?.currentSrc || img?.src || "",
            imageAlt: img?.alt || title,
            details: [
                ["Visual Focus", base.focus],
                ["Finish Notes", base.finish],
                ["Category Context", panelKey === "walkthrough"
                    ? "Designed for a full-screen project preview before scheduling a site visit"
                    : `Part of the ${category.toLowerCase()} gallery set for Amelia Estate II`],
                ["Best Next Step", "Open the full image, then schedule a site visit to verify scale and finish in person"]
            ]
        };
    };

    const addVisualGalleryOverlay = (card) => {
        const detail = getVisualGalleryDetail(card);
        let overlay = card.querySelector(".visual-gallery-info");

        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "visual-gallery-info";
            card.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="visual-gallery-info-copy">
                <strong>${escapeHtml(detail.title)}</strong>
                <span>${escapeHtml(detail.description)}</span>
            </div>
            <span class="visual-gallery-view-full" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="M15 3h6v6" />
                    <path d="m14 10 7-7" />
                    <path d="M9 21H3v-6" />
                    <path d="m10 14-7 7" />
                </svg>
            </span>
        `;

        card.setAttribute("aria-label", `View full details for ${detail.title}`);

        if (card.tagName !== "BUTTON") {
            card.setAttribute("role", "button");
            card.setAttribute("tabindex", "0");
        }
    };

    const openVisualDetail = (card) => {
        if (!visualDetailModal || !visualDetailImage || !visualDetailTitle || !visualDetailCopy || !visualDetailCategory || !visualDetailList) {
            return;
        }

        const detail = getVisualGalleryDetail(card);
        visualDetailImage.src = detail.imageSrc;
        visualDetailImage.alt = detail.imageAlt;
        visualDetailTitle.textContent = detail.title;
        visualDetailCopy.textContent = detail.description;
        visualDetailCategory.textContent = detail.category;
        visualDetailList.innerHTML = detail.details.map(([label, value]) => (
            `<div class="visual-detail-modal-detail"><strong>${escapeHtml(label)}</strong><span>${escapeHtml(value)}</span></div>`
        )).join("");
        visualDetailModal.hidden = false;
        document.body.classList.add("is-visual-detail-modal-open");
    };

    const closeVisualDetail = () => {
        if (!visualDetailModal) {
            return;
        }

        visualDetailModal.hidden = true;
        document.body.classList.remove("is-visual-detail-modal-open");
    };

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

    galleryCards.forEach((card) => {
        addVisualGalleryOverlay(card);

        card.addEventListener("click", () => openVisualDetail(card));

        if (card.tagName !== "BUTTON") {
            card.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                openVisualDetail(card);
            });
        }
    });

    visualDetailCloseButtons?.forEach((button) => {
        button.addEventListener("click", closeVisualDetail);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && visualDetailModal && !visualDetailModal.hidden) {
            closeVisualDetail();
        }
    });

    window.addEventListener("resize", updateActiveGalleryGrid);
    updateActiveGalleryGrid();
}

// Prime location: switches the map card between the designed image and embedded Google Map.
const primeLocationSection = document.querySelector(".prime-location-section");

if (primeLocationSection) {
    const primeMap = primeLocationSection.querySelector(".prime-location-map");
    const primeMapImagePanel = primeLocationSection.querySelector('[data-prime-map-panel="image"]');
    const primeMapImage = primeLocationSection.querySelector(".prime-location-map-img");
    const mapTabs = primeLocationSection.querySelectorAll("[data-prime-map-tab]");
    const mapPanels = primeLocationSection.querySelectorAll("[data-prime-map-panel]");
    const mapOpenButtons = primeLocationSection.querySelectorAll("[data-prime-map-open]");
    const primeMapFullscreenButtons = primeLocationSection.querySelectorAll("[data-prime-map-fullscreen]");
    const primeMapLightbox = document.getElementById("prime-map-lightbox");
    const primeMapLightboxImage = primeMapLightbox?.querySelector(".prime-map-lightbox-image");
    const primeMapLightboxCloseButtons = primeMapLightbox?.querySelectorAll("[data-prime-map-close]");
    const distanceGrid = primeLocationSection.querySelector(".prime-distance-grid");
    const distanceCards = distanceGrid ? Array.from(distanceGrid.querySelectorAll(".prime-distance-card")) : [];
    const distanceProgress = primeLocationSection.querySelector(".prime-distance-progress span");
    const distanceBlock = distanceGrid ? distanceGrid.closest(".prime-distance-block") : null;
    const mapLocationCta = primeLocationSection.querySelector(".prime-whatsapp-location-cta--map");
    let distanceFrame = 0;
    let locationCtaFrame = 0;
    let isDistanceRevealed = false;
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

    const openPrimeMapLightbox = () => {
        if (!primeMapLightbox || !primeMapLightboxImage || !primeMapImage) {
            return;
        }

        primeMapLightboxImage.src = primeMapImage.currentSrc || primeMapImage.src;
        primeMapLightboxImage.alt = primeMapImage.alt;
        primeMapLightbox.hidden = false;
        document.body.classList.add("is-prime-map-lightbox-open");
    };

    const closePrimeMapLightbox = () => {
        if (!primeMapLightbox) {
            return;
        }

        primeMapLightbox.hidden = true;
        document.body.classList.remove("is-prime-map-lightbox-open");
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

    if (primeMapImagePanel) {
        primeMapImagePanel.setAttribute("role", "button");
        primeMapImagePanel.setAttribute("tabindex", "0");
        primeMapImagePanel.setAttribute("aria-label", "Open location map full screen");
        primeMapImagePanel.addEventListener("click", openPrimeMapLightbox);
        primeMapImagePanel.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            openPrimeMapLightbox();
        });
    }

    primeMapFullscreenButtons.forEach((button) => {
        button.addEventListener("click", openPrimeMapLightbox);
    });

    primeMapLightboxCloseButtons?.forEach((button) => {
        button.addEventListener("click", closePrimeMapLightbox);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && primeMapLightbox && !primeMapLightbox.hidden) {
            closePrimeMapLightbox();
        }
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
        if (!distanceBlock || !distanceGrid || !mapLocationCta) {
            isDistanceRevealed = false;
            isLocationCtaShifted = false;
            primeLocationSection.classList.remove("is-distance-revealed");
            primeLocationSection.classList.remove("is-distance-cta-shifted");
            return;
        }

        const viewportHeight = window.innerHeight;
        const ctaRect = mapLocationCta.getBoundingClientRect();
        const revealLine = isMobileDistanceSlider() ? 0.72 : 0.70;
        const shouldShiftCta = isDistanceRevealed || ctaRect.bottom <= viewportHeight * revealLine;

        if (shouldShiftCta === isLocationCtaShifted) {
            return;
        }

        isDistanceRevealed = shouldShiftCta;
        isLocationCtaShifted = shouldShiftCta;
        primeLocationSection.classList.toggle("is-distance-revealed", isDistanceRevealed);
        primeLocationSection.classList.toggle("is-distance-cta-shifted", isLocationCtaShifted);

        if (isDistanceRevealed) {
            requestDistanceSliderUpdate();
        }
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
    const defaultPreviewButton = projectEssentialsSection.querySelector(".project-essentials-btn.is-active") || previewButtons[0];
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
        previewButtons.forEach((btn) => {
            btn.classList.toggle("is-active", btn === defaultPreviewButton);
        });
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

// Property Snapshot Modal: handle opening and closing modal
const propertyDetailsModal = document.getElementById("property-details-modal");
const propertyDetailsOpenButton = document.querySelector('[data-open-modal="property-details"]');
const propertyDetailsCloseButton = propertyDetailsModal?.querySelector(".property-snapshot-modal-close");
const propertyDetailsBackdrop = propertyDetailsModal?.querySelector(".property-snapshot-modal-backdrop");

if (propertyDetailsModal && propertyDetailsOpenButton) {
    const openPropertyDetailsModal = () => {
        propertyDetailsModal.removeAttribute("hidden");
        document.body.style.overflow = "hidden";
    };

    const closePropertyDetailsModal = () => {
        propertyDetailsModal.setAttribute("hidden", "");
        document.body.style.overflow = "";
    };

    propertyDetailsOpenButton.addEventListener("click", (e) => {
        e.preventDefault();
        openPropertyDetailsModal();
    });

    if (propertyDetailsCloseButton) {
        propertyDetailsCloseButton.addEventListener("click", closePropertyDetailsModal);
    }

    if (propertyDetailsBackdrop) {
        propertyDetailsBackdrop.addEventListener("click", closePropertyDetailsModal);
    }

    // Close modal on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !propertyDetailsModal.hasAttribute("hidden")) {
            closePropertyDetailsModal();
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
    const amenityLightbox = document.getElementById("amenity-image-lightbox");
    const amenityLightboxImage = amenityLightbox?.querySelector(".amenity-image-lightbox-image");
    const amenityLightboxTitle = amenityLightbox?.querySelector(".amenity-image-lightbox-title");
    const amenityLightboxCloseButtons = amenityLightbox?.querySelectorAll("[data-amenity-lightbox-close]");
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

    const openAmenityLightbox = (card) => {
        if (!amenityLightbox || !amenityLightboxImage || !amenityLightboxTitle) {
            return;
        }

        const image = card.querySelector("img");
        const caption = card.querySelector(".lifestyle-amenity-caption span");

        if (!image) {
            return;
        }

        const title = caption?.textContent.trim() || image.alt || "Amenity Preview";

        amenityLightboxImage.src = image.currentSrc || image.src;
        amenityLightboxImage.alt = image.alt || title;
        amenityLightboxTitle.textContent = title;
        amenityLightbox.hidden = false;
        document.body.classList.add("is-amenity-lightbox-open");
    };

    const closeAmenityLightbox = () => {
        if (!amenityLightbox) {
            return;
        }

        amenityLightbox.hidden = true;
        document.body.classList.remove("is-amenity-lightbox-open");
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

    amenityCards.forEach((card) => {
        const label = card.querySelector(".lifestyle-amenity-caption span")?.textContent.trim() || "amenity image";

        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `Open ${label} image preview`);
        card.addEventListener("click", () => openAmenityLightbox(card));
        card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
                return;
            }

            event.preventDefault();
            openAmenityLightbox(card);
        });
    });

    amenityLightboxCloseButtons?.forEach((button) => {
        button.addEventListener("click", closeAmenityLightbox);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && amenityLightbox && !amenityLightbox.hidden) {
            closeAmenityLightbox();
        }
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
    const faqAnimationDuration = 380;
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

    const stopFaqAnimation = (answer) => {
        if (answer._faqTimer) {
            clearTimeout(answer._faqTimer);
            answer._faqTimer = null;
        }
    };

    const animateFaqAnswer = (answer, shouldOpen) => {
        stopFaqAnimation(answer);

        answer.hidden = false;
        answer.style.overflow = "hidden";

        if (shouldOpen) {
            answer.style.maxHeight = "0px";
            answer.offsetHeight;
            answer.style.maxHeight = `${answer.scrollHeight}px`;

            answer._faqTimer = window.setTimeout(() => {
                answer.style.maxHeight = "none";
                answer._faqTimer = null;
            }, faqAnimationDuration);
            return;
        }

        const currentHeight = answer.scrollHeight;
        answer.style.maxHeight = `${currentHeight}px`;
        answer.offsetHeight;
        answer.style.maxHeight = "0px";

        answer._faqTimer = window.setTimeout(() => {
            answer.hidden = true;
            answer.style.maxHeight = "";
            answer._faqTimer = null;
        }, faqAnimationDuration);
    };

    const setFaqItem = (item, shouldOpen, options = {}) => {
        const button = item.querySelector("[data-faq-toggle]");
        const answer = item.querySelector(".faq-answer");
        const { immediate = false } = options;

        item.classList.toggle("is-open", shouldOpen);
        button.setAttribute("aria-expanded", String(shouldOpen));

        if (immediate) {
            stopFaqAnimation(answer);
            answer.hidden = !shouldOpen;
            answer.style.maxHeight = shouldOpen ? "none" : "0px";
            return;
        }

        animateFaqAnswer(answer, shouldOpen);
    };

    faqPanels.forEach((panel) => {
        panel.querySelectorAll(".faq-item").forEach((item) => {
            setFaqItem(item, item.classList.contains("is-open"), { immediate: true });
        });
    });

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
