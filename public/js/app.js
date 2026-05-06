/**
 * Application entry point.
 * Initializes forms and global behavior.
 */
document.addEventListener('DOMContentLoaded', () => {
  if (AppState.token && AppState.user) {
    updateSidebarUser(AppState.user);
    navigateTo('screen-dashboard');
  }

  const lotForm = document.getElementById('lot-form');
  if (lotForm) {
    lotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(lotForm);
      const data = Object.fromEntries(formData);

      data.supplier_id = data.supplier_id || null;
      data.initial_quantity = parseFloat(data.initial_quantity);
      data.unit_cost = parseFloat(data.unit_cost) || 0;

      try {
        const res = await api.createBatch(data);
        if (res.ok) {
          showToast('Éxito', 'Lote registrado correctamente', 'success');
          lotForm.reset();
          navigateTo('screen-lots');
        } else {
          const err = await res.json();
          showToast('Error', err.error || 'No se pudo registrar el lote', 'error');
        }
      } catch (error) {
        showToast('Error', 'Error de conexión', 'error');
      }
    });
  }

  const productForm = document.getElementById('new-product-form');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(productForm);
      const data = Object.fromEntries(formData);

      data.sale_price = parseFloat(data.sale_price);
      data.min_stock = parseFloat(data.min_stock) || 0;
      data.category_id = data.category_id || null;
      data.requires_refrigeration = data.requires_refrigeration ? true : false;

      try {
        const isEdit = data.form_mode === 'edit';
        const res = isEdit 
          ? await api.updateProduct(data.sku, data)
          : await api.createProduct(data);

        if (res.ok) {
          showToast('Éxito', isEdit ? 'Producto actualizado' : 'Producto creado', 'success');
          closeNewProductPanel();
          productForm.reset();
          loadProducts();
          if (isEdit) navigateTo('screen-products');
        } else {
          const err = await res.json();
          showToast('Error', err.error || 'No se pudo crear el producto', 'error');
        }
      } catch (error) {
        showToast('Error', 'Error de conexión', 'error');
      }
    });
  }
});
