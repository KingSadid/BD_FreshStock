const AppRouter = {
  navigateTo(screenId) {
    if (AppState.isNavigating || screenId === AppState.currentScreen) return;

    const publicScreens = ['screen-login', 'screen-register'];
    if (!publicScreens.includes(screenId) && !AppState.token) {
      screenId = 'screen-login';
    }

    AppState.isNavigating = true;

    const current = document.getElementById(AppState.currentScreen);
    const next = document.getElementById(screenId);
    const loading = document.getElementById('loading-overlay');

    if (!next) { AppState.isNavigating = false; return; }

    // Update sidebar active states across all sidebars
    document.querySelectorAll('.sidebar-menu li').forEach(li => {
      const nav = li.getAttribute('data-navigate');
      li.classList.toggle('active', nav === screenId);
    });

    // Show loading overlay
    if (loading) {
      loading.style.display = 'flex';
      // Force reflow
      void loading.offsetWidth;
      loading.classList.add('active');
    }

    setTimeout(() => {
      if (current) {
        current.classList.remove('active');
      }

      next.classList.add('active');

      // Scroll content to top
      const content = next.querySelector('.content-area');
      if (content) content.scrollTop = 0;

      // Hide loading overlay with CSS transition
      if (loading) {
        loading.classList.remove('active');
        setTimeout(() => {
          if (!loading.classList.contains('active')) {
            loading.style.display = 'none';
          }
        }, 300);
      }

      AppState.currentScreen = screenId;
      AppState.isNavigating = false;

      // Load screen data
      if (screenId === 'screen-dashboard') loadDashboard();
      if (screenId === 'screen-products') loadProducts();
      if (screenId === 'screen-lots') loadLots();
      if (screenId === 'screen-alerts') loadAlerts();
      if (screenId === 'screen-suppliers') loadSuppliers();
      if (screenId === 'screen-users') loadUsers();
      if (screenId === 'screen-lot-register') prepareLotForm();
    }, 200);
  }
};

// Global alias for inline handlers and existing calls
const navigateTo = AppRouter.navigateTo.bind(AppRouter);
