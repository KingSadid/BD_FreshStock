const AnimationConfiguration = (function () {
    const TIMING_CONSTANTS = Object.freeze({
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
        SAFETY_TIMEOUT_DURATION: 3000
    });

    const EASING_CURVES = Object.freeze({
        IN_OUT: 'power3.inOut',
        OUT: 'power2.out',
        POWER3_OUT: 'power3.out',
        SOFT_BOUNCE: 'back.out(1.5)',
        STRONG_BOUNCE: 'back.out(2)',
        GENTLE_BOUNCE: 'back.out(1.3)',
        ELASTIC_BOUNCE: 'back.out(1.7)',
        SPRING_BOUNCE: 'back.out(1.4)',
        INTERACTIVE_BOUNCE: 'back.out(1.8)',
        SINE_IN_OUT: 'sine.inOut',
        POWER2_IN: 'power2.in'
    });

    return {
        TIMING: TIMING_CONSTANTS,
        EASING: EASING_CURVES
    };
})();

const DOMValidator = (function () {
    function isValidElement(element) {
        return element instanceof Element;
    }

    function isNonEmptyNodeList(nodeList) {
        return nodeList && nodeList.length > 0;
    }

    function validateStringParameter(value, parameterName) {
        if (typeof value !== 'string' || value.trim().length === 0) {
            console.warn(`${parameterName} must be a non-empty string`);
            return false;
        }
        return true;
    }

    return {
        isValidElement,
        isNonEmptyNodeList,
        validateStringParameter
    };
})();

const InteractionRegistry = (function () {
    const registeredElements = new WeakSet();

    function isRegistered(element) {
        return registeredElements.has(element);
    }

    function register(element) {
        if (DOMValidator.isValidElement(element)) {
            registeredElements.add(element);
            return true;
        }
        return false;
    }

    return { isRegistered, register };
})();

const AnimationBuilders = (function () {
    function createFadeSlideConfiguration(axis, distance, duration, stagger, ease, delay) {
        const initialProperties = { opacity: 0 };
        const targetProperties = {
            opacity: 1,
            duration,
            stagger,
            ease,
            delay
        };

        if (axis === 'vertical') {
            initialProperties.y = distance;
            targetProperties.y = 0;
        } else if (axis === 'horizontal') {
            initialProperties.x = distance;
            targetProperties.x = 0;
        }

        return { initialProperties, targetProperties };
    }

    function executeFadeSlideAnimation(targetElements, axis, distance, duration, stagger, ease, delay) {
        if (!DOMValidator.isNonEmptyNodeList(targetElements)) return;

        const { initialProperties, targetProperties } = createFadeSlideConfiguration(
            axis, distance, duration, stagger, ease, delay
        );

        gsap.fromTo(targetElements, initialProperties, targetProperties);
    }

    return {
        createFadeSlideConfiguration,
        executeFadeSlideAnimation
    };
})();

const InteractionHandlers = (function () {
    const { EASING } = AnimationConfiguration;

    function attachElasticInteraction(interactiveElement) {
        if (!DOMValidator.isValidElement(interactiveElement) || InteractionRegistry.isRegistered(interactiveElement)) return;

        InteractionRegistry.register(interactiveElement);
        interactiveElement.classList.add('elastic-interaction-enabled');

        interactiveElement.addEventListener('mouseenter', () => {
            gsap.to(interactiveElement, { scale: 1.02, duration: 0.3, ease: EASING.STRONG_BOUNCE });
        });

        interactiveElement.addEventListener('mouseleave', () => {
            gsap.to(interactiveElement, { scale: 1, duration: 0.3, ease: EASING.OUT });
        });

        interactiveElement.addEventListener('mousedown', () => {
            gsap.to(interactiveElement, { scale: 0.95, duration: 0.1, ease: EASING.POWER2_IN });
        });

        interactiveElement.addEventListener('mouseup', () => {
            gsap.to(interactiveElement, { scale: 1.02, duration: 0.3, ease: 'back.out(3)' });
        });
    }

    function attachKeyPerformanceIndicatorIconInteraction(iconElement) {
        if (!DOMValidator.isValidElement(iconElement) || InteractionRegistry.isRegistered(iconElement)) return;

        InteractionRegistry.register(iconElement);

        iconElement.addEventListener('mouseenter', () => {
            gsap.to(iconElement, { rotate: 14, scale: 1.2, duration: 0.25, ease: EASING.STRONG_BOUNCE });
        });

        iconElement.addEventListener('mouseleave', () => {
            gsap.to(iconElement, { rotate: 0, scale: 1, duration: 0.3, ease: EASING.OUT });
        });
    }

    function attachSidebarItemClickAnimation(listItemElement) {
        if (!DOMValidator.isValidElement(listItemElement) || InteractionRegistry.isRegistered(listItemElement)) return;

        InteractionRegistry.register(listItemElement);

        listItemElement.addEventListener('click', () => {
            const iconElement = listItemElement.querySelector('i');
            if (!iconElement) return;

            const clickAnimationTimeline = gsap.timeline();
            clickAnimationTimeline
                .to(iconElement, { scale: 0.6, rotate: -15, duration: 0.12, ease: EASING.POWER2_IN })
                .to(iconElement, { scale: 1.2, rotate: 5, duration: 0.2, ease: 'back.out(3)' })
                .to(iconElement, { scale: 1, rotate: 0, duration: 0.15, ease: EASING.OUT });
        });
    }

    function initializeNotificationPulseAnimation() {
        if (window.notificationPulseInitialized) return;
        window.notificationPulseInitialized = true;

        gsap.to('.notification-indicator-dot', {
            scale: 1.2,
            duration: 0.9,
            repeat: -1,
            yoyo: true,
            ease: EASING.SINE_IN_OUT
        });
    }

    function initializeGlobalHoverInteractions() {
        document.querySelectorAll('.btn-primary, .btn-outline, .btn-danger-outline')
            .forEach(attachElasticInteraction);

        document.querySelectorAll('.product-card, .supplier-card, .user-card')
            .forEach(attachElasticInteraction);

        document.querySelectorAll('.kpi-icon')
            .forEach(attachKeyPerformanceIndicatorIconInteraction);

        document.querySelectorAll('.sidebar-menu li:not(.menu-label)')
            .forEach(attachSidebarItemClickAnimation);

        initializeNotificationPulseAnimation();
    }

    return {
        attachElasticInteraction,
        attachKeyPerformanceIndicatorIconInteraction,
        attachSidebarItemClickAnimation,
        initializeGlobalHoverInteractions
    };
})();

const NavigationAnimationController = (function () {
    const { TIMING, EASING } = AnimationConfiguration;

    function updateSidebarActiveIndicator(targetScreenIdentifier) {
        document.querySelectorAll('.sidebar-menu li').forEach(menuItem => {
            const isActive = menuItem.getAttribute('data-navigate') === targetScreenIdentifier;
            menuItem.classList.toggle('active', isActive);
        });
    }

    function executeScreenTransition(timelineInstance, currentScreenElement, nextScreenElement, loadingOverlayElement) {
        if (currentScreenElement) {
            currentScreenElement.classList.remove('active');
            currentScreenElement.style.pointerEvents = 'none';
            gsap.set(currentScreenElement, { opacity: 0, y: 0 });
        }

        nextScreenElement.classList.add('active');
        nextScreenElement.style.pointerEvents = 'auto';

        const contentContainer = nextScreenElement.querySelector('.content-area');
        if (contentContainer) contentContainer.scrollTop = 0;

        timelineInstance.to(loadingOverlayElement, { opacity: 0, duration: TIMING.NORMAL, ease: 'none' }, 0);
        timelineInstance.to(nextScreenElement, { opacity: 1, duration: TIMING.NORMAL, ease: EASING.IN_OUT }, 0);
    }

    function executeContentEntranceSequence(timelineInstance, targetScreenElement) {
        const entranceConfiguration = { duration: TIMING.NORMAL, stagger: TIMING.STAGGER_TIGHT, ease: EASING.POWER3_OUT };

        const contentChildren = targetScreenElement.querySelectorAll('.content-area > *:not(.detail-card)');
        if (DOMValidator.isNonEmptyNodeList(contentChildren)) {
            timelineInstance.fromTo(contentChildren, { opacity: 0, y: 15 }, { opacity: 1, y: 0, ...entranceConfiguration }, 0.05);
        }

        const sidebarItems = targetScreenElement.querySelectorAll('.sidebar-menu li:not(.menu-label)');
        if (DOMValidator.isNonEmptyNodeList(sidebarItems)) {
            timelineInstance.fromTo(sidebarItems, { opacity: 0, x: -10 }, { opacity: 1, x: 0, ...entranceConfiguration }, 0.05);
        }

        const topBarElements = targetScreenElement.querySelectorAll('.top-bar-left, .top-bar-right');
        if (DOMValidator.isNonEmptyNodeList(topBarElements)) {
            timelineInstance.fromTo(topBarElements, { opacity: 0, y: -10 }, { opacity: 1, y: 0, ...entranceConfiguration }, 0.05);
        }
    }

    return {
        updateSidebarActiveIndicator,
        executeScreenTransition,
        executeContentEntranceSequence
    };
})();

const NavigationStateManager = (function () {
    let isCurrentlyNavigating = false;
    let currentActiveScreen = 'screen-login';

    function isNavigating() { return isCurrentlyNavigating; }
    function setNavigatingStatus(status) { isCurrentlyNavigating = Boolean(status); }
    function getCurrentScreen() { return currentActiveScreen; }

    function setCurrentScreen(screenIdentifier) {
        if (DOMValidator.validateStringParameter(screenIdentifier, 'screenIdentifier')) {
            currentActiveScreen = screenIdentifier;
        }
    }

    return { isNavigating, setNavigatingStatus, getCurrentScreen, setCurrentScreen };
})();

const ScreenAnimationSequences = (function () {
    const { TIMING, EASING } = AnimationConfiguration;

    function executeLoginEntranceSequence() {
        const panels = [
            document.querySelector('.login-left'),
            document.querySelector('.login-right')
        ].filter(Boolean);

        if (panels.length) {
            gsap.fromTo(panels, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
        }

        const heroTextElements = document.querySelectorAll('.logo-big h1, .hero-subtitle, .hero-features .hf');
        gsap.fromTo(heroTextElements, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: EASING.OUT, delay: 0.15 });

        const floatingCardElements = document.querySelectorAll('.float-card');
        gsap.fromTo(floatingCardElements, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: EASING.STRONG_BOUNCE, delay: 0.35 });

        const formInputElements = document.querySelectorAll('.login-form-header, .login-form .form-group, .form-options, .login-form .btn-primary, .login-divider, .social-login, .login-footer');
        gsap.fromTo(formInputElements, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: EASING.POWER3_OUT, delay: 0.2 });
    }

    function animateWelcomeBanner(containerElement) {
        const welcomeBanner = containerElement.querySelector('.welcome-banner');
        if (!welcomeBanner) return;

        gsap.fromTo(welcomeBanner, { opacity: 0, scale: 0.97, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: TIMING.SLOWEST, ease: EASING.POWER3_OUT, delay: TIMING.DELAY_SHORT });

        const bannerIllustration = welcomeBanner.querySelector('.wb-illustration');
        if (bannerIllustration) {
            gsap.fromTo(bannerIllustration, { scale: 0.6, opacity: 0, rotate: -20 }, { scale: 1, opacity: 1, rotate: 0, duration: TIMING.SLOWEST, ease: EASING.ELASTIC_BOUNCE, delay: TIMING.DELAY_MEDIUM });
        }
    }

    function animateKPICards(containerElement) {
        const kpiCardElements = containerElement.querySelectorAll('.kpi-card');
        gsap.fromTo(kpiCardElements, { opacity: 0, y: 35, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: TIMING.SLOWER, stagger: TIMING.STAGGER_LOOSE, ease: EASING.SOFT_BOUNCE, delay: TIMING.DELAY_MEDIUM });

        const kpiIconElements = containerElement.querySelectorAll('.kpi-icon');
        gsap.fromTo(kpiIconElements, { scale: 0, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.STRONG_BOUNCE, delay: TIMING.SLOW });

        const kpiTrendIndicators = containerElement.querySelectorAll('.kpi-trend');
        gsap.fromTo(kpiTrendIndicators, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: EASING.OUT, delay: TIMING.SLOWER + TIMING.STAGGER_NORMAL });
    }

    function animateDonutCharts(containerElement) {
        const donutChartSegments = containerElement.querySelectorAll('.donut-seg');
        donutChartSegments.forEach((segment, segmentIndex) => {
            let pathLength = 200;
            try {
                if (typeof segment.getTotalLength === 'function') {
                    pathLength = segment.getTotalLength();
                }
            } catch (error) {
                console.warn('Donut segment animation: getTotalLength failed', error);
            }

            gsap.set(segment, { strokeDasharray: pathLength, strokeDashoffset: pathLength });
            gsap.to(segment, { strokeDashoffset: 0, duration: TIMING.SLOWEST, ease: EASING.IN_OUT, delay: TIMING.SLOWER + segmentIndex * TIMING.STAGGER_NORMAL });
        });
    }

    function executeDashboardEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;
        animateWelcomeBanner(containerElement);
        animateKPICards(containerElement);
        animateDonutCharts(containerElement);
    }

    function executeDynamicDashboardItemAnimations(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const expiryNotificationItems = containerElement.querySelectorAll('.expiry-item');
        AnimationBuilders.executeFadeSlideAnimation(expiryNotificationItems, 'horizontal', -20, TIMING.NORMAL, TIMING.STAGGER_NORMAL, EASING.OUT, TIMING.DELAY_SHORT);

        const activityLogItems = containerElement.querySelectorAll('.activity-item');
        AnimationBuilders.executeFadeSlideAnimation(activityLogItems, 'horizontal', 18, TIMING.NORMAL, TIMING.STAGGER_NORMAL, EASING.OUT, TIMING.DELAY_SHORT);
    }

    function executeProductGridEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const productCardElements = containerElement.querySelectorAll('.product-card');
        gsap.fromTo(productCardElements, { opacity: 0, y: 32, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: EASING.GENTLE_BOUNCE, delay: TIMING.DELAY_SHORT });

        const categoryChipElements = containerElement.querySelectorAll('.chip');
        gsap.fromTo(categoryChipElements, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: TIMING.FAST, stagger: TIMING.STAGGER_TIGHT, ease: EASING.STRONG_BOUNCE, delay: TIMING.STAGGER_TIGHT });

        InteractionHandlers.initializeGlobalHoverInteractions();
    }

    function animateDetailHero(containerElement) {
        const heroVisualElement = containerElement.querySelector('.detail-header-visual');
        if (heroVisualElement) {
            gsap.fromTo(heroVisualElement, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: TIMING.SLOWEST, ease: EASING.OUT, delay: TIMING.DELAY_SHORT });
        }
    }

    function animateDetailSidebar(containerElement) {
        const detailSidebar = containerElement.querySelector('.detail-sidebar');
        if (detailSidebar && detailSidebar.children.length > 0) {
            gsap.fromTo(detailSidebar.children, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.OUT, delay: TIMING.DELAY_MEDIUM });
        }
    }

    function executeDetailViewEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        animateDetailHero(containerElement);
        animateDetailSidebar(containerElement);

        const dataTableRows = containerElement.querySelectorAll('.data-table tbody tr');
        AnimationBuilders.executeFadeSlideAnimation(dataTableRows, 'horizontal', -20, TIMING.NORMAL, TIMING.STAGGER_TIGHT, EASING.OUT, TIMING.DELAY_SHORT);
    }

    function executeAlertPanelEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const summaryCardElements = containerElement.querySelectorAll('.alert-sum-card');
        gsap.fromTo(summaryCardElements, { opacity: 0, scale: 0.88, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: EASING.INTERACTIVE_BOUNCE, delay: TIMING.DELAY_SHORT });

        const alertNotificationItems = containerElement.querySelectorAll('.alert-item');
        gsap.fromTo(alertNotificationItems, { opacity: 0, x: -36, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_NORMAL, ease: EASING.POWER3_OUT, delay: TIMING.SLOW });

        InteractionHandlers.initializeGlobalHoverInteractions();
    }

    function executePepsInformationBannerAnimation(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const pepsBanner = containerElement.querySelector('.peps-info-banner');
        if (!pepsBanner) return;

        gsap.fromTo(pepsBanner, { opacity: 0, y: -16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: TIMING.NORMAL, ease: EASING.OUT, delay: TIMING.DELAY_SHORT });
    }

    function executeScannerInterfaceEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const scannerViewport = containerElement.querySelector('.scanner-viewport');
        if (scannerViewport) {
            gsap.fromTo(scannerViewport, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: TIMING.SLOWER, ease: EASING.SPRING_BOUNCE, delay: TIMING.DELAY_MEDIUM });
        }

        const lotFormGroups = containerElement.querySelectorAll('.lot-form .form-group');
        AnimationBuilders.executeFadeSlideAnimation(lotFormGroups, 'vertical', 14, TIMING.NORMAL, TIMING.STAGGER_TIGHT, EASING.OUT, TIMING.SLOW);
    }

    function executeSupplierDirectoryEntranceSequence(containerElement) {
        if (!DOMValidator.isValidElement(containerElement)) return;

        const supplierCardElements = containerElement.querySelectorAll('.supplier-card');
        gsap.fromTo(supplierCardElements, { opacity: 0, scale: 0.9, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: TIMING.SLOWER, stagger: TIMING.STAGGER_LOOSE, ease: EASING.SOFT_BOUNCE, delay: TIMING.DELAY_SHORT });

        const supplierAvatarElements = containerElement.querySelectorAll('.sc-avatar');
        gsap.fromTo(supplierAvatarElements, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: TIMING.NORMAL, stagger: TIMING.STAGGER_LOOSE, ease: EASING.STRONG_BOUNCE, delay: TIMING.SLOW });

        InteractionHandlers.initializeGlobalHoverInteractions();
    }

    return {
        executeLoginEntranceSequence,
        executeDashboardEntranceSequence,
        executeDynamicDashboardItemAnimations,
        executeProductGridEntranceSequence,
        executeDetailViewEntranceSequence,
        executeAlertPanelEntranceSequence,
        executePepsInformationBannerAnimation,
        executeScannerInterfaceEntranceSequence,
        executeSupplierDirectoryEntranceSequence
    };
})();

const NavigationController = (function () {
    const { TIMING } = AnimationConfiguration;

    function validateNavigationPrerequisites(screenIdentifier) {
        if (!DOMValidator.validateStringParameter(screenIdentifier, 'screenIdentifier')) {
            return { valid: false, reason: 'Invalid screen identifier' };
        }

        if (NavigationStateManager.isNavigating()) {
            return { valid: false, reason: 'Navigation already in progress' };
        }

        if (screenIdentifier === NavigationStateManager.getCurrentScreen()) {
            return { valid: false, reason: 'Already on target screen' };
        }

        const targetScreenElement = document.getElementById(screenIdentifier);
        if (!targetScreenElement) {
            return { valid: false, reason: `Screen "${screenIdentifier}" not found` };
        }

        const loadingOverlay = document.getElementById('loading-overlay');
        if (!loadingOverlay) {
            return { valid: false, reason: 'Loading overlay element not found' };
        }

        return { valid: true, targetScreen: targetScreenElement, loadingOverlay: loadingOverlay };
    }

    function captureFlipState(sourceElement) {
        if (!sourceElement || !sourceElement.classList.contains('product-card')) return null;

        try {
            return Flip.getState(sourceElement);
        } catch (error) {
            console.warn('Flip state capture failed:', error);
            return null;
        }
    }

    function executeFlipAnimation(timelineInstance, flipState, targetScreenElement) {
        if (!flipState) return;

        const detailCardElement = targetScreenElement.querySelector('.detail-card');
        if (!detailCardElement) return;

        try {
            timelineInstance.add(
                Flip.from(flipState, {
                    targets: detailCardElement,
                    duration: TIMING.SLOWER,
                    ease: AnimationConfiguration.EASING.POWER3_OUT,
                    absolute: true
                }),
                0
            );
        } catch (error) {
            console.warn('Flip animation execution failed:', error);
        }
    }

    function createSafetyTimeout(nextScreenElement, loadingOverlayElement, currentScreenElement) {
        return setTimeout(() => {
            NavigationStateManager.setNavigatingStatus(false);
            gsap.set(loadingOverlayElement, { opacity: 0, display: 'none' });
            nextScreenElement.classList.add('active');
            nextScreenElement.style.opacity = '1';

            if (currentScreenElement) {
                currentScreenElement.classList.remove('active');
                currentScreenElement.style.pointerEvents = 'none';
            }

            NavigationStateManager.setCurrentScreen(nextScreenElement.id);
        }, TIMING.SAFETY_TIMEOUT_DURATION);
    }

    function performScreenNavigation(screenIdentifier, sourceInteractionElement) {
        const validation = validateNavigationPrerequisites(screenIdentifier);
        if (!validation.valid) return;

        const currentScreenElement = document.getElementById(NavigationStateManager.getCurrentScreen());
        const { targetScreen: nextScreenElement, loadingOverlay: loadingOverlayElement } = validation;

        NavigationStateManager.setNavigatingStatus(true);
        gsap.killTweensOf('*');

        const flipState = captureFlipState(sourceInteractionElement);

        NavigationAnimationController.updateSidebarActiveIndicator(screenIdentifier);

        gsap.set(loadingOverlayElement, { opacity: 1, display: 'flex' });
        gsap.set(nextScreenElement, { opacity: 0 });

        const safetyTimeout = createSafetyTimeout(nextScreenElement, loadingOverlayElement, currentScreenElement);

        const navigationTimeline = gsap.timeline({
            onComplete: () => {
                clearTimeout(safetyTimeout);
                NavigationStateManager.setNavigatingStatus(false);
                gsap.set(loadingOverlayElement, { display: 'none' });
            },
            onError: (error) => {
                clearTimeout(safetyTimeout);
                NavigationStateManager.setNavigatingStatus(false);
                gsap.set(loadingOverlayElement, { display: 'none' });
                console.error('Navigation timeline error:', error);
            }
        });

        navigationTimeline.add(() => {
            NavigationAnimationController.executeScreenTransition(navigationTimeline, currentScreenElement, nextScreenElement, loadingOverlayElement);
            NavigationStateManager.setCurrentScreen(screenIdentifier);

            if (typeof window.triggerDataLoad === 'function') {
                window.triggerDataLoad(screenIdentifier);
            }
        });

        executeFlipAnimation(navigationTimeline, flipState, nextScreenElement);

        if (screenIdentifier === 'screen-login') {
            navigationTimeline.add(() => {
                ScreenAnimationSequences.executeLoginEntranceSequence();
            }, 0.1);
            return;
        }

        NavigationAnimationController.executeContentEntranceSequence(navigationTimeline, nextScreenElement);
    }

    return { performScreenNavigation };
})();

window.GSAPIntegration = (function () {
    return {
        initializeGlobalHoverInteractions: InteractionHandlers.initializeGlobalHoverInteractions,
        navigateTo: NavigationController.performScreenNavigation,
        applyElasticInteraction: InteractionHandlers.attachElasticInteraction,
        animateLoginEntrance: ScreenAnimationSequences.executeLoginEntranceSequence,
        animateDashboardEntrance: ScreenAnimationSequences.executeDashboardEntranceSequence,
        animateDynamicDashboardItems: ScreenAnimationSequences.executeDynamicDashboardItemAnimations,
        animateProductCards: ScreenAnimationSequences.executeProductGridEntranceSequence,
        animateDetailEntrance: ScreenAnimationSequences.executeDetailViewEntranceSequence,
        animateAlerts: ScreenAnimationSequences.executeAlertPanelEntranceSequence,
        animateTableRows: (container) => {
            const rows = container.querySelectorAll('.data-table tbody tr');
            AnimationBuilders.executeFadeSlideAnimation(
                rows, 'horizontal', -20,
                AnimationConfiguration.TIMING.NORMAL,
                AnimationConfiguration.TIMING.STAGGER_TIGHT,
                AnimationConfiguration.EASING.OUT,
                AnimationConfiguration.TIMING.DELAY_SHORT
            );
        },
        animatePepsBanner: ScreenAnimationSequences.executePepsInformationBannerAnimation,
        animateScannerEntrance: ScreenAnimationSequences.executeScannerInterfaceEntranceSequence,
        animateSupplierCards: ScreenAnimationSequences.executeSupplierDirectoryEntranceSequence
    };
})();