const API_BASE = '';

const api = {
  // Dashboard
  getKPIs: () => fetch(`${API_BASE}/api/dashboard/kpis`).then(r => r.json()),
  
  // Productos
  getProducts: () => fetch(`${API_BASE}/api/products`).then(r => r.json()),
  getProduct: (sku) => fetch(`${API_BASE}/api/products/${sku}`).then(r => r.json()),
  createProduct: (data) => fetch(`${API_BASE}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  updateProduct: (sku, data) => fetch(`${API_BASE}/api/products/${sku}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  deleteProduct: (sku) => fetch(`${API_BASE}/api/products/${sku}`, {
    method: 'DELETE'
  }),
  
  // Lotes
  getBatches: (status = '') => fetch(`${API_BASE}/api/batches${status ? '?status='+status : ''}`).then(r => r.json()),
  getExpiringBatches: (days = 7) => fetch(`${API_BASE}/api/batches/expiring?days=${days}`).then(r => r.json()),
  createBatch: (data) => fetch(`${API_BASE}/api/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  // Proveedores
  getSuppliers: () => fetch(`${API_BASE}/api/suppliers`).then(r => r.json()),
  
  // Categorías
  getCategories: () => fetch(`${API_BASE}/api/categories`).then(r => r.json()),
  
  // Movimientos
  getRecentMovements: () => fetch(`${API_BASE}/api/movements/recent`).then(r => r.json())
};