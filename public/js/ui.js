/**
 * Common UI interactions.
 * No external animation libraries. Pure CSS transitions.
 */
const AppUI = {
  showToast(title, message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

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

    // Trigger reflow for animation
    void toast.offsetWidth;
    toast.classList.add('show');
    const progress = toast.querySelector('.toast-progress');
    if (progress) progress.classList.add('run');

    setTimeout(() => {
      toast.classList.remove('show');
      const progress = toast.querySelector('.toast-progress');
      if (progress) progress.classList.remove('run');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';

    if (isDark) {
      html.removeAttribute('data-theme');
      localStorage.setItem('freshstock-theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      localStorage.setItem('freshstock-theme', 'dark');
    }
  },

  toggleSidebar() {
    document.querySelectorAll('.sidebar').forEach(s => s.classList.toggle('collapsed'));
  },

  openNewProductPanel() {
    document.getElementById('new-product-backdrop')?.classList.add('active');
    document.getElementById('new-product-panel')?.classList.add('open');
    loadCategoriesSelect();
  },

  closeNewProductPanel() {
    document.getElementById('new-product-backdrop')?.classList.remove('active');
    document.getElementById('new-product-panel')?.classList.remove('open');
  }
};

// Global aliases
const showToast = AppUI.showToast.bind(AppUI);
const toggleTheme = AppUI.toggleTheme.bind(AppUI);
const toggleSidebar = AppUI.toggleSidebar.bind(AppUI);
const openNewProductPanel = AppUI.openNewProductPanel.bind(AppUI);
const closeNewProductPanel = AppUI.closeNewProductPanel.bind(AppUI);

// Event delegation for common interactions
document.addEventListener('DOMContentLoaded', () => {
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
      if (act === 'open-new-product') {
        const form = document.getElementById('new-product-form');
        if (form) {
          form.reset();
          form.sku.readOnly = false;
          document.getElementById('product-form-mode').value = 'create';
          document.getElementById('product-panel-title').innerHTML = `<i class="fas fa-box-open"></i> Nuevo Producto`;
        }
        openNewProductPanel();
      }
      if (act === 'close-new-product') closeNewProductPanel();
    }
  });

  document.querySelectorAll('.toggle-pass').forEach(icon => {
    icon.addEventListener('click', function () {
      const input = this.previousElementSibling;
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        this.classList.replace('fa-eye', 'fa-eye-slash');
      } else {
        input.type = 'password';
        this.classList.replace('fa-eye-slash', 'fa-eye');
      }
    });
  });

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
