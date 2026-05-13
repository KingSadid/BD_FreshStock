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
      if (act === 'logout') logout();
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
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verificando...';
      btn.disabled = true;

      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;

      try {
        const res = await api.login({ email, password });
        const data = await res.json();

        if (res.ok) {
          AppState.user = data.user;
          AppState.token = data.token;
          localStorage.setItem('freshstock-user', JSON.stringify(data.user));
          localStorage.setItem('freshstock-token', data.token);
          updateSidebarUser(data.user);
          showToast('Bienvenido', `Hola, ${data.user.name}`, 'success');
          navigateTo('screen-dashboard');
        } else {
          showToast('Error', data.error || 'Credenciales inválidas', 'error');
        }
      } catch (err) {
        showToast('Error', 'No se pudo conectar al servidor', 'error');
      } finally {
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  }

  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = registerForm.querySelector('button[type="submit"]');
      const original = btn.innerHTML;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
      btn.disabled = true;

      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData);

      if (data.password !== data.confirmPassword) {
        showToast('Error', 'Las contraseñas no coinciden', 'error');
        btn.innerHTML = original;
        btn.disabled = false;
        return;
      }

      try {
        const res = await api.register({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role || 'seller'
        });
        const result = await res.json();

        if (res.ok) {
          AppState.user = result.user;
          AppState.token = result.token;
          localStorage.setItem('freshstock-user', JSON.stringify(result.user));
          localStorage.setItem('freshstock-token', result.token);
          updateSidebarUser(result.user);
          showToast('Cuenta creada', 'Registro exitoso', 'success');
          navigateTo('screen-dashboard');
        } else {
          showToast('Error', result.error || 'No se pudo registrar', 'error');
        }
      } catch (err) {
        showToast('Error', 'No se pudo conectar al servidor', 'error');
      } finally {
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  }
});

function updateSidebarUser(user) {
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.querySelectorAll('.user-avatar, .user-avatar-sm').forEach(el => el.textContent = initials);
  document.querySelectorAll('.user-name').forEach(el => el.textContent = user.name);
  document.querySelectorAll('.user-role').forEach(el => {
    const roles = { admin: 'Administrador', warehouse: 'Almacén', seller: 'Vendedor' };
    el.textContent = roles[user.role] || user.role;
  });
}

async function logout() {
  try {
    await api.logout();
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
  AppState.user = null;
  AppState.token = null;
  localStorage.removeItem('freshstock-user');
  localStorage.removeItem('freshstock-token');
  navigateTo('screen-login');
}
