// Shared lead unlock state for the current page view only.
(() => {
    let hasMobileViewportHeight = false;
    let mobileViewportFrame = 0;
    let lastMobileViewportHeight = 0;

    const setMobileViewportHeight = () => {
        if (!window.matchMedia("(max-width: 767px)").matches) {
            if (hasMobileViewportHeight) {
                document.documentElement.style.removeProperty("--amelia-mobile-viewport-height");
                document.body?.style.removeProperty("--amelia-mobile-viewport-height");
                hasMobileViewportHeight = false;
            }

            return;
        }

        const viewportHeight = window.visualViewport?.height || window.innerHeight;

        if (Math.abs(viewportHeight - lastMobileViewportHeight) < 1) {
            return;
        }

        document.documentElement.style.setProperty("--amelia-mobile-viewport-height", `${viewportHeight}px`);
        document.body?.style.setProperty("--amelia-mobile-viewport-height", `${viewportHeight}px`);
        lastMobileViewportHeight = viewportHeight;
        hasMobileViewportHeight = true;
    };

    const requestMobileViewportHeight = () => {
        window.cancelAnimationFrame(mobileViewportFrame);
        mobileViewportFrame = window.requestAnimationFrame(setMobileViewportHeight);
    };

    const primeMobileViewportHeight = () => {
        if ("requestIdleCallback" in window) {
            window.requestIdleCallback(requestMobileViewportHeight, { timeout: 1400 });
        } else {
            window.setTimeout(requestMobileViewportHeight, 300);
        }
    };

    if (document.readyState === "complete") {
        primeMobileViewportHeight();
    } else {
        window.addEventListener("load", primeMobileViewportHeight, { once: true });
    }

    window.addEventListener("resize", requestMobileViewportHeight);
    window.addEventListener("orientationchange", requestMobileViewportHeight);
    window.visualViewport?.addEventListener("resize", requestMobileViewportHeight);
    window.visualViewport?.addEventListener("scroll", requestMobileViewportHeight);
})();

(() => {
    try {
        window.localStorage.removeItem("amelia-estate-lead-unlocked");
    } catch (error) {
        // Local storage may be blocked; the page-view class still controls the state.
    }

    const readUnlocked = () => {
        return document.body.classList.contains("is-lead-unlocked");
    };

    const setUnlocked = () => {
        if (readUnlocked()) {
            document.body.classList.add("is-lead-unlocked");
            return;
        }

        document.body.classList.add("is-lead-unlocked");
        window.dispatchEvent(new CustomEvent("amelia:lead-unlocked"));
    };

    window.AmeliaLeadUnlock = {
        isUnlocked: readUnlocked,
        unlock: setUnlocked
    };
})();

// This static page hands validated enquiries directly to the sales WhatsApp inbox.
window.AmeliaLeadSubmission = {
    send(form, intent = "Project enquiry", { delay = 0 } = {}) {
        if (!form || !form.checkValidity()) {
            form?.reportValidity();
            return false;
        }

        const details = new FormData(form);
        const name = String(details.get("name") || details.get("full-name") || "").trim();
        const phone = String(details.get("phone") || details.get("mobile-number") || "").trim();
        const email = String(details.get("email") || "").trim();
        const configuration = String(details.get("configuration") || "").trim();
        const message = [
            `Hello, I would like assistance with Amelia Estate II (${intent}).`,
            `Name: ${name}`,
            `Phone: +91 ${phone}`,
            email ? `Email: ${email}` : "",
            configuration ? `Preference: ${configuration}` : ""
        ].filter(Boolean).join("\n");
        const url = `https://wa.me/917009247378?text=${encodeURIComponent(message)}`;
        const openLeadChannel = () => {
            const leadWindow = window.open(url, "_blank");

            if (leadWindow) {
                leadWindow.opener = null;
            } else {
                window.location.href = url;
            }
        };

        if (delay > 0) {
            window.setTimeout(openLeadChannel, delay);
        } else {
            openLeadChannel();
        }

        return true;
    }
};

const loadDeferredImages = (container) => {
    container?.querySelectorAll("img[data-deferred-src]").forEach((image) => {
        image.src = image.dataset.deferredSrc;
        image.removeAttribute("data-deferred-src");
    });
};

let materialSymbolsLoaded = false;
const loadDeferredMaterialSymbols = () => {
    if (materialSymbolsLoaded) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,500,0,0&display=swap";
    document.head.appendChild(link);
    materialSymbolsLoaded = true;
};

let fontAwesomeLoaded = false;
const loadDeferredFontAwesome = () => {
    if (fontAwesomeLoaded) {
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css";
    document.head.appendChild(link);
    fontAwesomeLoaded = true;
};

["pointerdown", "keydown"].forEach((eventName) => {
    window.addEventListener(eventName, loadDeferredFontAwesome, {
        once: true,
        passive: eventName !== "keydown"
    });
});

let deferredDesktopStylesLoaded = false;
const loadDeferredDesktopStyles = () => {
    if (deferredDesktopStylesLoaded || !window.matchMedia("(min-width: 1200px)").matches) {
        return;
    }

    if (document.querySelector('link[href*="assets/css/style.min.css"]')) {
        deferredDesktopStylesLoaded = true;
        return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "assets/css/style.min.css?v=desktop-css-1";
    link.dataset.desktopFullStyles = "true";
    document.head.appendChild(link);
    deferredDesktopStylesLoaded = true;
};

if (window.matchMedia("(min-width: 1200px)").matches) {
    ["pointerdown", "wheel", "keydown", "touchstart"].forEach((eventName) => {
        window.addEventListener(eventName, loadDeferredDesktopStyles, {
            once: true,
            passive: eventName !== "keydown"
        });
    });
    window.addEventListener("scroll", loadDeferredDesktopStyles, { once: true, passive: true });

    document.querySelectorAll(".site-header a, .hero-actions a, [data-mega-menu-open]")
        .forEach((control) => {
            control.addEventListener("mouseenter", loadDeferredDesktopStyles, { once: true, passive: true });
            control.addEventListener("focusin", loadDeferredDesktopStyles, { once: true });
        });
}

// Standalone Amelia full mega menu. Future trigger buttons can call window.openAmeliaMegaMenu().
(() => {
    const megaMenu = document.getElementById("fullMenuMega");
    const megaMenuTriggers = document.querySelectorAll("[data-mega-menu-open]");
    const preview = megaMenu?.querySelector(".full-menu-preview");
    const previewImage = preview?.querySelector("img");
    const previewLabel = preview?.querySelector("span");
    const previewTitle = preview?.querySelector("strong");
    const previewSubtitle = preview?.querySelector("small");
    const previewAction = preview?.querySelector("a");
    let previewTimer;

    if (!megaMenu) {
        return;
    }

    const setMegaMenuOpen = (shouldOpen) => {
        if (shouldOpen) {
            loadDeferredImages(megaMenu);
            loadDeferredMaterialSymbols();
            loadDeferredFontAwesome();
        }

        megaMenu.classList.toggle("is-open", shouldOpen);
        megaMenu.setAttribute("aria-hidden", String(!shouldOpen));
        document.body.classList.toggle("mega-open", shouldOpen);
        megaMenuTriggers.forEach((trigger) => {
            trigger.setAttribute("aria-expanded", String(shouldOpen));
        });
    };

    window.openAmeliaMegaMenu = () => setMegaMenuOpen(true);
    window.closeAmeliaMegaMenu = () => setMegaMenuOpen(false);

    if (megaMenu.classList.contains("is-open")) {
        setMegaMenuOpen(true);
    }

    megaMenuTriggers.forEach((trigger) => {
        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            setMegaMenuOpen(true);
        });
    });

    megaMenu.querySelectorAll(".full-menu-link[data-menu-image], .full-menu-column[data-menu-image]").forEach((trigger) => {
        trigger.addEventListener("mouseenter", () => {
            if (!preview || !previewImage) {
                return;
            }

            const nextImage = trigger.dataset.menuImage;
            const nextLabel = trigger.dataset.menuIndex;
            const nextTitle = trigger.dataset.menuTitle;
            const nextSubtitle = trigger.dataset.menuSubtitle;
            const nextHref = trigger.getAttribute("href");

            window.clearTimeout(previewTimer);
            preview.classList.add("is-switching");

            previewTimer = window.setTimeout(() => {
                if (nextImage && previewImage.getAttribute("src") !== nextImage) {
                    previewImage.setAttribute("src", nextImage);
                }

                if (nextTitle && previewTitle) {
                    previewTitle.textContent = nextTitle;
                }

                if (nextLabel && previewLabel) {
                    previewLabel.textContent = nextLabel;
                }

                if (nextSubtitle && previewSubtitle) {
                    previewSubtitle.textContent = nextSubtitle;
                }

                if (nextHref && previewAction) {
                    previewAction.setAttribute("href", nextHref);
                }

                window.requestAnimationFrame(() => {
                    preview.classList.remove("is-switching");
                });
            }, 240);
        });
    });

    megaMenu.querySelectorAll("[data-mega-menu-close]").forEach((button) => {
        button.addEventListener("click", () => setMegaMenuOpen(false));
    });

    megaMenu.addEventListener("click", (event) => {
        if (event.target === megaMenu) {
            setMegaMenuOpen(false);
        }
    });

    megaMenu.querySelectorAll('a[href^="#"]').forEach((link) => {
        link.addEventListener("click", () => {
            window.__ameliaBypassStructSliderUntil = Date.now() + 3500;
            document.documentElement.classList.remove("struct-slider-locked");
            document.body.classList.remove("struct-slider-locked");
            setMegaMenuOpen(false);
        });
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            setMegaMenuOpen(false);
        }
    });
})();

(() => {
    const navItems = document.querySelectorAll(".site-nav-item");

    navItems.forEach((item) => {
        const media = item.querySelector(".header-mega-media");
        let swapTimer;

        const loadItemMedia = () => {
            loadDeferredImages(item);
            loadDeferredMaterialSymbols();
            loadDeferredFontAwesome();
        };

        item.addEventListener("mouseenter", loadItemMedia, { once: true });
        item.addEventListener("focusin", loadItemMedia, { once: true });

        if (!media) {
            return;
        }

        const clearSwap = () => {
            window.clearTimeout(swapTimer);
            item.classList.remove("is-image-swapped");
        };

        const scheduleSwap = () => {
            window.clearTimeout(swapTimer);
            item.classList.add("is-image-swapped");
        };

        media.addEventListener("mouseenter", scheduleSwap);
        media.addEventListener("mouseleave", clearSwap);
        media.addEventListener("focusin", scheduleSwap);
        media.addEventListener("focusout", clearSwap);
    });
})();

(() => {
    const priceTabGroups = document.querySelectorAll(".header-price-tabs");
    const headerPricingContent = {
        230: {
            area: "230 Sq.Yd",
            prices: ["1.54 Cr", "1.49 Cr", "1.49 Cr", "1.67 Cr"]
        },
        219: {
            area: "219 Sq.Yd",
            prices: ["1.47 Cr", "1.42 Cr", "1.42 Cr", "1.60 Cr"]
        },
        205: {
            area: "205 Sq.Yd",
            prices: ["1.37 Cr", "1.32 Cr", "1.32 Cr", "1.50 Cr"]
        }
    };

    priceTabGroups.forEach((group) => {
        const tabs = Array.from(group.querySelectorAll("button"));

        const setActiveTab = (activeTab) => {
            const selectedSize = activeTab.dataset.headerPriceSize;
            const selectedContent = headerPricingContent[selectedSize];
            const panel = group.closest(".header-price-unlock");

            tabs.forEach((tab) => {
                const isActive = tab === activeTab;
                tab.classList.toggle("is-active", isActive);
                tab.setAttribute("aria-selected", String(isActive));
            });

            if (!selectedContent || !panel) {
                return;
            }

            panel.querySelectorAll("[data-header-floor-area]").forEach((area) => {
                area.textContent = selectedContent.area;
            });

            panel.querySelectorAll("[data-header-floor-price]").forEach((price, index) => {
                price.textContent = `${selectedContent.prices[index]}*`;
            });
        };

        tabs.forEach((tab) => {
            tab.addEventListener("mouseenter", () => setActiveTab(tab));
            tab.addEventListener("focus", () => setActiveTab(tab));
            tab.addEventListener("click", () => setActiveTab(tab));
        });
    });
})();

(() => {
    const unlockForms = document.querySelectorAll("[data-header-unlock-form]");
    const getUnlockPanels = () => Array.from(unlockForms)
        .map((form) => form.closest(".header-price-unlock, .header-mega-content"))
        .filter(Boolean);

    const revealHeaderUnlocks = () => {
        getUnlockPanels().forEach((panel) => {
            panel.classList.add("is-unlocked");
        });
    };

    if (window.AmeliaLeadUnlock?.isUnlocked()) {
        revealHeaderUnlocks();
    }

    window.addEventListener("amelia:lead-unlocked", revealHeaderUnlocks);
    window.addEventListener("amelia:pricing-unlocked", () => {
        revealHeaderUnlocks();
        window.AmeliaLeadUnlock?.unlock();
    });

    unlockForms.forEach((form) => {
        const validateForm = () => {
            const nameInput = form.querySelector("input[name='name']");
            const phoneInput = form.querySelector("input[name='phone']");

            if (phoneInput) {
                phoneInput.value = phoneInput.value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").slice(0, 10);
            }

            const requiredInputs = Array.from(form.querySelectorAll("input[name='name'], input[name='phone']"));
            const firstInvalid = requiredInputs.find((input) => {
                if (input === phoneInput) {
                    return !/^[0-9]{10}$/.test(input.value);
                }

                return !/^[A-Za-z][A-Za-z .'-]{1,}$/.test(input.value.trim());
            });

            requiredInputs.forEach((input) => {
                const isValid = input === phoneInput
                    ? /^[0-9]{10}$/.test(input.value)
                    : /^[A-Za-z][A-Za-z .'-]{1,}$/.test(input.value.trim());

                input.closest("label")?.classList.toggle("is-invalid", !isValid);
            });

            if (firstInvalid) {
                firstInvalid.focus();
                return false;
            }

            return true;
        };

        const unlockPanel = () => {
            if (!validateForm() || !window.AmeliaLeadSubmission.send(form, "Price and document access")) {
                return;
            }

            revealHeaderUnlocks();
            window.AmeliaLeadUnlock?.unlock();
            window.AmeliaPricing?.unlockNow?.();
        };

        form.querySelectorAll("input[name='name'], input[name='phone']").forEach((input) => {
            input.addEventListener("input", () => {
                input.closest("label")?.classList.remove("is-invalid");
            });
        });

        form.addEventListener("submit", (event) => {
            event.preventDefault();
            unlockPanel();
        });

        form.querySelectorAll("button").forEach((button) => {
            button.addEventListener("click", (event) => {
                event.preventDefault();
                unlockPanel();
            });
        });
    });
})();

(() => {
    const choices = Array.from(document.querySelectorAll("[data-header-choice]"));

    if (!choices.length) {
        return;
    }

    const closeChoice = (choice) => {
        const trigger = choice.querySelector("[data-header-choice-trigger]");

        choice.classList.remove("is-open");

        if (trigger) {
            trigger.setAttribute("aria-expanded", "false");
        }
    };

    const closeAllChoices = (exceptChoice) => {
        choices.forEach((choice) => {
            if (choice !== exceptChoice) {
                closeChoice(choice);
            }
        });
    };

    choices.forEach((choice) => {
        const trigger = choice.querySelector("[data-header-choice-trigger]");
        const label = choice.querySelector("[data-header-choice-label]");
        const input = choice.querySelector('input[type="hidden"]');
        const options = Array.from(choice.querySelectorAll("[data-header-choice-option]"));

        if (!trigger || !label || !input || !options.length) {
            return;
        }

        const openChoice = () => {
            closeAllChoices(choice);
            choice.classList.add("is-open");
            trigger.setAttribute("aria-expanded", "true");
        };

        const toggleChoice = () => {
            if (choice.classList.contains("is-open")) {
                closeChoice(choice);
                return;
            }

            openChoice();
        };

        const selectOption = (option) => {
            const value = option.dataset.value || option.textContent.trim();

            input.value = value;
            label.textContent = option.textContent.trim();

            options.forEach((item) => {
                item.setAttribute("aria-selected", String(item === option));
            });

            closeChoice(choice);
        };

        trigger.addEventListener("click", (event) => {
            event.preventDefault();
            toggleChoice();
        });

        trigger.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " " || event.key === "ArrowDown") {
                event.preventDefault();
                openChoice();
                (options.find((option) => option.getAttribute("aria-selected") === "true") || options[0]).focus();
            }
        });

        options.forEach((option, index) => {
            option.addEventListener("click", (event) => {
                event.preventDefault();
                selectOption(option);
                trigger.focus();
            });

            option.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectOption(option);
                    trigger.focus();
                }

                if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    const nextIndex = (index + direction + options.length) % options.length;
                    options[nextIndex].focus();
                }

                if (event.key === "Escape") {
                    event.preventDefault();
                    closeChoice(choice);
                    trigger.focus();
                }
            });
        });
    });

    document.addEventListener("click", (event) => {
        const target = event.target instanceof Element ? event.target : event.target.parentElement;

        if (!target?.closest("[data-header-choice]")) {
            closeAllChoices();
        }
    });
})();

(() => {
    const mobileMenuCards = Array.from(document.querySelectorAll("[data-mobile-menu-card]"));

    if (!mobileMenuCards.length) {
        return;
    }

    const setCardOpen = (activeCard) => {
        mobileMenuCards.forEach((card) => {
            const isOpen = Boolean(activeCard && card === activeCard);
            const button = card.querySelector(".mobile-menu-card-head");

            card.classList.toggle("is-open", isOpen);

            if (button) {
                button.setAttribute("aria-expanded", String(isOpen));
            }
        });
    };

    mobileMenuCards.forEach((card) => {
        const button = card.querySelector(".mobile-menu-card-head");

        if (!button) {
            return;
        }

        button.addEventListener("click", () => {
            setCardOpen(card.classList.contains("is-open") ? null : card);
        });
    });
})();

(() => {
    const siteHeader = document.querySelector(".site-header");
    const heroSection = document.querySelector(".hero-section");
    const mobileStructSliderSection = document.querySelector(".struct-slider-section");

    if (!siteHeader || !heroSection) {
        return;
    }

    const isMobileHeader = () => window.matchMedia("(max-width: 767px)").matches;
    const isMobileStructSliderActive = () => {
        if (!mobileStructSliderSection) {
            return false;
        }

        const rect = mobileStructSliderSection.getBoundingClientRect();

        return rect.top <= 2 && rect.bottom > 2;
    };

    const updateMobileHeaderState = () => {
        if (!isMobileHeader()) {
            siteHeader.classList.remove("is-mobile-scroll-active");
            document.body.classList.remove("is-mobile-hero-active");
            document.body.classList.remove("is-mobile-struct-slider-active");
            return;
        }

        const heroBottom = heroSection.offsetTop + heroSection.offsetHeight;
        const revealPoint = Math.max(0, heroBottom - 1);
        const isPastHero = window.scrollY >= revealPoint;
        const isStructSliderActive = isMobileStructSliderActive();

        siteHeader.classList.toggle("is-mobile-scroll-active", isPastHero && !isStructSliderActive);
        document.body.classList.toggle("is-mobile-hero-active", !isPastHero);
        document.body.classList.toggle("is-mobile-struct-slider-active", isStructSliderActive);
    };

    let mobileHeaderFrame = 0;
    const requestMobileHeaderState = () => {
        window.cancelAnimationFrame(mobileHeaderFrame);
        mobileHeaderFrame = window.requestAnimationFrame(updateMobileHeaderState);
    };

    if (document.readyState === "complete") {
        requestMobileHeaderState();
    } else {
        window.addEventListener("load", requestMobileHeaderState, { once: true });
    }

    window.addEventListener("scroll", requestMobileHeaderState, { passive: true });
    window.addEventListener("resize", requestMobileHeaderState);
})();

// Mobile footer accordion: keeps footer links compact until a heading is tapped.
const footerAccordionToggles = document.querySelectorAll(".footer-accordion-toggle");

if (footerAccordionToggles.length) {
    const isMobileFooter = () => window.matchMedia("(max-width: 767px)").matches;

    const setFooterAccordionItem = (column, shouldOpen) => {
        const toggle = column.querySelector(".footer-accordion-toggle");

        column.classList.toggle("is-open", shouldOpen);

        if (toggle) {
            toggle.setAttribute("aria-expanded", String(shouldOpen));
        }
    };

    footerAccordionToggles.forEach((toggle) => {
        toggle.addEventListener("click", () => {
            if (!isMobileFooter()) {
                return;
            }

            const column = toggle.closest(".footer-redesign-column");
            const shouldOpen = !column.classList.contains("is-open");

            document.querySelectorAll(".footer-redesign-column.is-open").forEach((openColumn) => {
                if (openColumn !== column) {
                    setFooterAccordionItem(openColumn, false);
                }
            });

            setFooterAccordionItem(column, shouldOpen);
        });
    });

    const openDefaultFooterContact = () => {
        if (!isMobileFooter()) {
            return;
        }

        const contactColumn = document.querySelector(".footer-redesign-contact");

        if (contactColumn && !document.querySelector(".footer-redesign-column.is-open")) {
            setFooterAccordionItem(contactColumn, true);
        }
    };

    openDefaultFooterContact();

    window.addEventListener("resize", () => {
        if (!isMobileFooter()) {
            document.querySelectorAll(".footer-redesign-column.is-open").forEach((column) => {
                setFooterAccordionItem(column, false);
            });

            return;
        }

        openDefaultFooterContact();
    });
}

const footerLegalModal = document.querySelector("#footerLegalModal");

if (footerLegalModal) {
    const footerLegalTitle = footerLegalModal.querySelector("[data-footer-legal-title]");
    const footerLegalCopy = footerLegalModal.querySelector("[data-footer-legal-copy]");
    const footerLegalCloseButtons = footerLegalModal.querySelectorAll("[data-footer-legal-close]");
    let previousFooterLegalTrigger = null;

    const closeFooterLegalModal = () => {
        footerLegalModal.hidden = true;
        document.body.classList.remove("is-footer-legal-modal-open");

        if (previousFooterLegalTrigger) {
            previousFooterLegalTrigger.focus();
            previousFooterLegalTrigger = null;
        }
    };

    const openFooterLegalModal = (noteId, trigger) => {
        const note = document.getElementById(noteId);

        if (!note || !footerLegalTitle || !footerLegalCopy) {
            return;
        }

        const title = note.querySelector("strong");
        const copy = note.querySelector("p");

        footerLegalTitle.textContent = title ? title.textContent.trim() : "";
        footerLegalCopy.textContent = copy ? copy.textContent.trim() : "";
        previousFooterLegalTrigger = trigger;
        footerLegalModal.hidden = false;
        document.body.classList.add("is-footer-legal-modal-open");

        const closeButton = footerLegalModal.querySelector(".footer-legal-modal-close");

        if (closeButton) {
            closeButton.focus();
        }
    };

    document.querySelectorAll("[data-footer-legal-open]").forEach((link) => {
        link.addEventListener("click", (event) => {
            event.preventDefault();
            openFooterLegalModal(link.dataset.footerLegalOpen, link);
        });
    });

    footerLegalCloseButtons.forEach((button) => {
        button.addEventListener("click", closeFooterLegalModal);
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !footerLegalModal.hidden) {
            closeFooterLegalModal();
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
    const mobileStoryDuration = 5000;

    let activeSlide = 0;
    let slideInterval;
    let heroLightFrame;
    let startX = 0;
    let endX = 0;
    const swipeDistance = 50;
    let suppressStoryTapUntil = 0;
    let storyProgressItems = [];
    const desktopHeroImages = Array.from(slides, (slide) => slide.dataset.heroImage || "");
    const mobileHeroImages = [
        null,
        "assets/img/slider/mobile-slide-2.webp",
        "assets/img/slider/mobile-slide-3.webp"
    ];

    const isMobileStory = () => window.matchMedia("(max-width: 767px)").matches;
    const getStoryDuration = () => (isMobileStory() ? mobileStoryDuration : desktopStoryDuration);

    const applyHeroImage = (index) => {
        const background = slides[index]?.querySelector(".hero-slide-bg");
        const source = isMobileStory() && mobileHeroImages[index]
            ? mobileHeroImages[index]
            : desktopHeroImages[index];

        if (background && source) {
            background.style.backgroundImage = `url("${source}")`;
        }
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

    let storyProgressFrame;
    const updateStoryProgress = (shouldRestart = false) => {
        if (!storyProgressItems.length) {
            return;
        }

        storyProgressItems.forEach((item, index) => {
            item.classList.toggle("is-complete", index < activeSlide);
            item.classList.toggle("is-active", !shouldRestart && index === activeSlide);
        });

        if (!shouldRestart) {
            return;
        }

        window.cancelAnimationFrame(storyProgressFrame);
        storyProgressFrame = window.requestAnimationFrame(() => {
            storyProgressFrame = window.requestAnimationFrame(() => {
                storyProgressItems[activeSlide]?.classList.add("is-active");
            });
        });
    };

    const showSlide = (index) => {
        slides[activeSlide].classList.remove("is-active");
        activeSlide = (index + slides.length) % slides.length;
        applyHeroImage(activeSlide);
        updateSliderPosition();
        slides[activeSlide].classList.add("is-active");
        updateStoryProgress(true);
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

        suppressStoryTapUntil = Date.now() + 450;
        showSlide(distance > 0 ? activeSlide + 1 : activeSlide - 1);
        resetAutoSlide();
    };

    slides[activeSlide].classList.add("is-active");
    applyHeroImage(activeSlide);
    updateSliderPosition();
    updateStoryProgress();
    startAutoSlide();

    window.addEventListener("resize", () => {
        applyHeroImage(activeSlide);
        updateSliderPosition();
        updateStoryProgress(true);
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

    heroSlider.addEventListener("click", (event) => {
        if (!isMobileStory()) {
            return;
        }

        if (Date.now() < suppressStoryTapUntil) {
            return;
        }

        if (event.target.closest("a, button, input, select, textarea, label")) {
            return;
        }

        const rect = heroSlider.getBoundingClientRect();
        const direction = event.clientX < rect.left + (rect.width / 2) ? -1 : 1;

        showSlide(activeSlide + direction);
        resetAutoSlide();
    });

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

const runAfterMobileTopBoot = (callback) => {
    const isMobileTopBoot = () => window.matchMedia("(max-width: 767px)").matches
        && (!window.location.hash || window.location.hash === "#top")
        && window.scrollY <= 8;

    if (!isMobileTopBoot()) {
        callback();
        return;
    }

    let hasRun = false;
    const eventNames = ["scroll", "wheel", "touchstart", "pointerdown", "keydown"];
    const run = () => {
        if (hasRun) {
            return;
        }

        hasRun = true;
        eventNames.forEach((eventName) => {
            window.removeEventListener(eventName, run);
        });
        window.setTimeout(callback, 120);
    };

    eventNames.forEach((eventName) => {
        window.addEventListener(eventName, run, {
            once: true,
            passive: eventName !== "keydown"
        });
    });
    window.addEventListener("load", () => {
        if (window.scrollY > 8) {
            run();
        }
    }, { once: true });
    window.setTimeout(run, 7000);
};

runAfterMobileTopBoot(() => {
// Sticky availability CTA: pins while later sections scroll over it.
const stickyAvailabilitySection = document.querySelector(".sticky-availability-section");
const stickyAvailabilityPanel = document.querySelector(".sticky-availability-panel");

if (stickyAvailabilitySection && stickyAvailabilityPanel) {
    let isStickyAvailabilityReady = false;
    const updateStickyAvailability = () => {
        const sectionRect = stickyAvailabilitySection.getBoundingClientRect();
        const sectionTop = sectionRect.top + window.scrollY;
        const sectionBottom = sectionTop + stickyAvailabilitySection.offsetHeight;
        const panelHeight = stickyAvailabilityPanel.offsetHeight;
        const pinStart = sectionTop;
        const pinEnd = sectionBottom - panelHeight;
        const scrollY = window.scrollY;
        const shouldPin = scrollY >= pinStart && scrollY < pinEnd;
        const shouldRelease = scrollY >= pinEnd;

        stickyAvailabilitySection.classList.toggle("is-pinned", shouldPin);
        stickyAvailabilitySection.classList.toggle("is-released", shouldRelease);
    };

    const enableStickyAvailability = () => {
        if (isStickyAvailabilityReady) {
            return;
        }

        isStickyAvailabilityReady = true;
        updateStickyAvailability();
        window.addEventListener("scroll", updateStickyAvailability, { passive: true });
        window.addEventListener("resize", updateStickyAvailability);
    };

    if ("IntersectionObserver" in window) {
        const stickyAvailabilityObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                enableStickyAvailability();
                stickyAvailabilityObserver.disconnect();
            }
        }, { rootMargin: "800px 0px" });

        stickyAvailabilityObserver.observe(stickyAvailabilitySection);
    } else {
        enableStickyAvailability();
    }
}

// Structured story slider (ported from github.com/Anil-0001/Amelia-Estate/js/script.js; scroll lock extended for this layout).
const structSliderSection = document.querySelector(".struct-slider-section");
const structSlides = structSliderSection?.querySelectorAll(".struct-slide") || [];
const structCopies = structSliderSection?.querySelectorAll(".struct-copy") || [];
const structIndexes = structSliderSection?.querySelectorAll(".struct-index") || [];
const structDots = structSliderSection?.querySelectorAll(".struct-dot") || [];

let activeStructSlide = 0;
let structAnimating = false;
let structLocked = false;
let previousStructScrollY = window.scrollY;
let structTouchStartY = 0;
let structReleaseUntil = 0;
let structReleaseDirection = 0;

const loadStructSlideImage = (index) => {
    const slide = structSlides[index];
    const source = slide?.dataset.structImage;

    if (slide && source && !slide.style.backgroundImage) {
        slide.style.backgroundImage = `url("${source}")`;
    }
};

const setStructSlide = (nextIndex) => {
    if (!structSlides.length) {
        return false;
    }

    const clampedIndex = Math.max(0, Math.min(nextIndex, structSlides.length - 1));
    loadStructSlideImage(clampedIndex);

    if (clampedIndex === activeStructSlide) {
        return false;
    }

    structSlides[activeStructSlide]?.classList.remove("is-active");
    structCopies[activeStructSlide]?.classList.remove("is-active");
    structIndexes[activeStructSlide]?.classList.remove("is-active");
    structDots[activeStructSlide]?.classList.remove("is-active");

    activeStructSlide = clampedIndex;
    structSlides[activeStructSlide]?.classList.add("is-active");
    structCopies[activeStructSlide]?.classList.add("is-active");
    structIndexes[activeStructSlide]?.classList.add("is-active");
    structDots[activeStructSlide]?.classList.add("is-active");

    return true;
};

if (structSliderSection && structSlides.length > 1) {
    if ("IntersectionObserver" in window) {
        const structImageObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                loadStructSlideImage(activeStructSlide);
                structImageObserver.disconnect();
            }
        }, { rootMargin: "320px 0px" });

        structImageObserver.observe(structSliderSection);
    } else {
        loadStructSlideImage(activeStructSlide);
    }

    const canMoveStructSlide = (direction) =>
        (direction > 0 && activeStructSlide < structSlides.length - 1) ||
        (direction < 0 && activeStructSlide > 0);
    const getStructTop = () =>
        Math.max(0, window.scrollY + structSliderSection.getBoundingClientRect().top);
    const isStructReleased = () => Date.now() < structReleaseUntil;

    const isStructBypassed = () => Date.now() < (window.__ameliaBypassStructSliderUntil || 0);
    const bypassStructLock = (duration = 900) => {
        window.__ameliaBypassStructSliderUntil = Date.now() + duration;
    };
    const clearStructRelease = () => {
        structReleaseUntil = 0;
        structReleaseDirection = 0;
        window.__ameliaBypassStructSliderUntil = 0;
    };
    const preventStructEvent = (event) => {
        if (event?.cancelable !== false) {
            event?.preventDefault();
        }
    };

    const jumpToStructTarget = (targetTop) => {
        const root = document.documentElement;
        const previousRootScrollBehavior = root.style.scrollBehavior;
        const previousBodyScrollBehavior = document.body.style.scrollBehavior;

        root.style.scrollBehavior = "auto";
        document.body.style.scrollBehavior = "auto";
        window.scrollTo({ top: targetTop, left: 0, behavior: "auto" });

        window.requestAnimationFrame(() => {
            root.style.scrollBehavior = previousRootScrollBehavior;
            document.body.style.scrollBehavior = previousBodyScrollBehavior;
        });
    };

    const setStructLock = (shouldLock) => {
        if (isStructBypassed()) {
            shouldLock = false;
        }

        if (shouldLock === structLocked) {
            document.documentElement.classList.toggle("struct-slider-locked", shouldLock);
            document.body.classList.toggle("struct-slider-locked", shouldLock);
            return;
        }

        structLocked = shouldLock;
        document.documentElement.classList.toggle("struct-slider-locked", shouldLock);
        document.body.classList.toggle("struct-slider-locked", shouldLock);
    };

    document.addEventListener("click", (event) => {
        const link = event.target.closest('a[href^="#"]');
        const targetId = link?.getAttribute("href")?.slice(1);
        const target = targetId ? document.getElementById(targetId) : null;

        if (!target || target === structSliderSection) {
            return;
        }

        bypassStructLock(4000);
        setStructLock(false);
        previousStructScrollY = window.scrollY;
    }, true);

    const lockStructSlider = (entryDirection) => {
        const structTop = getStructTop();

        if (entryDirection > 0) {
            setStructSlide(0);
        } else {
            setStructSlide(structSlides.length - 1);
        }

        previousStructScrollY = structTop;
        jumpToStructTarget(structTop);
        setStructLock(true);
    };

    const getStructReleaseBuffer = () => Math.max(48, Math.min(160, window.innerHeight * 0.25));

    const updateStructReleaseState = (currentScrollY = window.scrollY, structTop = getStructTop()) => {
        if (!structReleaseDirection) {
            return;
        }

        const releaseBuffer = getStructReleaseBuffer();
        const hasLeftAbove = structReleaseDirection < 0 && currentScrollY < structTop - releaseBuffer;
        const hasLeftBelow = structReleaseDirection > 0 && currentScrollY > structTop + releaseBuffer;

        if (hasLeftAbove || hasLeftBelow) {
            clearStructRelease();
        }
    };

    const releaseStructSlider = (direction) => {
        setStructLock(false);
        structReleaseDirection = direction;
        bypassStructLock(450);
        structReleaseUntil = Date.now() + 450;
        previousStructScrollY = window.scrollY;
    };

    const recaptureStructSlider = (direction, event) => {
        if (!structReleaseDirection || direction !== -structReleaseDirection || structLocked) {
            return false;
        }

        const structTop = getStructTop();
        const releaseBuffer = getStructReleaseBuffer();

        updateStructReleaseState(window.scrollY, structTop);

        if (!structReleaseDirection || Math.abs(window.scrollY - structTop) > releaseBuffer) {
            return false;
        }

        preventStructEvent(event);
        clearStructRelease();
        jumpToStructTarget(structTop);
        previousStructScrollY = structTop;
        setStructLock(true);

        if (canMoveStructSlide(direction)) {
            structAnimating = true;
            setStructSlide(activeStructSlide + direction);

            window.setTimeout(() => {
                structAnimating = false;
            }, 650);
        }

        return true;
    };

    const syncStructLock = () => {
        const currentScrollY = window.scrollY;
        const structTop = getStructTop();

        updateStructReleaseState(currentScrollY, structTop);

        const isReversingRelease =
            structReleaseDirection < 0
                ? currentScrollY > previousStructScrollY
                : structReleaseDirection > 0 && currentScrollY < previousStructScrollY;

        if (isReversingRelease && recaptureStructSlider(-structReleaseDirection)) {
            return;
        }

        if (isStructBypassed() || isStructReleased()) {
            previousStructScrollY = currentScrollY;
            setStructLock(false);
            return;
        }

        if (structLocked) {
            jumpToStructTarget(structTop);
            return;
        }

        const scrollingDown = currentScrollY > previousStructScrollY;
        const reachedStructTop = previousStructScrollY < structTop && currentScrollY >= structTop - 2;
        const reachedStructFromBelow = previousStructScrollY > structTop && currentScrollY <= structTop + 2;

        if (scrollingDown && reachedStructTop && activeStructSlide < structSlides.length - 1) {
            lockStructSlider(1);
            return;
        }

        if (!scrollingDown && reachedStructFromBelow && activeStructSlide > 0) {
            lockStructSlider(-1);
            return;
        }

        previousStructScrollY = currentScrollY;
    };

    const handleStructDirection = (direction, event) => {
        if (!structLocked) {
            return;
        }

        const canMove = canMoveStructSlide(direction);

        if (structAnimating) {
            if (canMove) {
                preventStructEvent(event);
            } else {
                releaseStructSlider(direction);
            }
            return;
        }

        if (canMove) {
            preventStructEvent(event);
            structAnimating = true;
            setStructSlide(activeStructSlide + direction);

            window.setTimeout(() => {
                structAnimating = false;
            }, 650);
            return;
        }

        releaseStructSlider(direction);
    };

    const handleStructWheel = (event) => {
        const dy = event.deltaY;

        if (Math.abs(dy) > 12 && recaptureStructSlider(dy > 0 ? 1 : -1, event)) {
            return;
        }

        if (!structLocked) {
            return;
        }

        if (Math.abs(dy) <= 12) {
            preventStructEvent(event);
            return;
        }

        handleStructDirection(dy > 0 ? 1 : -1, event);
    };

    const handleStructTouchStart = (event) => {
        if (!structLocked && !structReleaseDirection) {
            return;
        }

        structTouchStartY = event.touches[0]?.clientY || 0;
    };

    const handleStructTouchMove = (event) => {
        const currentY = event.touches[0]?.clientY || structTouchStartY;
        const deltaY = structTouchStartY - currentY;

        if (!structLocked && Math.abs(deltaY) > 24 && recaptureStructSlider(deltaY > 0 ? 1 : -1, event)) {
            structTouchStartY = currentY;
            return;
        }

        if (structLocked && Math.abs(deltaY) > 24) {
            const direction = deltaY > 0 ? 1 : -1;

            if (!canMoveStructSlide(direction)) {
                handleStructDirection(direction, event);
                structTouchStartY = currentY;
                return;
            }
        }

        if (!structLocked) {
            return;
        }

        preventStructEvent(event);
    };

    const handleStructTouchEnd = (event) => {
        const endY = event.changedTouches[0]?.clientY || structTouchStartY;
        const deltaY = structTouchStartY - endY;

        if (!structLocked) {
            if (Math.abs(deltaY) > 24) {
                recaptureStructSlider(deltaY > 0 ? 1 : -1, event);
            }
            return;
        }

        if (Math.abs(deltaY) > 24) {
            handleStructDirection(deltaY > 0 ? 1 : -1, event);
        }
    };

    const handleStructKeydown = (event) => {
        if (["ArrowDown", "PageDown", "Space"].includes(event.code)) {
            if (!structLocked && recaptureStructSlider(1, event)) {
                return;
            }
            handleStructDirection(1, event);
        } else if (["ArrowUp", "PageUp"].includes(event.code)) {
            if (!structLocked && recaptureStructSlider(-1, event)) {
                return;
            }
            handleStructDirection(-1, event);
        }
    };

    window.addEventListener("scroll", syncStructLock, { passive: true });
    window.addEventListener("wheel", handleStructWheel, { passive: false });
    window.addEventListener("touchstart", handleStructTouchStart, { passive: true });
    window.addEventListener("touchmove", handleStructTouchMove, { passive: false });
    window.addEventListener("touchend", handleStructTouchEnd, { passive: false });
    window.addEventListener("keydown", handleStructKeydown);
    window.addEventListener("resize", syncStructLock);

    if (window.scrollY > 0) {
        syncStructLock();
    }
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

// Ideal floor: activates size and floor tabs, then refreshes the visible details.
const idealFloorSection = document.querySelector(".ideal-floor-section");

if (idealFloorSection) {
    const sizeTabs = idealFloorSection.querySelectorAll("[data-ideal-size]");
    const floorTabs = idealFloorSection.querySelectorAll("[data-ideal-floor]");
    const badgeSizeFloor = idealFloorSection.querySelector(".ideal-floor-badges span");
    const badgeFeature = idealFloorSection.querySelector(".ideal-floor-badges strong");
    const panelTitle = idealFloorSection.querySelector(".ideal-floor-panel h3");
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
            title: "3 BHK Premium Floor",
            image: "assets/img/choose ideal/banner.jpg"
        },
        219: {
            label: "219 Sq.Yd",
            area: "219 Sq.Yds",
            title: "3 BHK Smart Floor",
            image: "assets/img/choose ideal/banner-render.webp"
        },
        205: {
            label: "205 Sq.Yd",
            area: "205 Sq.Yds",
            title: "3 BHK Compact Floor",
            image: "assets/img/choose ideal/bedroom-night-205.webp"
        }
    };

    const floorDetails = {
        "1st": {
            label: "1st Floor",
            spec: "1st Floor"
        },
        "2nd": {
            label: "2nd Floor",
            spec: "2nd Floor"
        },
        "3rd": {
            label: "3rd Floor",
            spec: "3rd Floor"
        },
        "4th": {
            label: "4th Floor",
            feature: "Roof Right",
            spec: "4th + Roof"
        }
    };

    const switchIdealImage = (src) => {
        if (!idealImage || !src || idealImage.getAttribute("src") === src) {
            return;
        }

        const requestId = ++idealImageRequest;
        clearTimeout(idealImageTimer);
        idealImage.classList.remove("is-image-revealing");
        idealImage.src = src;
        if (requestId !== idealImageRequest) {
            return;
        }

        idealImage.classList.add("is-image-revealing");

        idealImageTimer = setTimeout(() => {
            if (requestId !== idealImageRequest) {
                return;
            }

            idealImage.classList.remove("is-image-revealing");
        }, 760);
    };

    const refreshIdealFloor = () => {
        const size = sizeDetails[activeSize];
        const floor = floorDetails[activeFloor] || floorDetails["1st"];

        if (!size) {
            return;
        }

        if (badgeSizeFloor) {
            badgeSizeFloor.textContent = `${size.label} - ${floor.label}`;
        }

        if (badgeFeature) {
            if (activeFloor === "4th") {
                badgeFeature.textContent = "Roof Right";
                badgeFeature.style.display = "";
            } else {
                badgeFeature.style.display = "none";
            }
        }

        if (panelTitle) {
            panelTitle.textContent = size.title;
        }

        if (panelSubtitle) {
            panelSubtitle.textContent = `${size.label} ${floor.label} Selected`;
        }

        if (specValues[0]) {
            specValues[0].textContent = size.area;
        }

        if (specValues[1]) {
            specValues[1].textContent = floor.spec;
        }

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

    const floorImage = "assets/img/optimized/90009c575573f8f004b5343f065db6963be4f203.webp";
    const floorDownloadImage = "assets/img/project plans/90009c575573f8f004b5343f065db6963be4f203.webp";
    const siteImage = "assets/img/project plans/site plan.jpg";
    let activePlan = "floor";
    let projectPlanImageTimer;
    let projectPlanImageRequest = 0;

    const planContent = {
        floor: {
            image: floorImage,
            download: floorDownloadImage,
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
            download: siteImage,
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
            download: floorDownloadImage,
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

    const switchProjectPlanImage = (src, alt) => {
        if (!image || !src) {
            return;
        }

        if (image.getAttribute("src") === src) {
            image.alt = alt;
            return;
        }

        const requestId = ++projectPlanImageRequest;
        clearTimeout(projectPlanImageTimer);
        image.classList.remove("is-image-revealing");
        image.src = src;
        image.alt = alt;
        if (requestId !== projectPlanImageRequest) {
            return;
        }

        image.classList.add("is-image-revealing");

        projectPlanImageTimer = setTimeout(() => {
            if (requestId !== projectPlanImageRequest) {
                return;
            }

            image.classList.remove("is-image-revealing");
        }, 760);
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

        switchProjectPlanImage(content.image, content.alt);
        badgeLabel.textContent = content.badge;
        badgeAccentText.textContent = content.badgeAccent;
        footerTitle.textContent = content.title;
        footerCopy.textContent = content.copy;
        meta.innerHTML = content.meta;
        projectPlansSection.classList.toggle("is-site-plan-active", key === "site");
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
            link.href = content.download || content.image;
        });
    };

    const getProjectPlanFromHash = () => {
        const match = window.location.hash.match(/^#project-plans-(floor|site|tower)$/);
        return match ? match[1] : "";
    };

    const applyProjectPlanHash = () => {
        const hashPlan = getProjectPlanFromHash();

        if (!hashPlan) {
            return;
        }

        updatePlan(hashPlan);
        projectPlansSection.scrollIntoView({ behavior: "smooth", block: "start" });
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

    document.querySelectorAll('a[href^="#project-plans-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const key = link.getAttribute("href").replace("#project-plans-", "");

            if (planContent[key]) {
                updatePlan(key);
                setTimeout(() => projectPlansSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
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

    updatePlan(activePlan);
    applyProjectPlanHash();
    window.addEventListener("hashchange", applyProjectPlanHash);
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
    const pricingImageWrap = pricingSection.querySelector(".pricing-image-wrap");
    const pricingImage = pricingSection.querySelector(".pricing-image-wrap img");
    const selectedPriceBox = pricingSection.querySelector(".selected-price-box");
    const selectedPrice = pricingSection.querySelector(".selected-price-box strong");
    const selectedMeta = pricingSection.querySelector(".selected-price-box p");
    const unlockButton = pricingSection.querySelector(".pricing-unlock-btn");
    const unlockModal = pricingSection.querySelector(".pricing-unlock-modal");
    const unlockForm = pricingSection.querySelector(".pricing-unlock-form");
    const unlockCloseButtons = pricingSection.querySelectorAll("[data-pricing-unlock-close]");
    const unlockKicker = pricingSection.querySelector(".pricing-unlock-kicker");
    const unlockTitle = pricingSection.querySelector("#pricingUnlockTitle");
    const unlockCopy = pricingSection.querySelector(".pricing-unlock-copy");
    const unlockSubmit = pricingSection.querySelector(".pricing-unlock-submit");
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
            image: "assets/img/priceing and investment/pricing-230-premium-living.webp"
        },
        219: {
            title: "3 BHK - 219 Sq. Yd",
            badge: "3 BHK - 219 Sq. Yd",
            area: "219 Sq.Yds",
            prices: ["1.47 Cr", "1.42 Cr", "1.42 Cr", "1.60 Cr"],
            image: "assets/img/priceing and investment/pricing-219-premium-bedroom.webp"
        },
        205: {
            title: "3 BHK - 205 Sq. Yd",
            badge: "3 BHK - 205 Sq. Yd",
            area: "205 Sq.Yds",
            prices: ["1.37 Cr", "1.32 Cr", "1.32 Cr", "1.50 Cr"],
            image: "assets/img/priceing and investment/photo-1600607687939-ce8a6c25118c.avif"
        }
    };

    let activeSize = "230";
    let isPricingUnlocked = false;
    let pricingUnlockCallbacks = [];
    let pricingImageTimer;
    let pricingImageRequest = 0;
    let pricingCelebrationTimer;
    const unlockedIcon = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 11V8a5 5 0 0 1 9.5-2.2" /><path d="M6 11h12v10H6V11Z" /></svg>`;
    const getActiveSizeLabel = () => `${activeSize} Sq.Yd`;

    const updateSelectedPrice = (button) => {
        const floorLabel = button.querySelector("span").textContent;
        const price = button.dataset.floorPrice;
        const isVisiblePrice = isPricingUnlocked || button.classList.contains("is-price-visible");

        floorButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");

        if (selectedPriceBox) {
            selectedPriceBox.classList.toggle("is-price-visible", isVisiblePrice);

            if (!isVisiblePrice) {
            }
        }

        pricingFloor.textContent = floorLabel;
        selectedPrice.innerHTML = `<span class="pricing-currency">&#8377;</span>${price}*`;
        selectedMeta.innerHTML = `${floorLabel} &middot; <span>${activeSize} Sq.Yd</span>`;
    };

    const setPricingUnlockContent = (context = {}) => {
        const isDownload = context.type === "download";
        const downloadTitle = context.title || "Project Essentials";

        if (unlockKicker) {
            unlockKicker.textContent = isDownload ? "Download Request" : "Price Unlock Request";
        }

        if (unlockTitle) {
            unlockTitle.textContent = isDownload
                ? `Get ${downloadTitle}`
                : "Get Floor-wise Price & Payment Breakup";
        }

        if (unlockCopy) {
            unlockCopy.textContent = isDownload
                ? "Submit your details once. Your selected project document will download instantly."
                : `Submit your details once. Floor-wise prices and payment breakup for ${getActiveSizeLabel()} will unlock instantly.`;
        }

        if (unlockSubmit) {
            unlockSubmit.textContent = isDownload ? "Submit & Download" : "Submit & Unlock Prices";
        }
    };

    const switchPricingImage = (src, alt) => {
        if (!pricingImage || !pricingImageWrap || !src) {
            return;
        }

        if (pricingImage.getAttribute("src") === src) {
            pricingImage.alt = alt;
            return;
        }

        const requestId = ++pricingImageRequest;
        clearTimeout(pricingImageTimer);
        pricingImage.classList.remove("is-image-revealing");
        pricingImage.src = src;
        pricingImage.alt = alt;
        if (requestId !== pricingImageRequest) {
            return;
        }

        pricingImage.classList.add("is-image-revealing");

        pricingImageTimer = setTimeout(() => {
            if (requestId !== pricingImageRequest) {
                return;
            }

            pricingImage.classList.remove("is-image-revealing");
        }, 760);
    };

    const openPricingUnlockForm = (context) => {
        if (!unlockModal || isPricingUnlocked) {
            return;
        }

        setPricingUnlockContent(context);
        unlockModal.hidden = false;
        document.body.classList.add("is-pricing-modal-open");

        const firstInput = unlockModal.querySelector("input:not([readonly])");

        if (firstInput) {
            setTimeout(() => firstInput.focus(), 60);
        }
    };

    const closePricingUnlockForm = ({ clearCallbacks = false } = {}) => {
        if (!unlockModal) {
            return;
        }

        if (clearCallbacks) {
            pricingUnlockCallbacks = [];
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

    const runPricingUnlockCallbacks = () => {
        const callbacks = pricingUnlockCallbacks;
        pricingUnlockCallbacks = [];

        callbacks.forEach((callback) => {
            if (typeof callback === "function") {
                callback();
            }
        });
    };

    const unlockPricing = ({ persist = true } = {}) => {
        if (isPricingUnlocked) {
            runPricingUnlockCallbacks();
            return;
        }

        isPricingUnlocked = true;
        pricingSection.classList.add("is-pricing-unlocked");
        pricingCard.classList.add("is-unlocked");
        updateSelectedPrice(pricingSection.querySelector(".floor-price-grid button.is-active"));
        unlockButton.innerHTML = `${unlockedIcon}<span>All Prices Unlocked</span>`;
        unlockButton.setAttribute("aria-label", "All floor prices are unlocked");

        runPricingUnlockCallbacks();

        if (persist) {
            window.AmeliaLeadUnlock?.unlock();
        }

        window.dispatchEvent(new CustomEvent("amelia:pricing-unlocked"));
    };

    window.AmeliaPricing = {
        isUnlocked: () => isPricingUnlocked,
        unlockNow: () => unlockPricing(),
        requestUnlock: (callback, context) => {
            if (isPricingUnlocked) {
                if (typeof callback === "function") {
                    callback();
                }

                return;
            }

            if (typeof callback === "function") {
                pricingUnlockCallbacks.push(callback);
            }

            openPricingUnlockForm(context);
        }
    };

    window.addEventListener("amelia:lead-unlocked", () => {
        unlockPricing({ persist: false });
    });

    const updatePricingSize = (size) => {
        const content = pricingContent[size];

        if (!content) {
            return;
        }

        activeSize = size;
        setPricingUnlockContent();
        pricingTabs.forEach((tab) => {
            tab.classList.toggle("is-active", tab.dataset.pricingTab === size);
        });

        pricingTitle.textContent = content.title;
        imageBadge.textContent = content.badge;
        pricingSection.querySelector(".pricing-spec strong").textContent = content.area;

        switchPricingImage(content.image, `${content.title} premium residence view`);

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

    const getPricingSizeFromHash = () => {
        const match = window.location.hash.match(/^#pricing-(230|219|205)$/);
        return match ? match[1] : "";
    };

    const applyPricingHash = () => {
        const hashSize = getPricingSizeFromHash();

        if (!hashSize) {
            return;
        }

        updatePricingSize(hashSize);
        pricingSection.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    pricingTabs.forEach((tab) => {
        tab.addEventListener("click", () => {
            updatePricingSize(tab.dataset.pricingTab);
            history.replaceState(null, "", "#pricing");
        });
    });

    document.querySelectorAll('a[href^="#pricing-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const size = link.getAttribute("href").replace("#pricing-", "");

            if (pricingContent[size]) {
                updatePricingSize(size);
                setTimeout(() => pricingSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
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
        button.addEventListener("click", () => closePricingUnlockForm({ clearCallbacks: true }));
    });

    if (unlockForm) {
        unlockForm.addEventListener("submit", (event) => {
            event.preventDefault();

            if (!window.AmeliaLeadSubmission.send(unlockForm, "Floor-wise price unlock", { delay: 2800 })) {
                return;
            }

            closePricingUnlockForm();
            showPricingCelebration();

            setTimeout(() => {
                unlockPricing();
            }, 520);
        });
    }

    window.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && unlockModal && !unlockModal.hidden) {
            closePricingUnlockForm({ clearCallbacks: true });
        }
    });

    updatePricingSize(activeSize);

    if (window.AmeliaLeadUnlock?.isUnlocked()) {
        unlockPricing({ persist: false });
    }

    applyPricingHash();
    window.addEventListener("hashchange", applyPricingHash);
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
    let brandMarqueePosition = 0;
    let isBrandMarqueePaused = false;
    let isPremiumSpecsMotionActive = false;
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

        cancelAnimationFrame(brandMarqueeFrame);

        const step = () => {
            if (!isBrandMarqueePaused) {
                brandMarqueePosition += 0.55;
                brandTrack.scrollLeft = brandMarqueePosition;

                if (brandTrack.scrollLeft >= brandTrack.scrollWidth / 2) {
                    brandMarqueePosition = 0;
                    brandTrack.scrollLeft = 0;
                }

                requestBrandIndicatorUpdate();
            }

            brandMarqueeFrame = requestAnimationFrame(step);
        };

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
        specSliderInterval = setInterval(() => {
            if (specsModal && !specsModal.hidden) {
                return;
            }

            setSpecSlide(activeSpecSlide + 1, 1);
        }, 3200);
    };

    const resetSpecSlider = () => {
        clearInterval(specSliderInterval);
        startSpecSlider();
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
        document.documentElement.classList.add("is-premium-specs-modal-open");
        document.body.classList.add("is-premium-specs-modal-open");
    };

    const closeSpecsModal = () => {
        if (!specsModal) {
            return;
        }

        specsModal.hidden = true;
        document.documentElement.classList.remove("is-premium-specs-modal-open");
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
        const detailsButton = slide.querySelector(".premium-specs-slide-overlay button");

        detailsButton?.addEventListener("click", (event) => {
            event.stopPropagation();
            setSpecSlide(index);
            resetSpecSlider();
            openSpecsModal(slide);
        });

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

    specTrack.addEventListener("mouseenter", () => {
        clearInterval(specSliderInterval);
    });

    specTrack.addEventListener("mouseleave", startSpecSlider);

    if (brandTrack && brandItems.length && brandDots.length) {
        brandDots.forEach((dot, index) => {
            dot.addEventListener("click", () => {
                isBrandMarqueePaused = true;
                brandItems[index].scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "center"
                });
                setActiveBrand(index);
                brandMarqueePosition = brandTrack.scrollLeft;

                setTimeout(() => {
                    isBrandMarqueePaused = false;
                    brandMarqueePosition = brandTrack.scrollLeft;
                }, 1400);
            });
        });

        brandTrack.addEventListener("scroll", requestBrandIndicatorUpdate, { passive: true });
        window.addEventListener("resize", requestBrandIndicatorUpdate);
        document.addEventListener("visibilitychange", () => {
            isBrandMarqueePaused = document.hidden;
        });
    }

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && specsModal && !specsModal.hidden) {
            closeSpecsModal();
        }
    });

    const getSpecFromHash = () => {
        const match = window.location.hash.match(/^#specifications-(classic-kitchen|modern-kitchen|bathroom|bedroom)$/);
        return match ? match[1] : "";
    };

    const applySpecHash = () => {
        const specKey = getSpecFromHash();
        const specIndex = Array.from(specSlides).findIndex((slide) => slide.dataset.specKey === specKey);

        if (specIndex < 0) {
            return;
        }

        setSpecSlide(specIndex);
        resetSpecSlider();
        premiumSpecsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    document.querySelectorAll('a[href^="#specifications-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const specKey = link.getAttribute("href").replace("#specifications-", "");
            const specIndex = Array.from(specSlides).findIndex((slide) => slide.dataset.specKey === specKey);

            if (specIndex >= 0) {
                setSpecSlide(specIndex);
                resetSpecSlider();
                setTimeout(() => premiumSpecsSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
    });

    setSpecSlide(activeSpecSlide);
    applySpecHash();
    window.addEventListener("hashchange", applySpecHash);

    const activatePremiumSpecsMotion = () => {
        if (isPremiumSpecsMotionActive) {
            return;
        }

        isPremiumSpecsMotionActive = true;

        if (brandTrack && brandItems.length && brandDots.length) {
            setupBrandMarquee();
            updateBrandIndicator();
            startBrandMarquee();
        }

        startSpecSlider();
    };

    if (getSpecFromHash()) {
        activatePremiumSpecsMotion();
    } else if ("IntersectionObserver" in window) {
        const premiumSpecsMotionObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                activatePremiumSpecsMotion();
                premiumSpecsMotionObserver.disconnect();
            }
        }, { rootMargin: "500px 0px" });

        premiumSpecsMotionObserver.observe(premiumSpecsSection);
    } else {
        activatePremiumSpecsMotion();
    }
}

// Visual showcase: switches gallery tabs, copy, and walkthrough/construction views.
const visualShowcaseSection = document.querySelector(".visual-showcase-section");

if (visualShowcaseSection) {
    const galleryTabsScroller = visualShowcaseSection.querySelector(".visual-showcase-tabs");
    const galleryTabsPrevious = visualShowcaseSection.querySelector("[data-gallery-tabs-prev]");
    const galleryTabsNext = visualShowcaseSection.querySelector("[data-gallery-tabs-next]");
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

    const updateGalleryTabSliderState = () => {
        if (!galleryTabsScroller) {
            return;
        }

        const maxScroll = galleryTabsScroller.scrollWidth - galleryTabsScroller.clientWidth;
        const isShifted = isMobileGallery() && galleryTabsScroller.scrollLeft > 12;
        const isAtEnd = !isMobileGallery() || galleryTabsScroller.scrollLeft >= maxScroll - 12;

        galleryTabsScroller.classList.toggle("is-tab-slider-shifted", isShifted);
        galleryTabsPrevious?.classList.toggle("is-disabled", !isShifted);
        galleryTabsNext?.classList.toggle("is-disabled", isAtEnd);
    };

    const scrollGalleryTabsByPage = (direction) => {
        if (!galleryTabsScroller) {
            return;
        }

        galleryTabsScroller.scrollBy({
            left: direction * galleryTabsScroller.clientWidth,
            behavior: "smooth"
        });
    };

    const scrollGalleryTabIntoLeadPosition = (tab, direction = 1) => {
        if (!galleryTabsScroller || !tab || !isMobileGallery()) {
            return;
        }

        const maxScroll = galleryTabsScroller.scrollWidth - galleryTabsScroller.clientWidth;
        const leadPosition = tab.offsetLeft;
        const tailPosition = tab.offsetLeft + tab.offsetWidth - galleryTabsScroller.clientWidth;
        const targetLeft = Math.max(0, Math.min(direction < 0 ? tailPosition : leadPosition, maxScroll));

        galleryTabsScroller.scrollTo({
            left: targetLeft,
            behavior: "smooth"
        });
    };

    const galleryPanelLabels = {
        sample: "Sample Flat",
        walkthrough: "Walkthrough",
        exterior: "Exterior",
        construction: "Construction"
    };

    const galleryDetailByFile = {
        "0be2e6c5e9842f9e20d65c054d0f4df90ec098c0.webp": {
            title: "Modular Island Kitchen",
            description: "Warm cabinetry, island counter and built-in appliances for a ready-to-use premium kitchen.",
            focus: "Kitchen planning, storage wall, island counter and appliance placement",
            finish: "Wood-look cabinetry, light countertop, pendant lighting and premium fittings"
        },
        "71f1fe9bf7b83056f21dcc38fe0297862834698b.webp": {
            title: "Sunlit Living Lounge",
            description: "A bright living and dining zone planned for natural light, family seating and everyday comfort.",
            focus: "Living room volume, window light, lounge seating and dining connection",
            finish: "Soft neutral palette, curtains, pendant lights and warm decor accents"
        },
        "bdec928ef1c3f2fad9db07ae04140d3f77543c80.webp": {
            title: "Luxury Bathroom Suite",
            description: "Premium bathroom finish with vanity counter, wall cladding and modern sanitary fittings.",
            focus: "Vanity counter, shower/bath zone, wall tiles and sanitaryware positioning",
            finish: "Dark feature wall, stone-look surfaces, mirror lighting and branded fittings"
        },
        "9d36bc9e1115936b757064117ba22e4770259b28.webp": {
            title: "Family Living Area",
            description: "Open lounge planning with natural light, calm finishes and practical furniture placement.",
            focus: "Daily-use living layout, sofa placement, table zone and window-side seating",
            finish: "Warm neutral finishes, soft furnishings and elegant ceiling lighting"
        },
        "f4b90b41d2921d5f3eb4fe1272f937640e7f3dfe.webp": {
            title: "Premium Lounge Interior",
            description: "A refined lounge view showing material depth, curated lighting and comfortable proportions.",
            focus: "Interior mood, lounge depth, lighting and material continuity",
            finish: "Premium textures, warm lights, feature furniture and polished surfaces"
        },
        "ffbfb80a4618358645f60806327606317538f142.webp": {
            title: "Classic Kitchen Finish",
            description: "A practical kitchen detail focused on countertop workspace, storage and everyday utility.",
            focus: "Countertop work area, cabinetry, sink position and compact kitchen workflow",
            finish: "Classic cabinets, durable counter surface and clean appliance provisions"
        },
        "walktrough.webp": {
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
            : panelKey === "exterior" && fileName === "walktrough.webp"
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
            </div>
            <span class="visual-gallery-view-full" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                    <path d="M9.6 4H4v5.6" />
                    <path d="M4.5 4.5 10 10" />
                    <path d="M14.4 4H20v5.6" />
                    <path d="M19.5 4.5 14 10" />
                    <path d="M20 14.4V20h-5.6" />
                    <path d="M19.5 19.5 14 14" />
                    <path d="M4 14.4V20h5.6" />
                    <path d="M4.5 19.5 10 14" />
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
        if (!visualDetailModal || !visualDetailImage || !visualDetailTitle || !visualDetailCopy || !visualDetailCategory) {
            return;
        }

        const detail = getVisualGalleryDetail(card);
        visualDetailImage.src = detail.imageSrc;
        visualDetailImage.alt = detail.imageAlt;
        visualDetailTitle.textContent = detail.title;
        visualDetailCopy.textContent = detail.description;
        visualDetailCategory.textContent = detail.category;
        if (visualDetailList) {
            visualDetailList.innerHTML = "";
        }
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

    const markGalleryCardActive = (card) => {
        const grid = card.closest(".visual-showcase-grid");

        if (grid && galleryGridState.has(grid)) {
            const state = galleryGridState.get(grid);
            const cardIndex = state.cards.indexOf(card);

            if (cardIndex !== -1) {
                setActiveGalleryImage(grid, cardIndex);
            }
        }

        galleryCards.forEach((galleryCard) => {
            if (galleryCard.classList.contains("visual-walkthrough-card")) {
                galleryCard.classList.toggle("is-active", galleryCard === card);
            }
        });
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
        const selectedTab = Array.from(galleryTabs).find((tab) => tab.dataset.galleryTab === key);
        const selectedIndex = Array.from(galleryTabs).findIndex((tab) => tab.dataset.galleryTab === key);
        const activeIndex = Array.from(galleryTabs).findIndex((tab) => tab.dataset.galleryTab === activeGalleryTab);
        const tabDirection = selectedIndex < activeIndex ? -1 : 1;

        if (selectedTab && isMobileGallery()) {
            scrollGalleryTabIntoLeadPosition(selectedTab, tabDirection);
        }

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

    const getGalleryTabFromHash = () => {
        const match = window.location.hash.match(/^#gallery-(sample|walkthrough|exterior|construction)$/);
        return match ? match[1] : "";
    };

    const applyGalleryHash = () => {
        const galleryTab = getGalleryTabFromHash();

        if (!galleryTab) {
            return;
        }

        setGalleryTab(galleryTab);
        visualShowcaseSection.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    galleryTabs.forEach((tab) => {
        tab.addEventListener("click", () => setGalleryTab(tab.dataset.galleryTab));
    });

    document.querySelectorAll('a[href^="#gallery-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const galleryTab = link.getAttribute("href").replace("#gallery-", "");

            if (galleryPanelLabels[galleryTab]) {
                setGalleryTab(galleryTab);
                setTimeout(() => visualShowcaseSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
    });

    galleryTabsScroller?.addEventListener("scroll", updateGalleryTabSliderState, { passive: true });
    galleryTabsPrevious?.addEventListener("click", () => scrollGalleryTabsByPage(-1));
    galleryTabsNext?.addEventListener("click", () => scrollGalleryTabsByPage(1));

    galleryCards.forEach((card) => {
        addVisualGalleryOverlay(card);

        card.addEventListener("click", () => {
            markGalleryCardActive(card);
            openVisualDetail(card);
        });

        if (card.tagName !== "BUTTON") {
            card.addEventListener("keydown", (event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                    return;
                }

                event.preventDefault();
                markGalleryCardActive(card);
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

    window.addEventListener("resize", () => {
        updateActiveGalleryGrid();
        updateGalleryTabSliderState();
    });
    updateActiveGalleryGrid();
    updateGalleryTabSliderState();
    applyGalleryHash();
    window.addEventListener("hashchange", applyGalleryHash);
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

    const getPrimeMapFromHash = () => {
        const match = window.location.hash.match(/^#location-(image|google)$/);
        return match ? match[1] : "";
    };

    const applyPrimeMapHash = () => {
        const mapKey = getPrimeMapFromHash();

        if (!mapKey) {
            return;
        }

        setPrimeMapPanel(mapKey);
        primeLocationSection.scrollIntoView({ behavior: "smooth", block: "start" });
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

    document.querySelectorAll('a[href^="#location-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const mapKey = link.getAttribute("href").replace("#location-", "");

            if (mapKey === "image" || mapKey === "google") {
                setPrimeMapPanel(mapKey);
                setTimeout(() => primeLocationSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
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
        if (!distanceGrid || !distanceCards.length) {
            return;
        }

        if (!isMobileDistanceSlider()) {
            setActiveDistanceCard(-1);

            if (distanceProgress) {
                distanceProgress.style.width = "";
            }

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
        distanceGrid.addEventListener("scroll", requestDistanceSliderUpdate, { passive: true });
        window.addEventListener("resize", requestDistanceSliderUpdate);
        window.addEventListener("scroll", requestLocationCtaShiftUpdate, { passive: true });
        window.addEventListener("resize", requestLocationCtaShiftUpdate);
        requestDistanceSliderUpdate();
        requestLocationCtaShiftUpdate();
    }

    applyPrimeMapHash();
    window.addEventListener("hashchange", applyPrimeMapHash);
}

// Project downloads: match the upstream hover/focus preview behavior.
const downloadOptions = document.querySelectorAll(".download-option");

if (downloadOptions.length) {
    const projectDownloadSection = document.querySelector(".project-download-section");

    if ("IntersectionObserver" in window && projectDownloadSection) {
        const fontAwesomeObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                loadDeferredFontAwesome();
                fontAwesomeObserver.disconnect();
            }
        }, { rootMargin: "500px 0px" });

        fontAwesomeObserver.observe(projectDownloadSection);
    } else {
        loadDeferredFontAwesome();
    }
}
const downloadPreviewImages = document.querySelectorAll(".download-preview-image");

if (downloadOptions.length && downloadPreviewImages.length) {
    const downloadFile = (link) => {
        const downloadLink = document.createElement("a");
        downloadLink.href = link.href;
        downloadLink.download = link.getAttribute("download") || "";
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        downloadLink.remove();
    };

    const requestDownload = (option) => {
        const link = option?.querySelector("a");

        if (!link) {
            return;
        }

        if (!window.AmeliaPricing || window.AmeliaPricing.isUnlocked()) {
            downloadFile(link);
            return;
        }

        const optionTitle = option.querySelector("h4")?.textContent.trim() || "Project Essentials";

        window.AmeliaPricing.requestUnlock(
            () => downloadFile(link),
            { type: "download", title: optionTitle }
        );
    };

    const setDownloadPreview = (index) => {
        downloadOptions.forEach((option, optionIndex) => {
            option.classList.toggle("active", optionIndex === index);
        });

        downloadPreviewImages.forEach((image, imageIndex) => {
            image.classList.toggle("active", imageIndex === index);
        });
    };

    downloadOptions.forEach((option, index) => {
        option.addEventListener("mouseenter", () => {
            setDownloadPreview(index);
        });

        option.addEventListener("focusin", () => {
            setDownloadPreview(index);
        });

        option.addEventListener("click", (event) => {
            setDownloadPreview(index);

            const clickedGetButton = event.target.closest("a");
            const isMobileDownloadLayout = window.matchMedia("(max-width: 767px)").matches;

            if (isMobileDownloadLayout && !clickedGetButton) {
                return;
            }

            event.preventDefault();
            requestDownload(option);
        });
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
    const amenityTabsPrevious = lifestyleAmenitiesSection.querySelector("[data-amenity-tabs-prev]");
    const amenityTabsNext = lifestyleAmenitiesSection.querySelector("[data-amenity-tabs-next]");
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
        if (!amenityTabsWrap || !isMobileAmenitySlider()) {
            amenityTabsPrevious?.classList.add("is-disabled");
            amenityTabsNext?.classList.add("is-disabled");
            return;
        }

        const maxScroll = amenityTabsWrap.scrollWidth - amenityTabsWrap.clientWidth;
        const progress = maxScroll > 0 ? amenityTabsWrap.scrollLeft / maxScroll : 1;
        const progressWidth = maxScroll > 0 ? Math.max(24, Math.min(100, 24 + (progress * 76))) : 100;

        if (amenityTabProgress) {
            amenityTabProgress.style.width = `${progressWidth}%`;
        }

        amenityTabsPrevious?.classList.toggle("is-disabled", amenityTabsWrap.scrollLeft <= 12);
        amenityTabsNext?.classList.toggle("is-disabled", amenityTabsWrap.scrollLeft >= maxScroll - 12);
    };

    const requestAmenityTabProgressUpdate = () => {
        cancelAnimationFrame(amenityTabFrame);
        amenityTabFrame = requestAnimationFrame(updateAmenityTabProgress);
    };

    const scrollAmenityTabsByPage = (direction) => {
        if (!amenityTabsWrap) {
            return;
        }

        amenityTabsWrap.scrollBy({
            left: direction * amenityTabsWrap.clientWidth,
            behavior: "smooth"
        });
    };

    const scrollAmenityTabIntoLeadPosition = (tab, direction = 1) => {
        if (!amenityTabsWrap || !tab || !isMobileAmenitySlider()) {
            return;
        }

        const maxScroll = amenityTabsWrap.scrollWidth - amenityTabsWrap.clientWidth;
        const leadPosition = tab.offsetLeft;
        const tailPosition = tab.offsetLeft + tab.offsetWidth - amenityTabsWrap.clientWidth;
        const targetLeft = Math.max(0, Math.min(direction < 0 ? tailPosition : leadPosition, maxScroll));

        amenityTabsWrap.scrollTo({
            left: targetLeft,
            behavior: "smooth"
        });
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
        const selectedIndex = Array.from(amenityTabs).findIndex((tab) => tab.dataset.amenityTab === key);
        const activeIndex = Array.from(amenityTabs).findIndex((tab) => tab.classList.contains("is-active"));
        const tabDirection = selectedIndex < activeIndex ? -1 : 1;

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
            scrollAmenityTabIntoLeadPosition(activeTab, tabDirection);
        }

        if (amenityGrid) {
            amenityGrid.scrollTo({ left: 0, behavior: isMobileAmenitySlider() ? "smooth" : "auto" });
        }

        requestAmenitySliderUpdate();
        requestAmenityTabProgressUpdate();
    };

    const getAmenityTabFromHash = () => {
        const match = window.location.hash.match(/^#amenities-(all|wellness|recreation|security)$/);
        return match ? match[1] : "";
    };

    const applyAmenityHash = () => {
        const amenityTab = getAmenityTabFromHash();

        if (!amenityTab) {
            return;
        }

        setAmenityTab(amenityTab);
        lifestyleAmenitiesSection.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    amenityTabs.forEach((tab) => {
        tab.addEventListener("click", () => setAmenityTab(tab.dataset.amenityTab));
    });

    document.querySelectorAll('a[href^="#amenities-"]').forEach((link) => {
        link.addEventListener("click", () => {
            const amenityTab = link.getAttribute("href").replace("#amenities-", "");

            if (Array.from(amenityTabs).some((tab) => tab.dataset.amenityTab === amenityTab)) {
                setAmenityTab(amenityTab);
                setTimeout(() => lifestyleAmenitiesSection.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
            }
        });
    });

    amenityCards.forEach((card) => {
        const label = card.querySelector(".lifestyle-amenity-caption span")?.textContent.trim() || "Amenity image";

        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `${label} - open image preview`);
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
        amenityTabsPrevious?.addEventListener("click", () => scrollAmenityTabsByPage(-1));
        amenityTabsNext?.addEventListener("click", () => scrollAmenityTabsByPage(1));
        window.addEventListener("resize", requestAmenityTabProgressUpdate);
        requestAmenityTabProgressUpdate();
    }

    applyAmenityHash();
    window.addEventListener("hashchange", applyAmenityHash);
}

// Buyer testimonials: slider progress fill.
const buyerAppreciationSection = document.querySelector(".buyer-appreciation-section");

if (buyerAppreciationSection) {
    const testimonialSlider = buyerAppreciationSection.querySelector(".buyer-testimonials-slider");
    const testimonialProgress = buyerAppreciationSection.querySelector(".buyer-testimonials-progress span");
    let testimonialFrame = 0;
    let testimonialPointerDown = false;
    let testimonialDragActive = false;
    let testimonialStartX = 0;
    let testimonialStartY = 0;
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

        testimonialSlider.addEventListener("pointerdown", (event) => {
            if (event.button !== 0) {
                return;
            }

            testimonialPointerDown = true;
            testimonialDragActive = false;
            testimonialStartX = event.clientX;
            testimonialStartY = event.clientY;
            testimonialStartScroll = testimonialSlider.scrollLeft;
        });

        testimonialSlider.addEventListener("pointermove", (event) => {
            if (!testimonialPointerDown) {
                return;
            }

            const distance = event.clientX - testimonialStartX;
            const verticalDistance = event.clientY - testimonialStartY;

            if (!testimonialDragActive) {
                if (Math.abs(distance) < 6 && Math.abs(verticalDistance) < 6) {
                    return;
                }

                if (Math.abs(verticalDistance) > Math.abs(distance)) {
                    testimonialPointerDown = false;
                    return;
                }

                testimonialDragActive = true;
                testimonialSlider.classList.add("is-dragging");
                testimonialSlider.setPointerCapture(event.pointerId);
            }

            event.preventDefault();
            testimonialSlider.scrollLeft = testimonialStartScroll - distance;
            requestTestimonialProgressUpdate();
        }, { passive: false });

        const stopTestimonialDrag = (event) => {
            if (!testimonialPointerDown) {
                return;
            }

            testimonialPointerDown = false;
            testimonialDragActive = false;
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
    const faqTabsPrevious = faqSection.querySelector("[data-faq-tabs-prev]");
    const faqTabsNext = faqSection.querySelector("[data-faq-tabs-next]");
    const faqAnimationDuration = 380;
    let faqTabProgressFrame = 0;

    const isMobileFaqTabs = () => window.matchMedia("(max-width: 991px)").matches;

    const getCenteredFaqTab = () => {
        if (!faqTabsWrap || !isMobileFaqTabs()) {
            return null;
        }

        const wrapRect = faqTabsWrap.getBoundingClientRect();
        const wrapCenter = wrapRect.left + (wrapRect.width / 2);
        let centeredTab = null;
        let closestDistance = Infinity;

        faqTabs.forEach((tab) => {
            const tabRect = tab.getBoundingClientRect();
            const tabCenter = tabRect.left + (tabRect.width / 2);
            const distance = Math.abs(tabCenter - wrapCenter);

            if (distance < closestDistance) {
                closestDistance = distance;
                centeredTab = tab;
            }
        });

        return centeredTab;
    };

    const updateFaqTabProgress = () => {
        if (!faqTabsWrap || !isMobileFaqTabs()) {
            faqTabsPrevious?.classList.add("is-disabled");
            faqTabsNext?.classList.add("is-disabled");
            return;
        }

        const maxScroll = faqTabsWrap.scrollWidth - faqTabsWrap.clientWidth;
        const progress = maxScroll > 0 ? faqTabsWrap.scrollLeft / maxScroll : 1;
        const progressWidth = maxScroll > 0 ? Math.max(24, Math.min(100, 24 + (progress * 76))) : 100;

        if (faqTabProgress) {
            faqTabProgress.style.width = `${progressWidth}%`;
        }

        faqTabsPrevious?.classList.toggle("is-disabled", faqTabsWrap.scrollLeft <= 12);
        faqTabsNext?.classList.toggle("is-disabled", faqTabsWrap.scrollLeft >= maxScroll - 12);

        const centeredTab = getCenteredFaqTab();
        const activeTab = faqSection.querySelector(".faq-tab.is-active");

        if (centeredTab && centeredTab !== activeTab) {
            setFaqPanel(centeredTab.dataset.faqTab);
        }
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

    const scrollFaqTabsByPage = (direction) => {
        if (!faqTabsWrap) {
            return;
        }

        faqTabsWrap.scrollBy({
            left: direction * faqTabsWrap.clientWidth,
            behavior: "smooth"
        });
    };

    const scrollFaqTabIntoLeadPosition = (tab) => {
        if (!faqTabsWrap || !tab || !isMobileFaqTabs()) {
            return;
        }

        const maxScroll = faqTabsWrap.scrollWidth - faqTabsWrap.clientWidth;
        const targetLeft = Math.min(tab.offsetLeft, maxScroll);

        faqTabsWrap.scrollTo({
            left: targetLeft,
            behavior: "smooth"
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
                scrollFaqTabIntoLeadPosition(tab);
                requestFaqTabProgressUpdate();
            }
        });
    });

    if (faqTabsWrap) {
        faqTabsWrap.addEventListener("scroll", requestFaqTabProgressUpdate, { passive: true });
        faqTabsPrevious?.addEventListener("click", () => scrollFaqTabsByPage(-1));
        faqTabsNext?.addEventListener("click", () => scrollFaqTabsByPage(1));
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

// Lead forms: validate names, emails, and keep mobile numbers to 10 digits.
const leadForms = document.querySelectorAll(".booking-enquiry-form, .pricing-unlock-form, .site-visit-form, .header-contact-form");
const leadPhoneInputs = document.querySelectorAll(
    '.booking-enquiry-form input[type="tel"], .pricing-unlock-form input[type="tel"], .site-visit-form input[type="tel"], .header-contact-form input[type="tel"]'
);
const leadNameInputs = document.querySelectorAll(
    '.booking-enquiry-form input[name*="name"], .pricing-unlock-form input[name="name"], .site-visit-form input[name="name"], .header-contact-form input[name="name"]'
);
const leadEmailInputs = document.querySelectorAll(
    '.booking-enquiry-form input[type="email"], .pricing-unlock-form input[type="email"], .site-visit-form input[type="email"], .header-contact-form input[type="email"]'
);
const normalizeLeadPhone = (value) => {
    const digits = value.replace(/\D/g, "");
    const withoutCountryCode = digits.length > 10 && digits.startsWith("91")
        ? digits.slice(2)
        : digits;

    return withoutCountryCode.slice(0, 10);
};

leadPhoneInputs.forEach((input) => {
    input.setAttribute("maxlength", "10");
    input.setAttribute("inputmode", "numeric");
    input.setAttribute("pattern", "[0-9]{10}");

    input.addEventListener("input", () => {
        const digitsOnly = normalizeLeadPhone(input.value);

        if (input.value !== digitsOnly) {
            input.value = digitsOnly;
        }

        input.setCustomValidity(digitsOnly.length === 10 || digitsOnly.length === 0
            ? ""
            : "Please enter a 10 digit mobile number.");
    });
});

leadNameInputs.forEach((input) => {
    input.addEventListener("input", () => {
        const cleanedName = input.value.replace(/[^A-Za-z .'-]/g, "").replace(/\s{2,}/g, " ");

        if (input.value !== cleanedName) {
            input.value = cleanedName;
        }

        const isValidName = /^[A-Za-z][A-Za-z .'-]{1,}$/.test(cleanedName.trim());
        input.setCustomValidity(isValidName || cleanedName.trim().length === 0
            ? ""
            : "Please enter a valid name.");
    });
});

leadEmailInputs.forEach((input) => {
    input.addEventListener("input", () => {
        input.setCustomValidity(input.validity.valid || input.value.trim().length === 0
            ? ""
            : "Please enter a valid email address.");
    });
});

leadForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
        const phoneInput = form.querySelector('input[type="tel"]');
        const nameInput = form.querySelector('input[name*="name"]');
        const emailInput = form.querySelector('input[type="email"]');

        if (phoneInput) {
            phoneInput.value = normalizeLeadPhone(phoneInput.value);
            phoneInput.setCustomValidity(/^[0-9]{10}$/.test(phoneInput.value)
                ? ""
                : "Please enter a 10 digit mobile number.");
        }

        if (nameInput) {
            nameInput.value = nameInput.value.trim().replace(/\s{2,}/g, " ");
            nameInput.setCustomValidity(/^[A-Za-z][A-Za-z .'-]{1,}$/.test(nameInput.value)
                ? ""
                : "Please enter a valid name.");
        }

        if (emailInput) {
            emailInput.setCustomValidity(emailInput.validity.valid ? "" : "Please enter a valid email address.");
        }

        if (!form.checkValidity()) {
            event.preventDefault();
            event.stopImmediatePropagation();
            form.reportValidity();
        }
    }, true);
});

document.querySelectorAll(".booking-enquiry-form, .site-visit-form, .header-contact-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        const intent = form.classList.contains("booking-enquiry-form")
            ? "Current price and availability"
            : "Site visit booking";

        window.AmeliaLeadSubmission.send(form, intent);
    });
});

// Mobile bottom CTA: hide after inactivity and wake again on user movement.
(() => {
    const mobileCta = document.querySelector(".mobile-initial-cta");
    const mobileCtaIdleDelay = 2400;
    let mobileCtaIdleTimer = 0;

    if (!mobileCta) {
        return;
    }

    const isMobileCtaViewport = () => window.matchMedia("(max-width: 760px)").matches;
    const setMobileCtaIdle = (shouldHide) => {
        document.body.classList.toggle("is-mobile-cta-idle", shouldHide && isMobileCtaViewport());
    };
    const scheduleMobileCtaIdle = () => {
        window.clearTimeout(mobileCtaIdleTimer);

        if (!isMobileCtaViewport()) {
            setMobileCtaIdle(false);
            return;
        }

        mobileCtaIdleTimer = window.setTimeout(() => setMobileCtaIdle(true), mobileCtaIdleDelay);
    };
    const wakeMobileCta = () => {
        setMobileCtaIdle(false);
        scheduleMobileCtaIdle();
    };

    window.addEventListener("scroll", wakeMobileCta, { passive: true });
    window.addEventListener("touchmove", wakeMobileCta, { passive: true });
    window.addEventListener("wheel", wakeMobileCta, { passive: true });
    window.addEventListener("resize", wakeMobileCta);
    mobileCta.addEventListener("pointerdown", wakeMobileCta, { passive: true });

    scheduleMobileCtaIdle();
})();

// Scroll reveal: toggles .is-visible for sections that animate when entering the viewport.
const deferredBackgroundSection = document.querySelector(".differentiation-section");

if (deferredBackgroundSection) {
    if ("IntersectionObserver" in window) {
        const backgroundObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                deferredBackgroundSection.classList.add("is-background-loaded");
                backgroundObserver.disconnect();
            }
        }, { rootMargin: "480px 0px" });

        backgroundObserver.observe(deferredBackgroundSection);
    } else {
        deferredBackgroundSection.classList.add("is-background-loaded");
    }
}

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
});
