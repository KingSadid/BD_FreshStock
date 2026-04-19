// gsap-integration.js

window.GSAPIntegration = (function () {

    const TIMING = {
        FAST: 0.2,
        NORMAL: 0.35,
        SLOW: 0.5,
        SLOWER: 0.65,
        SLOWEST: 0.8,
        STAGGER_TIGHT: 0.04,
        STAGGER_NORMAL: 0.08,
        STAGGER_LOOSE: 0.12,
        DELAY_SHORT: 0.1,
        DELAY_MEDIUM: 0.25,
        DELAY_LONG: 0.4,
        NUMBER_ANIM_DURATION: 1.5,
        NUMBER_ANIM_DELAY: 0.3
    };

    const EASING = {
        IN_OUT: 'power3.inOut',
        OUT: 'power2.out',
        POWER3_OUT: 'power3.out',
        BOUNCE_SOFT: 'back.out(1.5)',
        BOUNCE_STRONG: 'back.out(2)'
    };

    function buildFadeSlideConfig(axis, distance, duration, stagger, ease, delay) {
        const fromProps = { opacity: 0 };
        const toProps = { opacity: 1, duration, stagger, ease, delay };

        if (axis === 'y') {
            fromProps.y = distance;
            toProps.y = 0;
        } else if (axis === 'x') {
            fromProps.x = distance;
            toProps.x = 0;
        }

        return { fromProps, toProps };
    }

    function animateFromTo(targets, axis, distance, duration, stagger, ease, delay) {
        if (!targets || targets.length === 0) return;
        const { fromProps, toProps } = buildFadeSlideConfig(axis, distance, duration, stagger, ease, delay);
        gsap.fromTo(targets, fromProps, toProps);
    }

    function bindJellyBehavior(element) {
        if (!element || element._jellyBound) return;

        element._jellyBound = true;
        element.classList.add('jelly-enabled');

        element.addEventListener('mouseenter', () =>
            gsap.to(element, { scale: 1.02, duration: 0.3, ease: 'back.out(2)' })
        );
        element.addEventListener('mouseleave', () =>
            gsap.to(element, { scale: 1, duration: 0.3, ease: EASING.OUT })
        );
        element.addEventListener('mousedown', () =>
            gsap.to(element, { scale: 0.95, duration: 0.1, ease: 'power2.in' })
        );
        element.addEventListener('mouseup', () =>
            gsap.to(element, { scale: 1.02, duration: 0.3, ease: 'back.out(3)' })
        );
    }

    function bindKpiIconHover(icon) {
        if (!icon || icon._hoverBound) return;
        icon._hoverBound = true;

        icon.addEventListener('mouseenter', () =>
            gsap.to(icon, { rotate: 14, scale: 1.2, duration: 0.25, ease: 'back.out(2)' })
        );
        icon.addEventListener('mouseleave', () =>
            gsap.to(icon, { rotate: 0, scale: 1, duration: 0.3, ease: EASING.OUT })
        );
    }

    function bindSidebarItemClickBounce(listItem) {
        if (!listItem || listItem._hoverBound) return;
        listItem._hoverBound = true;

        listItem.addEventListener('click', () => {
            const icon = listItem.querySelector('i');
            if (!icon) return;

            gsap.timeline()
                .to(icon, { scale: 0.6, rotate: -15, duration: 0.12, ease: 'power2.in' })
                .to(icon, { scale: 1.2, rotate: 5, duration: 0.2, ease: 'back.out(3)' })
                .to(icon, { scale: 1, rotate: 0, duration: 0.15, ease: EASING.OUT });
        });
    }

    function initNotificationPulse() {
        if (window._notifPulseInitialized) return;
        window._notifPulseInitialized = true;
        gsap.to('.notif-dot', {
            scale: 1.2,
            duration: 0.9,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }

    function initGlobalHoverInteractions() {
        document.querySelectorAll('.btn-primary, .btn-outline, .btn-danger-outline')
            .forEach(button => bindJellyBehavior(button));

        document.querySelectorAll('.product-card, .supplier-card, .user-card')
            .forEach(card => bindJellyBehavior(card));

        document.querySelectorAll('.kpi-icon')
            .forEach(icon => bindKpiIconHover(icon));

        document.querySelectorAll('.sidebar-menu li:not(.menu-label)')
            .forEach(item => bindSidebarItemClickBounce(item));

        initNotificationPulse();
    }

    function updateSidebarActiveState(targetScreenId) {
        document.querySelectorAll('.sidebar-menu li').forEach(item => {
            const navigationTarget = item.getAttribute('data-navigate');
            item.classList.toggle('active', navigationTarget === targetScreenId);
        });
    }

    function applyScreenTransition(timeline, currentScreen, nextScreen, loadingOverlay) {
        if (currentScreen) {
            currentScreen.classList.remove('active');
            currentScreen.style.pointerEvents = 'none';
            gsap.set(currentScreen, { opacity: 0, y: 0 });
        }

        nextScreen.classList.add('active');
        nextScreen.style.pointerEvents = 'auto';

        const contentArea = nextScreen.querySelector('.content-area');
        if (contentArea) contentArea.scrollTop = 0;

        timeline.to(loadingOverlay, { opacity: 0, duration: TIMING.NORMAL, ease: 'none' }, 0);
        timeline.to(nextScreen, { opacity: 1, duration: TIMING.NORMAL, ease: EASING.IN_OUT }, 0);
    }

    function applyContentEntranceAnimation(timeline, nextScreen) {
        const contentChildren = nextScreen.querySelectorAll('.content-area > *:not(.detail-card)');
        const sidebarItems = nextScreen.querySelectorAll('.sidebar-menu li:not(.menu-label)');
        const topBarElements = nextScreen.querySelectorAll('.top-bar-left, .top-bar-right');

        const entranceConfig = {
            duration: TIMING.NORMAL,
            stagger: 0.02,
            ease: EASING.POWER3_OUT
        };

        if (contentChildren.length > 0) {
            timeline.fromTo(
                contentChildren,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, ...entranceConfig },
                0.05
            );
        }

        if (sidebarItems.length > 0) {
            timeline.fromTo(
                sidebarItems,
                { opacity: 0, x: -10 },
                { opacity: 1, x: 0, ...entranceConfig },
                0.05
            );
        }

        if (topBarElements.length > 0) {
            timeline.fromTo(
                topBarElements,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, ...entranceConfig },
                0.05
            );
        }
    }

    function navigateTo(screenId, sourceElement) {
        if (!screenId) {
            console.warn('navigateTo: screenId is required');
            return;
        }

        if (AppState.isNavigating || screenId === AppState.currentScreen) return;

        const currentScreen = document.getElementById(AppState.currentScreen);
        const nextScreen = document.getElementById(screenId);
        const loadingOverlay = document.getElementById('loading-overlay');

        if (!nextScreen) {
            console.warn(`navigateTo: screen "${screenId}" not found`);
            return;
        }

        if (!loadingOverlay) {
            console.warn('navigateTo: loading overlay element not found');
            return;
        }

        AppState.isNavigating = true;
        gsap.killTweensOf('*');

        let flipState;
        if (sourceElement && sourceElement.classList.contains('product-card')) {
            try {
                flipState = Flip.getState(sourceElement);
            } catch (error) {
                console.warn('navigateTo: Flip.getState failed', error);
            }
        }

        updateSidebarActiveState(screenId);

        gsap.set(loadingOverlay, { opacity: 1, display: 'flex' });
        gsap.set(nextScreen, { opacity: 0 });

        const safetyTimeout = setTimeout(() => {
            AppState.isNavigating = false;
            gsap.set(loadingOverlay, { opacity: 0, display: 'none' });
            nextScreen.classList.add('active');
            nextScreen.style.opacity = '1';

            if (currentScreen) {
                currentScreen.classList.remove('active');
                currentScreen.style.pointerEvents = 'none';
            }

            AppState.currentScreen = screenId;
        }, 3000);

        const navigationTimeline = gsap.timeline({
            onComplete: () => {
                clearTimeout(safetyTimeout);
                AppState.isNavigating = false;
                gsap.set(loadingOverlay, { display: 'none' });
            },
            onError: () => {
                clearTimeout(safetyTimeout);
                AppState.isNavigating = false;
                gsap.set(loadingOverlay, { display: 'none' });
                console.error('navigateTo: timeline encountered an error');
            }
        });

        navigationTimeline.add(() => {
            applyScreenTransition(navigationTimeline, currentScreen, nextScreen, loadingOverlay);
            AppState.currentScreen = screenId;

            if (typeof window.triggerDataLoad === 'function') {
                window.triggerDataLoad(screenId);
            }
        });

        if (flipState) {
            const detailCard = nextScreen.querySelector('.detail-card');
            if (detailCard) {
                try {
                    navigationTimeline.add(
                        Flip.from(flipState, {
                            targets: detailCard,
                            duration: TIMING.SLOWER,
                            ease: EASING.POWER3_OUT,
                            absolute: true
                        }),
                        0
                    );
                } catch (error) {
                    console.warn('navigateTo: Flip.from failed', error);
                }
            }
        }

        if (screenId === 'screen-login') {
            navigationTimeline.add(() => animateLoginEntrance(), 0.1);
            return;
        }

        applyContentEntranceAnimation(navigationTimeline, nextScreen);
    }

    function animateLoginEntrance() {
        const leftPanel = document.querySelector('.login-left');
        const rightPanel = document.querySelector('.login-right');

        if (!leftPanel || !rightPanel) {
            console.warn('animateLoginEntrance: login panels not found');
            return;
        }

        gsap.fromTo(leftPanel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
        gsap.fromTo(rightPanel, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });

        const heroElements = document.querySelectorAll('.logo-big h1, .hero-subtitle, .hero-features .hf');
        gsap.fromTo(
            heroElements,
            { opacity: 0, x: -20 },
            { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: EASING.OUT, delay: 0.15 }
        );

        const floatingCards = document.querySelectorAll('.float-card');
        gsap.fromTo(
            floatingCards,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: EASING.BOUNCE_STRONG, delay: 0.35 }
        );

        const formElements = document.querySelectorAll(
            '.login-form-header, .login-form .form-group, .form-options, .login-form .btn-primary, .login-divider, .social-login, .login-footer'
        );
        gsap.fromTo(
            formElements,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: EASING.POWER3_OUT, delay: 0.2 }
        );
    }

    function animateWelcomeBanner(container) {
        const banner = container.querySelector('.welcome-banner');
        if (!banner) return;

        gsap.fromTo(
            banner,
            { opacity: 0, scale: 0.97, y: 16 },
            { opacity: 1, scale: 1, y: 0, duration: TIMING.SLOWEST, ease: EASING.POWER3_OUT, delay: TIMING.DELAY_SHORT }
        );

        const illustration = banner.querySelector('.wb-illustration');
        if (illustration) {
            gsap.fromTo(
                illustration,
                { scale: 0.6, opacity: 0, rotate: -20 },
                { scale: 1, opacity: 1, rotate: 0, duration: TIMING.SLOWEST, ease: 'back.out(1.7)', delay: TIMING.DELAY_MEDIUM }
            );
        }
    }

    function animateKpiCards(container) {
        const kpiCards = container.querySelectorAll('.kpi-card');
        gsap.fromTo(
            kpiCards,
            { opacity: 0, y: 35, scale: 0.92 },
            { opacity: 1, y: 0, scale: 1, duration: TIMING.SLOWER, stagger: TIMING.STAGGER_LOOSE, ease: EASING.BOUNCE_SOFT, delay: TIMING.DELAY_MEDIUM }
        );

        const kpiIcons = container.querySelectorAll('.kpi-icon');
        gsap.fromTo(
            kpiIcons,
            { scale: 0, opacity: 0, rotate: -30 },
            { scale: 1, opacity: 1, rotate: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.BOUNCE_STRONG, delay: TIMING.SLOW }
        );

        const kpiTrends = container.querySelectorAll('.kpi-trend');
        gsap.fromTo(
            kpiTrends,
            { opacity: 0, x: 10 },
            {
                opacity: 1,
                x: 0,
                duration: TIMING.NORMAL,
                stagger: TIMING.STAGGER_NORMAL,
                ease: EASING.OUT,
                delay: TIMING.SLOWER + TIMING.STAGGER_NORMAL
            }
        );
    }

    function animateDonutSegments(container) {
        const segments = container.querySelectorAll('.donut-seg');

        segments.forEach((segment, index) => {
            let totalLength = 200;

            try {
                if (typeof segment.getTotalLength === 'function') {
                    totalLength = segment.getTotalLength();
                }
            } catch (error) {
                console.warn('animateDonutSegments: getTotalLength failed', error);
            }

            gsap.set(segment, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
            gsap.to(segment, {
                strokeDashoffset: 0,
                duration: TIMING.SLOWEST,
                ease: EASING.IN_OUT,
                delay: TIMING.SLOWER + index * TIMING.STAGGER_NORMAL
            });
        });
    }

    function animateDashboardExt(container) {
        if (!container) {
            console.warn('animateDashboardExt: container is required');
            return;
        }

        animateWelcomeBanner(container);
        animateKpiCards(container);
        animateDonutSegments(container);
    }

    function animateExpiryItems(container) {
        const expiryItems = container.querySelectorAll('.expiry-item');
        animateFromTo(expiryItems, 'x', -20, TIMING.NORMAL, TIMING.STAGGER_NORMAL, EASING.OUT, TIMING.DELAY_SHORT);
    }

    function animateActivityItems(container) {
        const activityItems = container.querySelectorAll('.activity-item');
        animateFromTo(activityItems, 'x', 18, TIMING.NORMAL, TIMING.STAGGER_NORMAL, EASING.OUT, TIMING.DELAY_SHORT);
    }

    function animateDynamicDashboardItems(container) {
        if (!container) {
            console.warn('animateDynamicDashboardItems: container is required');
            return;
        }

        animateExpiryItems(container);
        animateActivityItems(container);
    }

    function animateTableRows(container) {
        const tableRows = container.querySelectorAll('.data-table tbody tr');
        animateFromTo(tableRows, 'x', -20, TIMING.NORMAL, TIMING.STAGGER_TIGHT, EASING.OUT, TIMING.DELAY_SHORT);
    }

    function animateProductCards(container) {
        if (!container) {
            console.warn('animateProductCards: container is required');
            return;
        }

        const productCards = container.querySelectorAll('.product-card');
        gsap.fromTo(
            productCards,
            { opacity: 0, y: 32, scale: 0.94 },
            { opacity: 1, y: 0, scale: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: 'back.out(1.3)', delay: TIMING.DELAY_SHORT }
        );

        const categoryChips = container.querySelectorAll('.chip');
        gsap.fromTo(
            categoryChips,
            { opacity: 0, scale: 0.85 },
            { opacity: 1, scale: 1, duration: TIMING.FAST, stagger: TIMING.STAGGER_TIGHT, ease: EASING.BOUNCE_STRONG, delay: TIMING.STAGGER_TIGHT }
        );

        initGlobalHoverInteractions();
    }

    function animateDetailEntrance(container) {
        if (!container) {
            console.warn('animateDetailEntrance: container is required');
            return;
        }

        const heroVisual = container.querySelector('.detail-header-visual');
        if (heroVisual) {
            gsap.fromTo(
                heroVisual,
                { opacity: 0, scale: 1.05 },
                { opacity: 1, scale: 1, duration: TIMING.SLOWEST, ease: EASING.OUT, delay: TIMING.DELAY_SHORT }
            );
        }

        const detailSidebar = container.querySelector('.detail-sidebar');
        if (detailSidebar) {
            gsap.fromTo(
                detailSidebar.children,
                { opacity: 0, x: 20 },
                { opacity: 1, x: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.OUT, delay: TIMING.DELAY_MEDIUM }
            );
        }

        animateTableRows(container);
    }

    function animateAlerts(container) {
        if (!container) {
            console.warn('animateAlerts: container is required');
            return;
        }

        const summaryCards = container.querySelectorAll('.alert-sum-card');
        gsap.fromTo(
            summaryCards,
            { opacity: 0, scale: 0.88, y: 16 },
            { opacity: 1, scale: 1, y: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: 'back.out(1.8)', delay: TIMING.DELAY_SHORT }
        );

        const alertItems = container.querySelectorAll('.alert-item');
        gsap.fromTo(
            alertItems,
            { opacity: 0, x: -36, scale: 0.98 },
            { opacity: 1, x: 0, scale: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: EASING.POWER3_OUT, delay: TIMING.SLOW }
        );

        initGlobalHoverInteractions();
    }

    function animatePepsBanner(container) {
        if (!container) {
            console.warn('animatePepsBanner: container is required');
            return;
        }

        const pepsBanner = container.querySelector('.peps-info-banner');
        if (!pepsBanner) return;

        gsap.fromTo(
            pepsBanner,
            { opacity: 0, y: -16, scale: 0.97 },
            { opacity: 1, y: 0, scale: 1, duration: TIMING.NORMAL, ease: EASING.OUT, delay: TIMING.DELAY_SHORT }
        );
    }

    function animateScannerEntrance(container) {
        if (!container) {
            console.warn('animateScannerEntrance: container is required');
            return;
        }

        const scannerViewport = container.querySelector('.scanner-viewport');
        if (scannerViewport) {
            gsap.fromTo(
                scannerViewport,
                { opacity: 0, scale: 0.9 },
                { opacity: 1, scale: 1, duration: TIMING.SLOWER, ease: 'back.out(1.4)', delay: TIMING.DELAY_MEDIUM }
            );
        }

        const lotFormGroups = container.querySelectorAll('.lot-form .form-group');
        animateFromTo(lotFormGroups, 'y', 14, TIMING.NORMAL, TIMING.STAGGER_TIGHT, EASING.OUT, TIMING.SLOW);
    }

    function animateSupplierCards(container) {
        if (!container) {
            console.warn('animateSupplierCards: container is required');
            return;
        }

        const supplierCards = container.querySelectorAll('.supplier-card');
        gsap.fromTo(
            supplierCards,
            { opacity: 0, scale: 0.9, y: 24 },
            { opacity: 1, scale: 1, y: 0, duration: TIMING.SLOWER, stagger: TIMING.STAGGER_LOOSE, ease: EASING.BOUNCE_SOFT, delay: TIMING.DELAY_SHORT }
        );

        const supplierAvatars = container.querySelectorAll('.sc-avatar');
        gsap.fromTo(
            supplierAvatars,
            { scale: 0.5, opacity: 0 },
            { scale: 1, opacity: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.BOUNCE_STRONG, delay: TIMING.SLOW }
        );

        initGlobalHoverInteractions();
    }

    return {
        initGlobalHoverInteractions,
        navigateTo,
        applyJellyInteraction: bindJellyBehavior,
        animateLoginEntrance,
        animateDashboardExt,
        animateDynamicDashboardItems,
        animateProductCards,
        animateDetailEntrance,
        animateAlerts,
        animateTableRows,
        animatePepsBanner,
        animateScannerEntrance,
        animateSupplierCards
    };
})();