/**
 * Lots (batches) screen logic.
 */
const LotsScreen = {
  async load() {
    try {
      const batches = await api.getBatches();
      AppState.batches = batches;

      const tbody = document.getElementById('lots-table-body');
      tbody.innerHTML = batches.map((b, index) => {
        const days = getDaysRemaining(b.expiry_date);
        const rowClass = days < 0 ? 'row-critical' : days <= 3 ? 'row-warning' : '';
        const priority = index < 3 ? 'p1' : index < 6 ? 'p2' : 'p3';
        const priorityIcon = index < 3 ? '🔴' : index < 6 ? '🟠' : '🟢';

        return `
          <tr class="${rowClass}">
            <td><strong>#${b.batch_code}</strong></td>
            <td><div class="td-product"><i class="fas fa-box"></i> ${b.product_name}</div></td>
            <td>${formatDate(b.entry_date)}</td>
            <td>${formatDate(b.expiry_date)}</td>
            <td>
              <div class="mini-stock">
                <div class="stock-bar"><div class="stock-fill" style="width:${(b.current_quantity / b.initial_quantity) * 100}%;background:${days < 0 ? '#ef4444' : days < 3 ? '#f59e0b' : '#10b981'};"></div></div>
                <span>${b.current_quantity}/${b.initial_quantity}</span>
              </div>
            </td>
            <td>${b.warehouse_location || '-'}</td>
            <td>${getStatusBadge(days)}</td>
            <td><span class="peps-priority ${priority}">${priorityIcon} ${index + 1}°</span></td>
            <td>
              <button class="icon-btn-sm" title="Ver lote"><i class="fas fa-eye"></i></button>
              <button class="icon-btn-sm" title="Registrar salida" onclick="registerOutput(${b.batch_id})"><i class="fas fa-minus-circle"></i></button>
              <button class="icon-btn-sm btn-danger-text" title="Eliminar lote" onclick="deleteBatchConfirm(${b.batch_id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      console.error('Error cargando lotes:', error);
    }
  },

  async prepareForm() {
    try {
      const [products, suppliers] = await Promise.all([
        api.getProducts(),
        api.getSuppliers()
      ]);

      const productSelect = document.getElementById('lot-product-select');
      const supplierSelect = document.getElementById('lot-supplier-select');

      productSelect.innerHTML = '<option value="">Seleccionar producto...</option>' +
        products.map(p => `<option value="${p.sku}">${p.name}</option>`).join('');

      supplierSelect.innerHTML = '<option value="">Seleccionar proveedor...</option>' +
        suppliers.map(s => `<option value="${s.supplier_id}">${s.name}</option>`).join('');

      const today = new Date().toISOString().split('T')[0];
      document.querySelector('input[name="entry_date"]').value = today;
    } catch (error) {
      console.error('Error preparando formulario:', error);
    }
  },

  registerOutput(batchId) {
    const quantity = prompt('Ingrese cantidad a retirar:');
    if (quantity && !isNaN(quantity)) {
      showToast('Éxito', `Se registraron ${quantity} unidades de salida`, 'success');
      loadLots();
    }
  },

  async deleteConfirm(id) {
    if (!confirm('¿Estás seguro de eliminar este lote permanentemente? Esta acción eliminará también el historial de movimientos asociado.')) return;
    try {
      const res = await api.deleteBatch(id);
      if (res.ok) {
        showToast('Éxito', 'Lote eliminado', 'success');
        if (AppState.currentScreen === 'screen-lots') loadLots();
        if (AppState.currentScreen === 'screen-product-detail') {
          const sku = document.getElementById('detail-sku').textContent.replace('SKU: ', '');
          viewProductDetail(sku);
        }
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'No se pudo eliminar el lote', 'error');
      }
    } catch (error) {
      showToast('Error', 'Error de conexión', 'error');
    }
  }
};

const loadLots = LotsScreen.load.bind(LotsScreen);
const prepareLotForm = LotsScreen.prepareForm.bind(LotsScreen);
const registerOutput = LotsScreen.registerOutput.bind(LotsScreen);
const deleteBatchConfirm = LotsScreen.deleteConfirm.bind(LotsScreen);
