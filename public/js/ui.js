const ApplicationState = (function() {
    const state = {
        currentScreenId: 'screen-login',
        isTransitioning: false,
        productList: [],
        batchList: [],
        supplierList: [],
        categoryList: []
    };

    return {
        getCurrentScreen: () => state.currentScreenId,
        setCurrentScreen: (screenId) => { state.currentScreenId = screenId; },
        isNavigating: () => state.isTransitioning,
        setNavigating: (status) => { state.isTransitioning = status; },
        getProducts: () => [...state.productList],
        setProducts: (products) => { state.productList = products; },
        getBatches: () => [...state.batchList],
        setBatches: (batches) => { state.batchList = batches; },
        getSuppliers: () => [...state.supplierList],
        setSuppliers: (suppliers) => { state.supplierList = suppliers; },
        getCategories: () => [...state.categoryList],
        setCategories: (categories) => { state.categoryList = categories; }
    };
})();

const TOAST_CONFIG = Object.freeze({
    types: {
        success: { color: 'var(--primary)', icon: 'fa-check-circle' },
        error: { color: 'var(--danger)', icon: 'fa-times-circle' },
        warning: { color: 'var(--warning)', icon: 'fa-exclamation-triangle' },
        info: { color: 'var(--info)', icon: 'fa-info-circle' }
    },
    duration: 3000,
    animationDuration: 0.4
});

const SCREEN_HANDLERS = Object.freeze({
    'screen-dashboard': () => { if (typeof loadDashboard === 'function') loadDashboard(); },
    'screen-products': () => { if (typeof loadProducts === 'function') loadProducts(); },
    'screen-lots': () => { if (typeof loadLots === 'function') loadLots(); },
    'screen-alerts': () => { if (typeof loadAlerts === 'function') loadAlerts(); },
    'screen-suppliers': () => { if (typeof loadSuppliers === 'function') loadSuppliers(); },
    'screen-lot-register': () => { if (typeof prepareLotForm === 'function') prepareLotForm(); }
});

const NavigationManager = (function() {
    function updateSidebarActiveState(targetScreenId) {
        const menuItems = document.querySelectorAll('.sidebar-menu li');
        menuItems.forEach(menuItem => {
            const navigateTo = menuItem.getAttribute('data-navigate');
            menuItem.classList.toggle('active', navigateTo === targetScreenId);
        });
    }

    function removeCurrentScreenState(currentScreen) {
        if (!currentScreen) return;
        currentScreen.classList.remove('active');
        if (typeof gsap !== 'undefined') {
            gsap.set(currentScreen, { opacity: 0 });
        }
    }

    function animateNewScreenState(nextScreen, loadingOverlay, resolveCallback) {
        nextScreen.classList.add('active');
        
        if (typeof gsap !== 'undefined') {
            gsap.to(nextScreen, { opacity: 1, duration: 0.4 });
            gsap.to(loadingOverlay, {
                opacity: 0, 
                duration: 0.3, 
                onComplete: () => {
                    gsap.set(loadingOverlay, { display: 'none' });
                    resolveCallback();
                }
            });
        } else {
            loadingOverlay.style.display = 'none';
            resolveCallback();
        }
    }

    function animateTransition(currentScreen, nextScreen, loadingOverlay) {
        return new Promise((resolve) => {
            if (typeof gsap !== 'undefined') {
                gsap.set(loadingOverlay, { opacity: 1, display: 'flex' });
            } else {
                loadingOverlay.style.display = 'flex';
            }

            setTimeout(() => {
                removeCurrentScreenState(currentScreen);
                animateNewScreenState(nextScreen, loadingOverlay, resolve);
            }, 300);
        });
    }

    function executeScreenLoader(screenId) {
        const handler = SCREEN_HANDLERS[screenId];
        if (handler) handler();
    }

    async function transitionToScreen(screenId) {
        if (ApplicationState.isNavigating() || screenId === ApplicationState.getCurrentScreen()) {
            return;
        }

        try {
            ApplicationState.setNavigating(true);

            const currentScreenElement = document.getElementById(ApplicationState.getCurrentScreen());
            const nextScreenElement = document.getElementById(screenId);
            const loadingElement = document.getElementById('loading-overlay');

            if (!nextScreenElement || !loadingElement) {
                console.warn(`Required DOM elements for navigation not found`);
                return;
            }

            updateSidebarActiveState(screenId);
            await animateTransition(currentScreenElement, nextScreenElement, loadingElement);
            
            ApplicationState.setCurrentScreen(screenId);
            executeScreenLoader(screenId);
        } catch (error) {
            console.error('Navigation transition failed:', error);
        } finally {
            ApplicationState.setNavigating(false);
        }
    }

    return { transitionToScreen };
})();

const NotificationManager = (function() {
    function createToastElement(title, message, type) {
        const config = TOAST_CONFIG.types[type] || TOAST_CONFIG.types.info;
        const toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) return null;

        const toastElement = document.createElement('div');
        toastElement.className = 'toast';
        toastElement.innerHTML = `
            <div class="toast-icon" style="color: ${config.color}">
                <i class="fas ${config.icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${message}</div>
            </div>
            <div class="toast-progress" style="background: ${config.color}"></div>
        `;

        return { element: toastElement, container: toastContainer };
    }

    function animateToastEntry(toastElement) {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(toastElement, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: TOAST_CONFIG.animationDuration, ease: 'back.out(1.5)' });
        }
    }

    function scheduleToastRemoval(toastElement) {
        const progressBar = toastElement.querySelector('.toast-progress');
        
        if (typeof gsap !== 'undefined' && progressBar) {
            gsap.to(progressBar, { scaleX: 0, duration: TOAST_CONFIG.duration / 1000, ease: 'linear' });
        }

        setTimeout(() => {
            if (typeof gsap !== 'undefined') {
                gsap.to(toastElement, { 
                    x: 100, 
                    opacity: 0, 
                    duration: 0.3, 
                    onComplete: () => toastElement.remove() 
                });
            } else {
                toastElement.remove();
            }
        }, TOAST_CONFIG.duration);
    }

    function displayNotification(title, message, type = 'success') {
        const toast = createToastElement(title, message, type);
        if (!toast) return;

        toast.container.appendChild(toast.element);
        animateToastEntry(toast.element);
        scheduleToastRemoval(toast.element);
    }

    return { displayNotification };
})();

const ThemeManager = (function() {
    const STORAGE_KEY = 'freshstock-theme';
    const DARK_THEME = 'dark';

    function toggle() {
        const htmlElement = document.documentElement;
        const isCurrentlyDark = htmlElement.getAttribute('data-theme') === DARK_THEME;

        if (isCurrentlyDark) {
            htmlElement.removeAttribute('data-theme');
            localStorage.setItem(STORAGE_KEY, 'light');
        } else {
            htmlElement.setAttribute('data-theme', DARK_THEME);
            localStorage.setItem(STORAGE_KEY, DARK_THEME);
        }
    }

    return { toggle };
})();

const SidebarController = (function() {
    function toggle() {
        document.querySelectorAll('.sidebar').forEach(sidebar => {
            sidebar.classList.toggle('collapsed');
        });
    }

    return { toggle };
})();

const ProductPanelManager = (function() {
    function open() {
        const backdrop = document.getElementById('new-product-backdrop');
        const panel = document.getElementById('new-product-panel');
        
        if (backdrop && panel) {
            backdrop.classList.add('active');
            panel.classList.add('open');
            if (typeof loadCategoriesSelect === 'function') loadCategoriesSelect();
        }
    }

    function close() {
        const backdrop = document.getElementById('new-product-backdrop');
        const panel = document.getElementById('new-product-panel');
        
        if (backdrop && panel) {
            backdrop.classList.remove('active');
            panel.classList.remove('open');
        }
    }

    function resetForm() {
        const form = document.getElementById('new-product-form');
        const modeInput = document.getElementById('product-form-mode');
        const titleElement = document.getElementById('product-panel-title');

        if (form) {
            form.reset();
            if (form.sku) form.sku.readOnly = false;
        }
        
        if (modeInput) modeInput.value = 'create';
        if (titleElement) {
            titleElement.innerHTML = '<i class="fas fa-box-open"></i> Nuevo Producto';
        }
    }

    return { open, close, resetForm };
})();

const ActionDispatcher = (function() {
    const handlers = {
        'toggle-theme': () => ThemeManager.toggle(),
        'toggle-sidebar': () => SidebarController.toggle(),
        'open-new-product': () => {
            ProductPanelManager.resetForm();
            ProductPanelManager.open();
        },
        'close-new-product': () => ProductPanelManager.close()
    };

    function execute(actionType) {
        const handler = handlers[actionType];
        if (handler) {
            handler();
        } else {
            console.warn(`Unhandled action type: ${actionType}`);
        }
    }

    return { execute };
})();

const AuthenticationHandler = (function() {
    function handleLoginSubmit(event) {
        event.preventDefault();
        
        const loginForm = event.target;
        const submitButton = loginForm.querySelector('button[type="submit"]');
        
        if (!submitButton) return;

        const originalButtonContent = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

        setTimeout(() => {
            NavigationManager.transitionToScreen('screen-dashboard');
            submitButton.innerHTML = originalButtonContent;
        }, 800);
    }

    return { handleLoginSubmit };
})();

const DateUtilities = {
    formatToLocalString(dateString) {
        if (!dateString) return '-';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '-';
            
            return date.toLocaleDateString('es-ES', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
            });
        } catch {
            return '-';
        }
    },

    calculateDaysRemaining(expirationDateString) {
        const today = new Date();
        const expirationDate = new Date(expirationDateString);
        
        if (isNaN(expirationDate.getTime())) return null;
        
        const millisecondsPerDay = 1000 * 60 * 60 * 24;
        const differenceInMilliseconds = expirationDate - today;
        
        return Math.ceil(differenceInMilliseconds / millisecondsPerDay);
    }
};

const StatusBadgeGenerator = {
    generate(daysRemaining) {
        if (daysRemaining === null || daysRemaining === undefined) {
            return '<span class="status-badge">N/A</span>';
        }
        if (daysRemaining < 0) {
            return '<span class="status-badge critical">Vencido</span>';
        }
        if (daysRemaining === 0) {
            return '<span class="status-badge critical">Vence Hoy</span>';
        }
        if (daysRemaining <= 3) {
            return `<span class="status-badge warning">${daysRemaining} días</span>`;
        }
        return `<span class="status-badge ok">${daysRemaining} días</span>`;
    }
};

const PasswordFieldManager = (function() {
    function toggleVisibility(toggleIcon) {
        const inputField = toggleIcon.previousElementSibling;
        
        if (!inputField || inputField.tagName !== 'INPUT') return;

        const isPasswordVisible = inputField.type === 'text';
        
        inputField.type = isPasswordVisible ? 'password' : 'text';
        toggleIcon.classList.replace(
            isPasswordVisible ? 'fa-eye-slash' : 'fa-eye',
            isPasswordVisible ? 'fa-eye' : 'fa-eye-slash'
        );
    }

    return { toggleVisibility };
})();

function initializeEventListeners() {
    document.addEventListener('click', (event) => {
        const navigationElement = event.target.closest('[data-navigate]');
        if (navigationElement) {
            event.preventDefault();
            const targetScreen = navigationElement.getAttribute('data-navigate');
            NavigationManager.transitionToScreen(targetScreen);
            return;
        }

        const actionElement = event.target.closest('[data-action]');
        if (actionElement) {
            const actionType = actionElement.getAttribute('data-action');
            ActionDispatcher.execute(actionType);
        }
    });

    document.querySelectorAll('.toggle-pass').forEach(toggleIcon => {
        toggleIcon.addEventListener('click', function() {
            PasswordFieldManager.toggleVisibility(this);
        });
    });

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', AuthenticationHandler.handleLoginSubmit);
    }
}

document.addEventListener('DOMContentLoaded', initializeEventListeners);