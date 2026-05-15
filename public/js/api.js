const API_BASE = '';

const api = {
  login: (data) => fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  register: (data) => fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),

  logout: () => fetch(`${API_BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }),

  getKPIs: () => fetch(`${API_BASE}/api/dashboard/kpis`).then(r => r.json()),
  getMovementStats: () => fetch(`${API_BASE}/api/dashboard/movement-stats`).then(r => r.json()),
  getCategoryStats: () => fetch(`${API_BASE}/api/dashboard/category-stats`).then(r => r.json()),

  getProducts: () => fetch(`${API_BASE}/api/products`).then(r => r.json()),
  getProduct: (sku) => fetch(`${API_BASE}/api/products/${sku}`).then(r => r.json()),
  createProduct: (data) => fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.token}`
    },
    body: JSON.stringify(data)
  }),
  updateProduct: (sku, data) => fetch(`${API_BASE}/api/products/${sku}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.token}`
    },
    body: JSON.stringify(data)
  }),
  deleteProduct: (sku) => fetch(`${API_BASE}/api/products/${sku}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }),

  getBatches: (status = '') => fetch(`${API_BASE}/api/batches${status ? '?status=' + status : ''}`).then(r => r.json()),
  getExpiringBatches: (days = 7) => fetch(`${API_BASE}/api/batches/expiring?days=${days}`).then(r => r.json()),
  createBatch: (data) => fetch(`${API_BASE}/api/batches`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.token}`
    },
    body: JSON.stringify(data)
  }),

  deleteBatch: (id) => fetch(`${API_BASE}/api/batches/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }),

  getSuppliers: () => fetch(`${API_BASE}/api/suppliers`).then(r => r.json()),

  getCategories: () => fetch(`${API_BASE}/api/categories`).then(r => r.json()),

  getRecentMovements: () => fetch(`${API_BASE}/api/movements/recent`).then(r => r.json()),

  getUsers: () => fetch(`${API_BASE}/api/users`, {
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }).then(r => r.json()),

  deactivateUser: (id) => fetch(`${API_BASE}/api/users/${id}/deactivate`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }).then(r => {
    if (!r.ok) return r.json().then(err => { throw err; });
    return r.json();
  }),

  activateUser: (id) => fetch(`${API_BASE}/api/users/${id}/activate`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }).then(r => {
    if (!r.ok) return r.json().then(err => { throw err; });
    return r.json();
  }),

  deleteUser: (id) => fetch(`${API_BASE}/api/users/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }).then(r => {
    if (!r.ok) return r.json().then(err => { throw err; });
    return r.json();
  }),

  sendEvent: (eventType, data) => fetch(`${API_BASE}/api/analytics/event`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AppState.token}`
    },
    body: JSON.stringify({ event_type: eventType, data })
  }).catch(() => {}),

  runETL: () => fetch(`${API_BASE}/api/etl/run`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${AppState.token}` }
  }).then(r => r.json())
};