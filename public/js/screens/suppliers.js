/**
 * Suppliers screen logic.
 */
const SuppliersScreen = {
  async load() {
    try {
      const suppliers = await api.getSuppliers();
      const grid = document.getElementById('suppliers-grid');

      grid.innerHTML = suppliers.map(s => `
        <div class="supplier-card">
          <div class="sc-header">
            <div class="sc-avatar" style="background:#dbeafe;color:#3b82f6;">${s.name.substring(0, 2).toUpperCase()}</div>
            <div class="sc-info"><h4>${s.name}</h4><span class="sc-type">Proveedor</span></div>
            <span class="status-badge ok">Activo</span>
          </div>
          <div class="sc-body">
            <div class="sc-detail"><i class="fas fa-phone"></i> ${s.phone || 'N/A'}</div>
            <div class="sc-detail"><i class="fas fa-envelope"></i> ${s.email || 'N/A'}</div>
            <div class="sc-stats">
              <div class="sc-stat"><span class="sc-stat-val">${s.product_count}</span><span class="sc-stat-lbl">Productos</span></div>
              <div class="sc-stat"><span class="sc-stat-val">${s.batch_count}</span><span class="sc-stat-lbl">Lotes</span></div>
            </div>
          </div>
          <div class="sc-footer">
            <button class="btn-outline btn-sm"><i class="fas fa-eye"></i> Ver</button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    }
  }
};

const loadSuppliers = SuppliersScreen.load.bind(SuppliersScreen);
