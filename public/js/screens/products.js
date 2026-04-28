/**
 * Products screen logic.
 */
const ProductsScreen = {
  async load() {
    try {
      const [products, categories] = await Promise.all([
        api.getProducts(),
        api.getCategories()
      ]);

      AppState.products = products;
      AppState.categories = categories;

      const grid = document.getElementById('products-grid');
      grid.innerHTML = products.map(p => {
        const stockPercent = Math.min(100, (Math.random() * 60 + 40));
        const status = stockPercent < 20 ? 'danger' : stockPercent < 50 ? 'warning' : 'ok';
        const statusText = stockPercent < 20 ? 'Crítico' : stockPercent < 50 ? 'Stock Bajo' : 'En Stock';

        return `
          <div class="product-card" onclick="viewProductDetail('${p.sku}')">
            <div class="pc-image" style="background: linear-gradient(135deg, #dbeafe, #bfdbfe);">
              <i class="fas fa-box" style="color:#3b82f6;font-size:2.5rem;"></i>
              <span class="pc-badge ${status}">${statusText}</span>
            </div>
            <div class="pc-body">
              <span class="pc-category">${p.category_name || 'General'}</span>
              <h4>${p.name}</h4>
              <p class="pc-sku">SKU: ${p.sku}</p>
              <div class="pc-stock">
                <div class="stock-bar"><div class="stock-fill" style="width:${stockPercent}%;background:${status === 'ok' ? '#10b981' : status === 'warning' ? '#f59e0b' : '#ef4444'};"></div></div>
                <span>Stock disponible</span>
              </div>
              <div class="pc-footer">
                <span class="pc-price">$${parseFloat(p.sale_price).toLocaleString()}</span>
                <span class="pc-lots">Ver detalle</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      const filterContainer = document.getElementById('category-filters');
      filterContainer.innerHTML = `
        <button class="chip active" onclick="filterProducts('all')">Todos <span class="chip-count">${products.length}</span></button>
        ${categories.map(c => `<button class="chip" onclick="filterProducts('${c.category_id}')">${c.name} <span class="chip-count">${c.product_count}</span></button>`).join('')}
      `;

      document.getElementById('count-all').textContent = products.length;
    } catch (error) {
      console.error('Error cargando productos:', error);
    }
  },

  filterProducts(category) {
    document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
    if (event && event.target) {
      event.target.closest('.chip').classList.add('active');
    }
  },

  async viewDetail(sku) {
    try {
      const product = await api.getProduct(sku);
      document.getElementById('detail-name').textContent = product.name;
      document.getElementById('detail-sku').textContent = 'SKU: ' + product.sku;
      document.getElementById('detail-category').textContent = product.category_name || 'Sin categoría';
      document.getElementById('detail-desc').textContent = product.description || 'Sin descripción';
      document.getElementById('detail-unit').textContent = 'Unidad: ' + (product.unit_abbr || 'un');
      document.getElementById('detail-min-stock').textContent = 'Stock Mínimo: ' + product.min_stock + ' ' + (product.unit_abbr || 'un');
      document.getElementById('detail-price').textContent = 'Precio: $' + parseFloat(product.sale_price).toLocaleString();
      document.getElementById('detail-breadcrumb').textContent = 'Productos / ' + product.name;

      const batches = await api.getBatches();
      const productBatches = batches.filter(b => b.sku === sku);

      document.getElementById('detail-lots-table').innerHTML = productBatches.map(b => {
        const days = getDaysRemaining(b.expiry_date);
        return `
          <tr>
            <td><strong>#${b.batch_code}</strong></td>
            <td>${formatDate(b.entry_date)}</td>
            <td>${formatDate(b.expiry_date)}</td>
            <td>${b.current_quantity}/${b.initial_quantity}</td>
            <td>${getStatusBadge(days)}</td>
            <td>
              <button class="icon-btn-sm" title="Ver lote"><i class="fas fa-eye"></i></button>
              <button class="icon-btn-sm" title="Registrar salida" onclick="registerOutput(${b.batch_id})"><i class="fas fa-minus-circle"></i></button>
              <button class="icon-btn-sm btn-danger-text" title="Eliminar lote" onclick="deleteBatchConfirm(${b.batch_id})"><i class="fas fa-trash"></i></button>
            </td>
          </tr>
        `;
      }).join('') || '<tr><td colspan="6" style="text-align:center">No hay lotes activos</td></tr>';

      document.getElementById('btn-edit-product').onclick = () => editProduct(product);
      document.getElementById('btn-delete-product').onclick = () => deleteProductConfirm(product.sku);

      navigateTo('screen-product-detail');
    } catch (error) {
      showToast('Error', 'No se pudo cargar el producto', 'error');
    }
  },

  edit(product) {
    const form = document.getElementById('new-product-form');
    document.getElementById('product-panel-title').innerHTML = `<i class="fas fa-edit"></i> Editar Producto: ${product.sku}`;
    document.getElementById('product-form-mode').value = 'edit';
    
    form.sku.value = product.sku;
    form.sku.readOnly = true; 
    form.name.value = product.name;
    form.description.value = product.description || '';
    form.category_id.value = product.category_id || '';
    form.unit_id.value = product.unit_id || 5;
    form.sale_price.value = product.sale_price;
    form.min_stock.value = product.min_stock;
    form.barcode.value = product.barcode || '';
    form.requires_refrigeration.checked = product.requires_refrigeration ? true : false;

    openNewProductPanel();
  },

  async deleteConfirm(sku) {
    if (!confirm(`¿Estás seguro de eliminar el producto ${sku}? Esta acción no se puede deshacer.`)) return;
    try {
      const res = await api.deleteProduct(sku);
      if (res.ok) {
        showToast('Éxito', 'Producto eliminado exitosamente', 'success');
        loadProducts();
        navigateTo('screen-products');
      } else {
        const err = await res.json();
        showToast('Error', err.error || 'No se pudo eliminar', 'error');
      }
    } catch (error) {
      showToast('Error', 'Error de conexión', 'error');
    }
  },

  async loadCategoriesSelect() {
    try {
      const categories = await api.getCategories();
      const select = document.getElementById('new-product-category');
      if (select) {
        select.innerHTML = '<option value="">Seleccionar...</option>' +
          categories.map(c => `<option value="${c.category_id}">${c.name}</option>`).join('');
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }
};

const loadProducts = ProductsScreen.load.bind(ProductsScreen);
const filterProducts = ProductsScreen.filterProducts.bind(ProductsScreen);
const viewProductDetail = ProductsScreen.viewDetail.bind(ProductsScreen);
const editProduct = ProductsScreen.edit.bind(ProductsScreen);
const deleteProductConfirm = ProductsScreen.deleteConfirm.bind(ProductsScreen);
const loadCategoriesSelect = ProductsScreen.loadCategoriesSelect.bind(ProductsScreen);
