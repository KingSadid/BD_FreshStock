const API_BASE_URL = '';
const JSON_HEADERS = { 'Content-Type': 'application/json' };

function executeApiRequest(endpoint, requestOptions = {}) {
    return fetch(`${API_BASE_URL}${endpoint}`, requestOptions)
        .then(response => {
            if (!response.ok) {
                const method = requestOptions.method || 'GET';
                throw new Error(`Request failed: ${response.status} ${response.statusText} [${method} ${endpoint}]`);
            }
            return response;
        })
        .catch(error => {
            const method = requestOptions.method || 'GET';
            console.error(`API Error at ${method} ${endpoint}:`, error);
            throw error;
        });
}

function fetchJsonData(endpoint) {
    return executeApiRequest(endpoint).then(response => response.json());
}

function sendJsonData(endpoint, method, payload) {
    return executeApiRequest(endpoint, {
        method,
        headers: JSON_HEADERS,
        body: JSON.stringify(payload)
    });
}

function removeResource(endpoint) {
    return executeApiRequest(endpoint, { method: 'DELETE' });
}

const apiClient = {
    getDashboardKPIs: () => fetchJsonData('/api/dashboard/kpis'),
    getDashboardMovementStats: () => fetchJsonData('/api/dashboard/movement-stats'),
    getDashboardCategoryStats: () => fetchJsonData('/api/dashboard/category-stats'),

    getProducts: () => fetchJsonData('/api/products'),
    getProductBySku: (sku) => fetchJsonData(`/api/products/${sku}`),
    createProduct: (productData) => sendJsonData('/api/products', 'POST', productData),
    updateProduct: (sku, productData) => sendJsonData(`/api/products/${sku}`, 'PUT', productData),
    deleteProduct: (sku) => removeResource(`/api/products/${sku}`),

    getBatches: (statusFilter = '') => {
        const queryString = statusFilter ? `?status=${statusFilter}` : '';
        return fetchJsonData(`/api/batches${queryString}`);
    },
    getExpiringBatches: (daysAhead = 7) => fetchJsonData(`/api/batches/expiring?days=${daysAhead}`),
    createBatch: (batchData) => sendJsonData('/api/batches', 'POST', batchData),
    deleteBatch: (batchId) => removeResource(`/api/batches/${batchId}`),

    getSuppliers: () => fetchJsonData('/api/suppliers'),
    getCategories: () => fetchJsonData('/api/categories'),
    getRecentMovements: () => fetchJsonData('/api/movements/recent')
};