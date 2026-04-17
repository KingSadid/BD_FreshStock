// Estado de la aplicación
const AppState = {
    currentScreen: 'screen-login',
    isNavigating: false,
    products: [],
    batches: [],
    suppliers: [],
    categories: []
};

// Navegación entre pantallas
function navigateTo(screenId) {
    if (AppState.isNavigating || screenId === AppState.currentScreen) return;
    AppState.isNavigating = true;

    const current = document.getElementById(AppState.currentScreen);
    const next = document.getElementById(screenId);
    const loading = document.getElementById('loading-overlay');

    if (!next) { AppState.isNavigating = false; return; }

    // Actualizar menú lateral
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
        const nav = li.getAttribute('data-navigate');
        if (nav === screenId) li.classList.add('active');
        else li.classList.remove('active');
    });

    // Mostrar loading
    gsap.set(loading, { opacity: 1, display: 'flex' });

    setTimeout(() => {
        if (current) {
            current.classList.remove('active');
            gsap.set(current, { opacity: 0 });
        }

        next.classList.add('active');
        gsap.to(next, { opacity: 1, duration: 0.4 });
        gsap.to(loading, {
            opacity: 0, duration: 0.3, onComplete: () => {
                gsap.set(loading, { display: 'none' });
            }
        });

        AppState.currentScreen = screenId;
        AppState.isNavigating = false;

        // Disparar evento de carga de screen
        if (screenId === 'screen-dashboard') loadDashboard();
        if (screenId === 'screen-products') loadProducts();
        if (screenId === 'screen-lots') loadLots();
        if (screenId === 'screen-alerts') loadAlerts();
        if (screenId === 'screen-suppliers') loadSuppliers();
        if (screenId === 'screen-lot-register') prepareLotForm();

    }, 300);
}

// Toast notifications
function showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';

    const colors = {
        success: 'var(--primary)',
        error: 'var(--danger)',
        warning: 'var(--warning)',
        info: 'var(--info)'
    };

    const icons = {
        success: 'fa-check-circle',
        error: 'fa-times-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };

    toast.innerHTML = `
    <div class="toast-icon" style="color: ${colors[type]}"><i class="fas ${icons[type]}"></i></div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-msg">${message}</div>
    </div>
    <div class="toast-progress" style="background: ${colors[type]}"></div>
  `;

    container.appendChild(toast);
    gsap.fromTo(toast, { x: 100, opacity: 0 }, { x: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' });

    gsap.to(toast.querySelector('.toast-progress'), { scaleX: 0, duration: 3, ease: 'linear' });

    setTimeout(() => {
        gsap.to(toast, { x: 100, opacity: 0, duration: 0.3, onComplete: () => toast.remove() });
    }, 3000);
}

// Toggle tema
function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';

    if (isDark) {
        html.removeAttribute('data-theme');
        localStorage.setItem('freshstock-theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        localStorage.setItem('freshstock-theme', 'dark');
    }
}

// Sidebar toggle
function toggleSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.toggle('collapsed'));
}

// Panel de nuevo producto
function openNewProductPanel() {
    document.getElementById('new-product-backdrop').classList.add('active');
    document.getElementById('new-product-panel').classList.add('open');
    loadCategoriesSelect();
}

function closeNewProductPanel() {
    document.getElementById('new-product-backdrop').classList.remove('active');
    document.getElementById('new-product-panel').classList.remove('open');
}

// Event listeners globales
document.addEventListener('DOMContentLoaded', () => {
    // Navegación
    document.addEventListener('click', (e) => {
        const nav = e.target.closest('[data-navigate]');
        if (nav) {
            e.preventDefault();
            navigateTo(nav.getAttribute('data-navigate'));
        }

        const action = e.target.closest('[data-action]');
        if (action) {
            const act = action.getAttribute('data-action');
            if (act === 'toggle-theme') toggleTheme();
            if (act === 'toggle-sidebar') toggleSidebar();
            if (act === 'open-new-product') openNewProductPanel();
            if (act === 'close-new-product') closeNewProductPanel();
        }
    });

    // Password toggle
    document.querySelectorAll('.toggle-pass').forEach(icon => {
        icon.addEventListener('click', function () {
            const input = this.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                this.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                this.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('button[type="submit"]');
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';

            setTimeout(() => {
                navigateTo('screen-dashboard');
                btn.innerHTML = original;
            }, 800);
        });
    }
});

// Helpers
function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getDaysRemaining(expiryDate) {
    const today = new Date();
    const exp = new Date(expiryDate);
    const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
    return diff;
}

function getStatusBadge(days) {
    if (days < 0) return '<span class="status-badge critical">Vencido</span>';
    if (days === 0) return '<span class="status-badge critical">Vence Hoy</span>';
    if (days <= 3) return '<span class="status-badge warning">' + days + ' días</span>';
    return '<span class="status-badge ok">' + days + ' días</span>';
}