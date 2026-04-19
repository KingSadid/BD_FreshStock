// api-client.js

const API_BASE_URL = '';

const JSON_HEADERS = { 'Content-Type': 'application/json' };

function fetchJson(endpoint) {
    return fetch(`${API_BASE_URL}${endpoint}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status} ${response.statusText} [${endpoint}]`);
            }
            return response.json();
        })
        .catch(error => {
            console.error(`fetchJson error at ${endpoint}:`, error);
            throw error;
        });
}

function sendJson(endpoint, method, payload) {
    return fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: JSON_HEADERS,
        body: JSON.stringify(payload)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Request failed: ${response.status} ${response.statusText} [${method} ${endpoint}]`);
            }
            return response;
        })
        .catch(error => {
            console.error(`sendJson error at ${method} ${endpoint}:`, error);
            throw error;
        });
}

function deleteResource(endpoint) {
    return fetch(`${API_BASE_URL}${endpoint}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Delete failed: ${response.status} ${response.statusText} [${endpoint}]`);
            }
            return response;
        })
        .catch(error => {
            console.error(`deleteResource error at ${endpoint}:`, error);
            throw error;
        });
}

const api = {
    getDashboardKPIs: () => fetchJson('/api/dashboard/kpis'),
    getDashboardMovementStats: () => fetchJson('/api/dashboard/movement-stats'),
    getDashboardCategoryStats: () => fetchJson('/api/dashboard/category-stats'),

    getProducts: () => fetchJson('/api/products'),
    getProductBySku: (sku) => fetchJson(`/api/products/${sku}`),
    createProduct: (productData) => sendJson('/api/products', 'POST', productData),
    updateProduct: (sku, productData) => sendJson(`/api/products/${sku}`, 'PUT', productData),
    deleteProduct: (sku) => deleteResource(`/api/products/${sku}`),

    getBatches: (statusFilter = '') => {
        const queryString = statusFilter ? `?status=${statusFilter}` : '';
        return fetchJson(`/api/batches${queryString}`);
    },
    getExpiringBatches: (daysAhead = 7) => fetchJson(`/api/batches/expiring?days=${daysAhead}`),
    createBatch: (batchData) => sendJson('/api/batches', 'POST', batchData),
    deleteBatch: (batchId) => deleteResource(`/api/batches/${batchId}`),

    getSuppliers: () => fetchJson('/api/suppliers'),
    getCategories: () => fetchJson('/api/categories'),
    getRecentMovements: () => fetchJson('/api/movements/recent')
};