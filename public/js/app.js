document.addEventListener('DOMContentLoaded', async () => {
  // Cargar datos iniciales del dashboard
  await loadDashboardData();
  
  // Configurar formularios
  setupProductForm();
  setupBatchForm();
});

async function loadDashboardData() {
  try {
    // KPIs
    const kpis = await api.getKPIs();
    updateKPIs(kpis);
    
    // Productos próximos a vencer
    const expiring = await api.getExpiringBatches(7);
    updateExpiringList(expiring);
    
    // Movimientos recientes
    const movements = await api.getRecentMovements();
    updateActivityList(movements);
    
    // Contar productos en alerta
    updateAlertBadges(expiring.length);
  } catch (error) {
    console.error('Error cargando dashboard:', error);
  }
}

function updateKPIs(kpis) {
  const kpiElements = {
    'active_products': document.querySelector('.kpi-blue .kpi-value'),
    'total_batches': document.querySelector('.kpi-green .kpi-value'),
    'expiring_soon': document.querySelector('.kpi-orange .kpi-value'),
    'critical_stock': document.querySelector('.kpi-red .kpi-value')
  };
  
  Object.keys(kpiElements).forEach(key => {
    if (kpiElements[key]) {
      kpiElements[key].textContent = kpis[key];
    }
  });
}

function updateExpiringList(batches) {
  const container = document.querySelector('.expiry-list');
  if (!container) return;
  
  container.innerHTML = batches.map(batch => {
    const daysClass = batch.days_remaining <= 0 ? 'critical' : 
                     batch.days_remaining <= 2 ? 'warning' : 'caution';
    const daysText = batch.days_remaining <= 0 ? 'Hoy' : 
                    `${batch.days_remaining} días`;
    
    return `
      <div class="expiry-item ${daysClass}">
        <div class="expiry-icon"><i class="fas fa-box"></i></div>
        <div class="expiry-info">
          <span class="expiry-name">${batch.product_name}</span>
          <span class="expiry-lot">Lote #${batch.batch_code}</span>
        </div>
        <div class="expiry-date">
          <span class="expiry-badge ${daysClass}">${daysText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateActivityList(movements) {
  const container = document.querySelector('.activity-list');
  if (!container) return;
  
  container.innerHTML = movements.slice(0, 5).map(mov => {
    const typeColors = {
      'purchase': 'green',
      'sale': 'blue', 
      'waste': 'red',
      'adjustment': 'orange',
      'adjustment_neg': 'orange'
    };
    
    return `
      <div class="activity-item">
        <div class="activity-dot ${typeColors[mov.movement_type] || 'blue'}"></div>
        <div class="activity-info">
          <span class="activity-text">
            <strong>${mov.user_name}</strong> ${mov.movement_type} de 
            <strong>${mov.quantity} ${mov.sign === '+' ? 'unid.' : 'unid.'}</strong> 
            ${mov.product_name}
          </span>
          <span class="activity-time">${new Date(mov.datetime).toLocaleString()}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateAlertBadges(count) {
  document.querySelectorAll('.badge-danger').forEach(badge => {
    badge.textContent = count;
  });
}

function setupProductForm() {
  const form = document.getElementById('new-product-form');
  if (!form) return;
  
  // Cargar categorías en el select
  api.getCategories().then(cats => {
    const select = form.querySelector('select[name="category_id"]');
    if (select) {
      select.innerHTML = '<option value="">Seleccionar...</option>' +
        cats.map(c => `<option value="${c.category_id}">${c.name}</option>`).join('');
    }
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
      const res = await api.createProduct(data);
      if (res.ok) {
        showToast('Producto creado exitosamente', 'success');
        closeNewProductPanel();
        form.reset();
        loadDashboardData(); // Recargar
      } else {
        showToast('Error al crear producto', 'error');
      }
    } catch (err) {
      showToast('Error de conexión', 'error');
    }
  });
}

function setupBatchForm() {
  const form = document.querySelector('.lot-form');
  if (!form) return;
  
  // Cargar productos en selects
  api.getProducts().then(products => {
    const selects = document.querySelectorAll('select[name="product_sku"]');
    selects.forEach(select => {
      select.innerHTML = '<option value="">Seleccionar producto...</option>' +
        products.map(p => `<option value="${p.sku}">${p.name} (${p.sku})</option>`).join('');
    });
  });
  
  // Cargar proveedores
  api.getSuppliers().then(suppliers => {
    const selects = document.querySelectorAll('select[name="supplier_id"]');
    selects.forEach(select => {
      select.innerHTML = '<option value="">Seleccionar proveedor...</option>' +
        suppliers.map(s => `<option value="${s.supplier_id}">${s.name}</option>`).join('');
    });
  });
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    
    try {
      const res = await api.createBatch(data);
      if (res.ok) {
        showToast('Lote registrado exitosamente', 'success');
        navigateTo('screen-lots');
        form.reset();
      }
    } catch (err) {
      showToast('Error al registrar lote', 'error');
    }
  });
}

// Función global para toasts (compatibilidad con utils.js existente)
function showToast(title, type = 'success') {
  if (window.showToast && window.showToast !== showToast) {
    window.showToast(title, type === 'success' ? 'Operación exitosa' : 'Error', type);
  } else {
    alert(title);
  }
}