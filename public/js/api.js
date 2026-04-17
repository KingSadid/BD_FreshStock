const API_URL = '';

const api = {
  // Dashboard
  getKPIs: () => fetch(`${API_URL}/api/dashboard/kpis`).then(r => r.json()),
  
  // Productos
  getProducts: () => fetch(`${API_URL}/api/products`).then(r => r.json()),
  createProduct: (data) => fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  // Lotes
  getBatches: (params = '') => fetch(`${API_URL}/api/batches${params}`).then(r => r.json()),
  getExpiringBatches: (days = 7) => fetch(`${API_URL}/api/batches/expiring?days=${days}`).then(r => r.json()),
  createBatch: (data) => fetch(`${API_URL}/api/batches`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  // Proveedores
  getSuppliers: () => fetch(`${API_URL}/api/suppliers`).then(r => r.json()),
  
  // Categorías
  getCategories: () => fetch(`${API_URL}/api/categories`).then(r => r.json()),
  
  // Movimientos
  getRecentMovements: () => fetch(`${API_URL}/api/movements/recent`).then(r => r.json())
};