// Cargar datos del dashboard
async function loadDashboard() {
  try {
    // KPIs
    const kpis = await api.getKPIs();
    document.getElementById('kpi-products').textContent = kpis.active_products;
    document.getElementById('kpi-batches').textContent = kpis.total_batches;
    document.getElementById('kpi-expiring').textContent = kpis.expiring_soon;
    document.getElementById('kpi-critical').textContent = kpis.critical_stock;

    // Actualizar badges
    document.querySelectorAll('[id^="nav-badge-products"]').forEach(b => b.textContent = kpis.active_products);
    document.querySelectorAll('[id^="nav-badge-alerts"]').forEach(b => b.textContent = kpis.expiring_soon);
    document.getElementById('banner-alerts').textContent = kpis.expiring_soon + ' alertas';
    document.getElementById('banner-expiring').textContent = kpis.expiring_soon + ' productos';
    document.getElementById('login-stat-products').textContent = kpis.active_products + ' productos';
    document.getElementById('login-stat-alerts').textContent = kpis.expiring_soon + ' alertas';

    // Próximos a vencer
    const expiring = await api.getExpiringBatches(7);
    const expiryList = document.getElementById('dashboard-expiry-list');
    expiryList.innerHTML = expiring.map(batch => {
      const days = getDaysRemaining(batch.expiry_date);
      const statusClass = days <= 0 ? 'critical' : days <= 2 ? 'warning' : 'caution';
      const daysText = days <= 0 ? 'Hoy' : days + ' días';

      return `
        <div class="expiry-item ${statusClass}">
          <div class="expiry-icon"><i class="fas fa-box"></i></div>
          <div class="expiry-info">
            <span class="expiry-name">${batch.product_name}</span>
            <span class="expiry-lot">Lote #${batch.batch_code}</span>
          </div>
          <div class="expiry-date">
            <span class="expiry-badge ${statusClass}">${daysText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Actividad reciente
    const movements = await api.getRecentMovements();
    const activityList = document.getElementById('dashboard-activity-list');
    activityList.innerHTML = movements.slice(0, 5).map(mov => {
      const colors = { purchase: 'green', sale: 'blue', waste: 'red', adjustment: 'orange' };
      return `
        <div class="activity-item">
          <div class="activity-dot ${colors[mov.movement_type] || 'blue'}"></div>
          <div class="activity-info">
            <span class="activity-text"><strong>${mov.user_name}</strong> ${mov.movement_type} de <strong>${mov.quantity} unid.</strong> ${mov.product_name}</span>
            <span class="activity-time">${formatDate(mov.datetime)}</span>
          </div>
        </div>
      `;
    }).join('');

    // Cargar estadísticas para gráficos
    const [movementStats, categoryStats] = await Promise.all([
      api.getMovementStats(),
      api.getCategoryStats()
    ]);

    renderMovementChart(movementStats);
    renderCategoryChart(categoryStats);

    // Animar números
    animateValue('kpi-products', 0, kpis.active_products, 1000);
    animateValue('kpi-batches', 0, kpis.total_batches, 1000);

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    showToast('Error', 'No se pudieron cargar los datos', 'error');
  }
}

function renderMovementChart(data) {
  const svg = document.querySelector('.line-chart-svg');
  if (!svg) return;

  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const today = new Date();
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      last7Days.push({
          dateStr: date.toISOString().split('T')[0],
          dayName: days[date.getDay()]
      });
  }

  // Mapear datos a los últimos 7 días
  const plotData = last7Days.map(d => {
      const dayData = data.find(item => item.date.startsWith(d.dateStr)) || { entries: 0, exits: 0 };
      return { day: d.dayName, entries: dayData.entries, exits: dayData.exits };
  });

  const maxVal = Math.max(...plotData.map(d => Math.max(d.entries, d.exits)), 10);
  const width = 600;
  const height = 200;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const getX = (i) => padding + (i * chartWidth) / 6;
  const getY = (val) => (height - padding) - (val * chartHeight) / maxVal;

  let entryPath = `M ${getX(0)},${getY(plotData[0].entries)}`;
  let exitPath = `M ${getX(0)},${getY(plotData[0].exits)}`;
  let entryArea = `M ${getX(0)},${height - padding} L ${getX(0)},${getY(plotData[0].entries)}`;
  let exitArea = `M ${getX(0)},${height - padding} L ${getX(0)},${getY(plotData[0].exits)}`;

  let entryPoints = '';
  let exitPoints = '';
  let labels = '';

  plotData.forEach((d, i) => {
      const x = getX(i);
      const yEnt = getY(d.entries);
      const yExt = getY(d.exits);

      if (i > 0) {
          entryPath += ` L ${x},${yEnt}`;
          exitPath += ` L ${x},${yExt}`;
      }
      entryArea += ` L ${x},${yEnt}`;
      exitArea += ` L ${x},${yExt}`;
      
      entryPoints += `<circle cx="${x}" cy="${yEnt}" r="4" fill="#10b981" />`;
      exitPoints += `<circle cx="${x}" cy="${yExt}" r="4" fill="#6366f1" />`;
      labels += `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="var(--text-muted)" font-size="11">${d.day}</text>`;
  });

  entryArea += ` L ${getX(6)},${height - padding} Z`;
  exitArea += ` L ${getX(6)},${height - padding} Z`;

  svg.innerHTML = `
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.2" />
        <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
      </linearGradient>
      <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style="stop-color:#6366f1;stop-opacity:0.2" />
        <stop offset="100%" style="stop-color:#6366f1;stop-opacity:0" />
      </linearGradient>
    </defs>
    <path d="${entryArea}" fill="url(#grad1)" />
    <path d="${entryPath}" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
    <path d="${exitArea}" fill="url(#grad2)" />
    <path d="${exitPath}" fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" />
    ${entryPoints}
    ${exitPoints}
    ${labels}
  `;
}

function renderCategoryChart(data) {
  const total = data.reduce((acc, curr) => acc + curr.product_count, 0);
  document.getElementById('donut-total').textContent = total;

  const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
  const legend = document.getElementById('categories-legend');
  const svg = document.querySelector('.donut-svg');
  if (!svg || !legend) return;

  legend.innerHTML = data.map((cat, i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${colors[i % colors.length]}"></span>
      <span class="legend-label">${cat.name}</span>
      <span class="legend-val">${cat.product_count}</span>
    </div>
  `).join('');

  // Update SVG segments
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  // Clear existing segments (except background circle and texts)
  const segments = svg.querySelectorAll('.donut-seg');
  segments.forEach(s => s.remove());

  data.forEach((cat, i) => {
      if (cat.product_count === 0) return;
      const percent = cat.product_count / total;
      const strokeDash = percent * circumference;
      
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", "100");
      circle.setAttribute("cy", "100");
      circle.setAttribute("r", "80");
      circle.setAttribute("fill", "none");
      circle.setAttribute("stroke", colors[i % colors.length]);
      circle.setAttribute("stroke-width", "24");
      circle.setAttribute("stroke-dasharray", `${strokeDash} ${circumference}`);
      circle.setAttribute("stroke-dashoffset", -offset);
      circle.setAttribute("class", "donut-seg");
      
      svg.appendChild(circle);
      offset += strokeDash;
  });
  
  // Re-append text to keep it on top
  const texts = svg.querySelectorAll('text');
  texts.forEach(t => svg.appendChild(t));

  // Trigger GSAP animation if available
  if (window.GSAPIntegration) {
      window.GSAPIntegration.animateDashboardExt(document.getElementById('screen-dashboard'));
  }
}


// Cargar productos
async function loadProducts() {
  try {
    const [products, categories] = await Promise.all([
      api.getProducts(),
      api.getCategories()
    ]);

    AppState.products = products;
    AppState.categories = categories;

    // Renderizar grid
    const grid = document.getElementById('products-grid');
    grid.innerHTML = products.map(p => {
      const stockPercent = Math.min(100, (Math.random() * 60 + 40)); // Simulado hasta tener stock real
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

    // Filtros de categoría
    const filterContainer = document.getElementById('category-filters');
    filterContainer.innerHTML = `
      <button class="chip active" onclick="filterProducts('all')">Todos <span class="chip-count">${products.length}</span></button>
      ${categories.map(c => `<button class="chip" onclick="filterProducts('${c.category_id}')">${c.name} <span class="chip-count">${c.product_count}</span></button>`).join('')}
    `;

    document.getElementById('count-all').textContent = products.length;

  } catch (error) {
    console.error('Error cargando productos:', error);
  }
}

function filterProducts(category) {
  // Implementar filtrado visual aquí
  document.querySelectorAll('#category-filters .chip').forEach(c => c.classList.remove('active'));
  event.target.closest('.chip').classList.add('active');
}

async function viewProductDetail(sku) {
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

    // Cargar lotes del producto
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

    // Botones de acción
    document.getElementById('btn-edit-product').onclick = () => editProduct(product);
    document.getElementById('btn-delete-product').onclick = () => deleteProductConfirm(product.sku);

    navigateTo('screen-product-detail');
  } catch (error) {
    showToast('Error', 'No se pudo cargar el producto', 'error');
  }
}

// Cargar lotes
async function loadLots() {
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
}

// Preparar formulario de lotes
async function prepareLotForm() {
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

    // Setear fecha de hoy
    const today = new Date().toISOString().split('T')[0];
    document.querySelector('input[name="entry_date"]').value = today;

  } catch (error) {
    console.error('Error preparando formulario:', error);
  }
}

// Crear lote
document.addEventListener('DOMContentLoaded', () => {
  const lotForm = document.getElementById('lot-form');
  if (lotForm) {
    lotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(lotForm);
      const data = Object.fromEntries(formData);

      // Convertir a números donde sea necesario
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

  // Crear producto
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

// Cargar alertas
async function loadAlerts() {
  try {
    const expiring = await api.getExpiringBatches(30);

    document.getElementById('alert-expired').textContent = expiring.filter(b => getDaysRemaining(b.expiry_date) < 0).length;
    document.getElementById('alert-today').textContent = expiring.filter(b => getDaysRemaining(b.expiry_date) === 0).length;
    document.getElementById('alert-week').textContent = expiring.filter(b => {
      const d = getDaysRemaining(b.expiry_date);
      return d > 0 && d <= 7;
    }).length;
    document.getElementById('alert-stock').textContent = '3'; // Simulado

    const container = document.getElementById('alerts-container');
    container.innerHTML = expiring.map(batch => {
      const days = getDaysRemaining(batch.expiry_date);
      let typeClass = 'alert-warning';
      let icon = 'fa-clock';
      let title = 'Próximo a Vencer';

      if (days < 0) {
        typeClass = 'alert-critical';
        icon = 'fa-skull-crossbones';
        title = 'Producto VENCIDO';
      } else if (days === 0) {
        typeClass = 'alert-danger';
        icon = 'fa-exclamation-circle';
        title = 'Vence HOY';
      }

      return `
        <div class="alert-item ${typeClass}">
          <div class="alert-icon-wrap ${days < 0 ? 'critical' : days === 0 ? 'danger' : 'warning'}">
            <i class="fas ${icon}"></i>
          </div>
          <div class="alert-content">
            <div class="alert-header-row">
              <h4>${title} - ${batch.product_name}</h4>
              <span class="alert-time">${formatDate(batch.expiry_date)}</span>
            </div>
            <p>Lote #${batch.batch_code} - ${days < 0 ? 'Vencido hace ' + Math.abs(days) + ' días' : days === 0 ? 'Vence hoy' : days + ' días restantes'}</p>
            <div class="alert-actions">
              <button class="btn-outline btn-sm">Ver Lote</button>
              ${days < 0 ? '<button class="btn-danger btn-sm">Registrar Merma</button>' : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (error) {
    console.error('Error cargando alertas:', error);
  }
}

// Cargar proveedores
async function loadSuppliers() {
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

// Cargar categorías en select
async function loadCategoriesSelect() {
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

// CRUD: Editar producto
function editProduct(product) {
  const form = document.getElementById('new-product-form');
  document.getElementById('product-panel-title').innerHTML = `<i class="fas fa-edit"></i> Editar Producto: ${product.sku}`;
  document.getElementById('product-form-mode').value = 'edit';
  
  // Llenar campos
  form.sku.value = product.sku;
  form.sku.readOnly = true; // No permitir cambiar SKU en edición
  form.name.value = product.name;
  form.description.value = product.description || '';
  form.category_id.value = product.category_id || '';
  form.unit_id.value = product.unit_id || 5;
  form.sale_price.value = product.sale_price;
  form.min_stock.value = product.min_stock;
  form.barcode.value = product.barcode || '';
  form.requires_refrigeration.checked = product.requires_refrigeration ? true : false;

  openNewProductPanel();
}

// CRUD: Eliminar producto
async function deleteProductConfirm(sku) {
  if (confirm(`¿Estás seguro de eliminar el producto ${sku}? This cannot be undone.`)) {
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
  }
}

// Animación de números
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    obj.innerHTML = Math.floor(progress * (end - start) + start);
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

// Registrar salida (simulado)
function registerOutput(batchId) {
  const quantity = prompt('Ingrese cantidad a retirar:');
  if (quantity && !isNaN(quantity)) {
    showToast('Éxito', `Se registraron ${quantity} unidades de salida`, 'success');
    loadLots(); // Recargar
  }
}

// Eliminar lote
async function deleteBatchConfirm(id) {
  if (confirm('¿Estás seguro de eliminar este lote permanentemente? Esta acción eliminará también el historial de movimientos asociado.')) {
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
}