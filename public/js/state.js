/**
 * Global application state.
 * Single source of truth for UI state.
 */
const AppState = {
  currentScreen: 'screen-login',
  isNavigating: false,
  products: [],
  batches: [],
  suppliers: [],
  categories: [],
  user: JSON.parse(localStorage.getItem('freshstock-user') || 'null'),
  token: localStorage.getItem('freshstock-token') || null
};
