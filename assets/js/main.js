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
    const storyStepDelay = 1100;
    const wheelStepThreshold = 260;
    const touchStepThreshold = 76;
    const wheelUnlockDelay = 720;
    const stickyTop = 86;
    const storyFocusOffset = stickyTop + 2;

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
        return rect.top <= storyFocusOffset && rect.bottom > storyFocusOffset + 80;
    };

    const isStoryEnteringDown = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        return rect.top > storyFocusOffset && rect.top < window.innerHeight;
    };

    const isStoryEnteringUp = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        return rect.top < storyFocusOffset && rect.bottom > storyFocusOffset;
    };

    const isStoryInTrapRange = () => {
        const rect = scrollStorySection.getBoundingClientRect();
        return rect.top < window.innerHeight && rect.bottom > storyFocusOffset;
    };

    const pinStoryToTop = (behavior = "auto") => {
        isPinningStory = true;
        window.scrollTo({
            top: Math.max(scrollStorySection.offsetTop - stickyTop, 0),
            behavior
        });
        requestAnimationFrame(() => {
            isPinningStory = false;
            lastPageScrollY = window.scrollY;
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
        if (direction > 0 && isStoryEnteringDown()) {
            event.preventDefault();
            pinStoryToTop();
            return;
        }

        if (direction < 0 && isStoryEnteringUp() && !isStoryInFocus()) {
            event.preventDefault();
            setStorySlide(storySlides.length - 1);
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
            return;
        }

        pinStoryToTop();
        setStorySlide(nextIndex);
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

            clearTimeout(wheelUnlockTimer);
            wheelUnlockTimer = setTimeout(() => {
                isWheelGestureLocked = false;
            }, wheelUnlockDelay);

            return;
        }

        if (direction < 0 && isStoryEnteringUp() && !isStoryInFocus()) {
            wheelDeltaTotal = 0;
            isWheelGestureLocked = true;
            handleStoryStep(direction, event);

            clearTimeout(wheelUnlockTimer);
            wheelUnlockTimer = setTimeout(() => {
                isWheelGestureLocked = false;
            }, wheelUnlockDelay);

            return;
        }

        if (!isStoryInFocus() && !isStoryInTrapRange()) {
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
            setStorySlide(storySlides.length - 1);
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
        const currentScrollY = window.scrollY;
        const isScrollingDown = currentScrollY > lastPageScrollY + 1;
        const isScrollingUp = currentScrollY < lastPageScrollY - 1;
        const hasUnseenSlides = activeStorySlide < storySlides.length - 1;
        const hasPreviousSlides = activeStorySlide > 0;
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
}

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

    let activeSize = "230";
    let activeFloor = "1st";

    const sizeDetails = {
        230: {
            label: "230 Sq.Yd",
            area: "230 Sq.Yds"
        },
        219: {
            label: "219 Sq.Yd",
            area: "219 Sq.Yds"
        },
        205: {
            label: "205 Sq.Yd",
            area: "205 Sq.Yds"
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

// Transparent pricing: size tabs, floor selection, and reveal state.
const pricingSection = document.querySelector(".transparent-pricing-section");

if (pricingSection) {
    const pricingTabs = pricingSection.querySelectorAll("[data-pricing-tab]");
    const pricingCard = pricingSection.querySelector(".pricing-card");
    const floorButtons = pricingSection.querySelectorAll("[data-floor-price]");
    const pricingTitle = pricingSection.querySelector(".pricing-title-block h3");
    const pricingFloor = pricingSection.querySelector(".pricing-title-block p");
    const imageBadge = pricingSection.querySelector(".pricing-image-badge");
    const selectedPrice = pricingSection.querySelector(".selected-price-box strong");
    const selectedMeta = pricingSection.querySelector(".selected-price-box p");
    const unlockButton = pricingSection.querySelector(".pricing-unlock-btn");

    const pricingContent = {
        230: {
            title: "3 BHK - 230 Sq. Yd",
            badge: "3 BHK - 230 Sq. Yd",
            area: "2,190 Sq.Ft",
            prices: ["2.85 Cr", "2.95 Cr", "3.05 Cr", "3.25 Cr"]
        },
        219: {
            title: "3 BHK - 219 Sq. Yd",
            badge: "3 BHK - 219 Sq. Yd",
            area: "2,080 Sq.Ft",
            prices: ["2.72 Cr", "2.82 Cr", "2.92 Cr", "3.12 Cr"]
        },
        205: {
            title: "3 BHK - 205 Sq. Yd",
            badge: "3 BHK - 205 Sq. Yd",
            area: "1,950 Sq.Ft",
            prices: ["2.58 Cr", "2.68 Cr", "2.78 Cr", "2.98 Cr"]
        }
    };

    let activeSize = "230";
    let isPricingUnlocked = false;
    const lockedIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 10 0v3" /><path d="M6 11h12v10H6V11Z" /></svg>`;
    const unlockedIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-2.2" /><path d="M6 11h12v10H6V11Z" /></svg>`;

    const updateSelectedPrice = (button) => {
        const floorLabel = button.querySelector("span").textContent;
        const price = button.dataset.floorPrice;

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        pricingFloor.textContent = floorLabel;
        selectedPrice.innerHTML = `<span class="pricing-currency">&#8377;</span>${price}*`;
        selectedMeta.innerHTML = `${floorLabel} · <span>${activeSize} Sq.Yd</span>`;
    };

    const updatePricingSize = (size) => {
        const content = pricingContent[size];

        if (!content) {
            return;
        }

        activeSize = size;
        pricingTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.pricingTab === size);
        });

        pricingTitle.textContent = content.title;
        imageBadge.textContent = content.badge;
        pricingSection.querySelector(".pricing-spec strong").textContent = content.area;

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
        isPricingUnlocked = !isPricingUnlocked;
        pricingSection.classList.toggle("is-pricing-unlocked", isPricingUnlocked);
        pricingCard.classList.toggle("is-unlocked", isPricingUnlocked);

        if (isPricingUnlocked) {
            updateSelectedPrice(pricingSection.querySelector(".floor-price-grid button.is-active"));
            unlockButton.innerHTML = `${unlockedIcon}All Price Unlock`;
            return;
        }

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        floorButtons[0].classList.add("is-active");
        updateSelectedPrice(floorButtons[0]);
        unlockButton.innerHTML = `${lockedIcon}Unlock Floor-wise Pricing`;
    });
}

// Premium specifications: rotates the quality proof gallery and keeps dots in sync.
const premiumSpecsSection = document.querySelector(".premium-specs-section");

if (premiumSpecsSection) {
    const specTrack = premiumSpecsSection.querySelector(".premium-specs-track");
    const specSlides = premiumSpecsSection.querySelectorAll(".premium-specs-slide");
    const specDots = premiumSpecsSection.querySelectorAll(".premium-specs-dots button");
    let activeSpecSlide = 1;
    let specSliderInterval;
    let specStartX = 0;
    let specEndX = 0;
    let didSpecSwipe = false;
    const specSwipeDistance = 44;

    const setSpecSlide = (index) => {
        activeSpecSlide = (index + specSlides.length) % specSlides.length;
        const previousIndex = (activeSpecSlide - 1 + specSlides.length) % specSlides.length;
        const nextIndex = (activeSpecSlide + 1) % specSlides.length;

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
            setSpecSlide(activeSpecSlide + 1);
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
        setSpecSlide(distance > 0 ? activeSpecSlide + 1 : activeSpecSlide - 1);
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
                setSpecSlide(activeSpecSlide + 1);
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
    let activeGalleryTab = "sample";
    let gallerySwitchTimer;

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
            });
        }, 320);
    };

    galleryTabs.forEach((tab) => {
        tab.addEventListener("click", () => setGalleryTab(tab.dataset.galleryTab));
    });
}

// Prime location: switches the map card between the designed image and embedded Google Map.
const primeLocationSection = document.querySelector(".prime-location-section");

if (primeLocationSection) {
    const primeMap = primeLocationSection.querySelector(".prime-location-map");
    const mapTabs = primeLocationSection.querySelectorAll("[data-prime-map-tab]");
    const mapPanels = primeLocationSection.querySelectorAll("[data-prime-map-panel]");
    const mapOpenButtons = primeLocationSection.querySelectorAll("[data-prime-map-open]");

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
