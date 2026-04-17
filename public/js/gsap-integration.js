// gsap-integration.js
// Consolida las animaciones GSAP y transiciones del prototipo

window.GSAPIntegration = (function () {
    const ANIMATION = {
        FAST: 0.2,
        NORMAL: 0.35,
        SLOW: 0.5,
        SLOWER: 0.65,
        SLOWEST: 0.8,
        TIGHT_STAGGER: 0.04,
        NORMAL_STAGGER: 0.08,
        LOOSE_STAGGER: 0.12,
        SHORT_DELAY: 0.1,
        MEDIUM_DELAY: 0.25,
        LONG_DELAY: 0.4,
        NUMBER_ANIMATION: 1.5,
        NUMBER_ANIMATION_DELAY: 0.3,
        EASE_IN_OUT: 'power3.inOut',
        EASE_OUT: 'power2.out',
        EASE_POWER3_OUT: 'power3.out',
        EASE_BOUNCE_OUT: 'back.out(1.5)',
        EASE_BOUNCE_STRONG: 'back.out(2)'
    };

    // Jelly Hover Interaction
    function applyJellyInteraction(el) {
        if (!el || el._jellyBound) return;
        el._jellyBound = true;
        el.classList.add('jelly-enabled');
        el.addEventListener('mouseenter', () => gsap.to(el, { scale: 1.02, duration: 0.3, ease: 'back.out(2)' }));
        el.addEventListener('mouseleave', () => gsap.to(el, { scale: 1, duration: 0.3, ease: 'power2.out' }));
        el.addEventListener('mousedown', () => gsap.to(el, { scale: 0.95, duration: 0.1, ease: 'power2.in' }));
        el.addEventListener('mouseup', () => gsap.to(el, { scale: 1.02, duration: 0.3, ease: 'back.out(3)' }));
    }

    function initGlobalHoverInteractions() {
        document.querySelectorAll('.btn-primary, .btn-outline, .btn-danger-outline').forEach(btn => applyJellyInteraction(btn));
        document.querySelectorAll('.product-card, .supplier-card, .user-card').forEach(card => applyJellyInteraction(card));

        document.querySelectorAll('.kpi-icon').forEach(icon => {
            if (icon._hoverBound) return;
            icon._hoverBound = true;
            icon.addEventListener('mouseenter', () => gsap.to(icon, { rotate: 14, scale: 1.2, duration: 0.25, ease: 'back.out(2)' }));
            icon.addEventListener('mouseleave', () => gsap.to(icon, { rotate: 0, scale: 1, duration: 0.3, ease: 'power2.out' }));
        });
        
        document.querySelectorAll('.sidebar-menu li:not(.menu-label)').forEach(li => {
            if (li._hoverBound) return;
            li._hoverBound = true;
            li.addEventListener('click', () => {
                const icon = li.querySelector('i');
                if (icon) {
                    gsap.timeline()
                        .to(icon, { scale: 0.6, rotate: -15, duration: 0.12, ease: 'power2.in' })
                        .to(icon, { scale: 1.2, rotate: 5, duration: 0.2, ease: 'back.out(3)' })
                        .to(icon, { scale: 1, rotate: 0, duration: 0.15, ease: 'power2.out' });
                }
            });
        });
        
        // Pulse para notificaciones
        if (!window._notifPulseInitialized) {
            window._notifPulseInitialized = true;
            gsap.to('.notif-dot', { scale: 1.2, duration: 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        }
    }

    // Advanced Navigation with Timeline and Flip
    function navigateTo(screenId, srcElement) {
        if (AppState.isNavigating || screenId === AppState.currentScreen) return;
        AppState.isNavigating = true;

        const current = document.getElementById(AppState.currentScreen);
        const next = document.getElementById(screenId);
        const loadingOverlay = document.getElementById('loading-overlay');

        if (!next) { AppState.isNavigating = false; return; }

        gsap.killTweensOf('*');

        let state;
        if (srcElement && srcElement.classList.contains('product-card')) {
            state = Flip.getState(srcElement);
        }

        // Sidebar active label switch
        document.querySelectorAll('.sidebar-menu li').forEach(li => {
            const nav = li.getAttribute('data-navigate');
            if (nav === screenId) li.classList.add('active');
            else li.classList.remove('active');
        });

        gsap.set(loadingOverlay, { opacity: 1, display: 'flex' });
        gsap.set(next, { opacity: 0 });

        let safetyTimeout = setTimeout(() => {
            AppState.isNavigating = false;
            gsap.set(loadingOverlay, { opacity: 0, display: 'none' });
            next.classList.add('active');
            next.style.opacity = 1;
            if (current) {
                current.classList.remove('active');
                current.style.pointerEvents = 'none';
            }
            AppState.currentScreen = screenId;
        }, 3000);

        const tl = gsap.timeline({
            onComplete: () => {
                clearTimeout(safetyTimeout);
                AppState.isNavigating = false;
                gsap.set(loadingOverlay, { display: 'none' });
            },
            onError: () => {
                clearTimeout(safetyTimeout);
                AppState.isNavigating = false;
                gsap.set(loadingOverlay, { display: 'none' });
            }
        });

        tl.add(() => {
            if (current) {
                current.classList.remove('active');
                current.style.pointerEvents = 'none';
                gsap.set(current, { opacity: 0, y: 0 });
            }
            next.classList.add('active');
            next.style.pointerEvents = 'auto';
            AppState.currentScreen = screenId;
            const ca = next.querySelector('.content-area');
            if (ca) ca.scrollTop = 0;
            
            // Disparar carga dinámica de datos
            if (typeof window.triggerDataLoad === 'function') {
                window.triggerDataLoad(screenId);
            }
        });

        tl.to(loadingOverlay, { opacity: 0, duration: ANIMATION.NORMAL, ease: 'none' }, 0);
        tl.to(next, { opacity: 1, duration: ANIMATION.NORMAL, ease: ANIMATION.EASE_IN_OUT }, 0);

        if (state) {
            const detailCard = next.querySelector('.detail-card');
            if (detailCard) {
                tl.add(Flip.from(state, {
                    targets: detailCard,
                    duration: ANIMATION.SLOWER,
                    ease: ANIMATION.EASE_POWER3_OUT,
                    absolute: true
                }), 0);
            }
        }

        // Si navega login, animar explícito
        if (screenId === 'screen-login') {
            tl.add(() => animateLoginEntrance(), 0.1);
            return;
        }

        const children = next.querySelectorAll('.content-area > *:not(.detail-card)');
        const sideItems = next.querySelectorAll('.sidebar-menu li:not(.menu-label)');
        const topBarElements = next.querySelectorAll('.top-bar-left, .top-bar-right');

        const choreography = { duration: ANIMATION.NORMAL, stagger: 0.02, ease: ANIMATION.EASE_POWER3_OUT };

        if (children.length > 0) tl.fromTo(children, { opacity: 0, y: 15 }, { opacity: 1, y: 0, ...choreography }, 0.05);
        if (sideItems.length > 0) tl.fromTo(sideItems, { opacity: 0, x: -10 }, { opacity: 1, x: 0, ...choreography }, 0.05);
        if (topBarElements.length > 0) tl.fromTo(topBarElements, { opacity: 0, y: -10 }, { opacity: 1, y: 0, ...choreography }, 0.05);
    }

    // Component Animations
    function animateLoginEntrance() {
        const left = document.querySelector('.login-left');
        const right = document.querySelector('.login-right');
        if (!left || !right) return;
        gsap.fromTo(left, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
        gsap.fromTo(right, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.inOut' });
        const heroEls = document.querySelectorAll('.logo-big h1, .hero-subtitle, .hero-features .hf');
        gsap.fromTo(heroEls, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: 0.45, stagger: 0.08, ease: 'power2.out', delay: 0.15 });
        const floatCards = document.querySelectorAll('.float-card');
        gsap.fromTo(floatCards, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'back.out(2)', delay: 0.35 });
        const formEls = document.querySelectorAll('.login-form-header, .login-form .form-group, .form-options, .login-form .btn-primary, .login-divider, .social-login, .login-footer');
        gsap.fromTo(formEls, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out', delay: 0.2 });
    }

    function animateDashboardExt(container) {
        animateWelcomeBanner(container);
        animateKpiCards(container);
        animateDonut(container);
    }

    function animateDynamicDashboardItems(container) {
        animateExpiryItems(container);
        animateActivityItems(container);
    }

    function animateWelcomeBanner(container) {
        const banner = container.querySelector('.welcome-banner');
        if (!banner) return;
        gsap.fromTo(banner, { opacity: 0, scale: 0.97, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: ANIMATION.SLOWEST, ease: ANIMATION.EASE_POWER3_OUT, delay: ANIMATION.SHORT_DELAY });
        const icon = banner.querySelector('.wb-illustration');
        if (icon) gsap.fromTo(icon, { scale: 0.6, opacity: 0, rotate: -20 }, { scale: 1, opacity: 1, rotate: 0, duration: ANIMATION.SLOWEST, ease: 'back.out(1.7)', delay: ANIMATION.MEDIUM_DELAY });
    }

    function animateKpiCards(container) {
        const cards = container.querySelectorAll('.kpi-card');
        gsap.fromTo(cards, { opacity: 0, y: 35, scale: 0.92 }, { opacity: 1, y: 0, scale: 1, duration: ANIMATION.SLOWER, stagger: ANIMATION.LOOSE_STAGGER, ease: ANIMATION.EASE_BOUNCE_OUT, delay: ANIMATION.MEDIUM_DELAY });
        const icons = container.querySelectorAll('.kpi-icon');
        gsap.fromTo(icons, { scale: 0, opacity: 0, rotate: -30 }, { scale: 1, opacity: 1, rotate: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.LOOSE_STAGGER, ease: ANIMATION.EASE_BOUNCE_STRONG, delay: ANIMATION.SLOW });
        const trends = container.querySelectorAll('.kpi-trend');
        gsap.fromTo(trends, { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SLOWER + ANIMATION.NORMAL_STAGGER });
    }

    function animateDonut(container) {
        const segs = container.querySelectorAll('.donut-seg');
        segs.forEach((seg, i) => {
            const totalLength = seg.getTotalLength ? seg.getTotalLength() : 200;
            gsap.set(seg, { strokeDasharray: totalLength, strokeDashoffset: totalLength });
            gsap.to(seg, { strokeDashoffset: 0, duration: ANIMATION.SLOWEST, ease: ANIMATION.EASE_IN_OUT, delay: ANIMATION.SLOWER + i * ANIMATION.NORMAL_STAGGER });
        });
    }

    function animateExpiryItems(container) {
        const items = container.querySelectorAll('.expiry-item');
        gsap.fromTo(items, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SHORT_DELAY });
    }

    function animateActivityItems(container) {
        const items = container.querySelectorAll('.activity-item');
        gsap.fromTo(items, { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SHORT_DELAY });
    }

    function animateProductCards(container) {
        const cards = container.querySelectorAll('.product-card');
        gsap.fromTo(cards, { opacity: 0, y: 32, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: 'back.out(1.3)', delay: ANIMATION.SHORT_DELAY });
        const chips = container.querySelectorAll('.chip');
        gsap.fromTo(chips, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: ANIMATION.FAST, stagger: ANIMATION.TIGHT_STAGGER, ease: 'back.out(2)', delay: ANIMATION.TIGHT_STAGGER });
        initGlobalHoverInteractions();
    }

    function animateDetailEntrance(container) {
        const hero = container.querySelector('.detail-header-visual');
        if (hero) gsap.fromTo(hero, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: ANIMATION.SLOWEST, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SHORT_DELAY });
        const sidebar = container.querySelector('.detail-sidebar');
        if (sidebar) gsap.fromTo(sidebar.children, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.LOOSE_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.MEDIUM_DELAY });
        animateTableRows(container);
    }

    function animateAlerts(container) {
        const sumCards = container.querySelectorAll('.alert-sum-card');
        gsap.fromTo(sumCards, { opacity: 0, scale: 0.88, y: 16 }, { opacity: 1, scale: 1, y: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: 'back.out(1.8)', delay: ANIMATION.SHORT_DELAY });
        const items = container.querySelectorAll('.alert-item');
        gsap.fromTo(items, { opacity: 0, x: -36, scale: 0.98 }, { opacity: 1, x: 0, scale: 1, duration: ANIMATION.NORMAL, stagger: ANIMATION.NORMAL_STAGGER, ease: ANIMATION.EASE_POWER3_OUT, delay: ANIMATION.SLOW });
        initGlobalHoverInteractions();
    }

    function animateTableRows(container) {
        const rows = container.querySelectorAll('.data-table tbody tr');
        gsap.fromTo(rows, { opacity: 0, x: -20 }, { opacity: 1, x: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.TIGHT_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SHORT_DELAY });
    }

    function animatePepsBanner(container) {
        const banner = container.querySelector('.peps-info-banner');
        if (!banner) return;
        gsap.fromTo(banner, { opacity: 0, y: -16, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: ANIMATION.NORMAL, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SHORT_DELAY });
    }

    function animateScannerEntrance(container) {
        const viewport = container.querySelector('.scanner-viewport');
        if (viewport) {
            gsap.fromTo(viewport, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: ANIMATION.SLOWER, ease: 'back.out(1.4)', delay: ANIMATION.MEDIUM_DELAY });
        }
        const formGroups = container.querySelectorAll('.lot-form .form-group');
        gsap.fromTo(formGroups, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: ANIMATION.NORMAL, stagger: ANIMATION.TIGHT_STAGGER, ease: ANIMATION.EASE_OUT, delay: ANIMATION.SLOW });
    }

    function animateSupplierCards(container) {
        const cards = container.querySelectorAll('.supplier-card');
        gsap.fromTo(cards, { opacity: 0, scale: 0.9, y: 24 }, { opacity: 1, scale: 1, y: 0, duration: ANIMATION.SLOWER, stagger: ANIMATION.LOOSE_STAGGER, ease: 'back.out(1.5)', delay: ANIMATION.SHORT_DELAY });
        const avatars = container.querySelectorAll('.sc-avatar');
        gsap.fromTo(avatars, { scale: 0.5, opacity: 0 }, { scale: 1, opacity: 1, duration: ANIMATION.NORMAL, stagger: ANIMATION.LOOSE_STAGGER, ease: ANIMATION.EASE_BOUNCE_STRONG, delay: ANIMATION.SLOW });
        initGlobalHoverInteractions();
    }

    // Export interface
    return {
        initGlobalHoverInteractions,
        navigateTo,
        applyJellyInteraction,
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
