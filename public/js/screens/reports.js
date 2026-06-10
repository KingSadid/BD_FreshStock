const ReportsScreen = {
  currentTab: 'valuation',

  async load() {
    this.initTabs();
    this.initFilters();
    await this.loadCategories();
    await this.loadMovementTypes();
    await this.loadReport('valuation');
  },

  initTabs() {
    document.querySelectorAll('.report-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.report-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const reportId = tab.dataset.report;
        document.getElementById(`report-${reportId}`).classList.add('active');
        this.currentTab = reportId;
        this.loadReport(reportId);
      });
    });
  },

  initFilters() {
    const btnMovements = document.getElementById('movements-apply-filters');
    if (btnMovements) {
      btnMovements.addEventListener('click', () => this.loadReport('movements'));
    }

    const btnWaste = document.getElementById('waste-apply-filters');
    if (btnWaste) {
      btnWaste.addEventListener('click', () => this.loadReport('waste'));
    }

    const categoryFilter = document.getElementById('valuation-category-filter');
    if (categoryFilter) {
      categoryFilter.addEventListener('change', () => this.loadReport('valuation'));
    }
  },

  async loadCategories() {
    try {
      const categories = await api.getCategories();
      const select = document.getElementById('valuation-category-filter');
      if (select) {
        select.innerHTML = '<option value="">Todas las categorías</option>' +
          categories.map(c => `<option value="${c.category_id}">${c.name}</option>`).join('');
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  },

  async loadMovementTypes() {
    try {
      const types = await api.getReportMovementTypes();
      const select = document.getElementById('movements-type-filter');
      if (select) {
        select.innerHTML = '<option value="">Todos los tipos</option>' +
          types.map(t => `<option value="${t.movement_type_id}">${t.name} (${t.sign})</option>`).join('');
      }
    } catch (error) {
      console.error('Error cargando tipos de movimiento:', error);
    }
  },

  async loadReport(reportId) {
    switch (reportId) {
      case 'valuation':
        await this.loadValuation();
        break;
      case 'movements':
        await this.loadMovements();
        break;
      case 'waste':
        await this.loadWaste();
        break;
      case 'firebase':
        await this.loadFirebase();
        break;
    }
  },

  async loadValuation() {
    try {
      const categoryId = document.getElementById('valuation-category-filter')?.value || '';
      const data = await api.getReportInventoryValuation(categoryId);

      const summaryEl = document.getElementById('valuation-summary');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="summary-card">
            <div class="summary-icon" style="background: #dbeafe; color: #3b82f6;"><i class="fas fa-boxes"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.products.length}</span>
              <span class="summary-label">Productos</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-dollar-sign"></i></div>
            <div class="summary-data">
              <span class="summary-value">$${this.formatNumber(data.totals.grand_total_cost)}</span>
              <span class="summary-label">Valor Costo Total</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-tag"></i></div>
            <div class="summary-data">
              <span class="summary-value">$${this.formatNumber(data.totals.grand_total_sale)}</span>
              <span class="summary-label">Valor Venta Total</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fas fa-chart-line"></i></div>
            <div class="summary-data">
              <span class="summary-value">$${this.formatNumber(data.totals.grand_total_sale - data.totals.grand_total_cost)}</span>
              <span class="summary-label">Margen Potencial</span>
            </div>
          </div>
        `;
      }

      const tbody = document.getElementById('valuation-table-body');
      if (tbody) {
        if (data.products.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay datos de inventario</td></tr>';
          return;
        }
        tbody.innerHTML = data.products.map(p => {
          const margin = p.total_cost_value > 0 ? ((p.total_sale_value - p.total_cost_value) / p.total_cost_value * 100).toFixed(1) : 0;
          return `
            <tr>
              <td><strong>${p.sku}</strong></td>
              <td>${p.product_name}</td>
              <td>${p.category_name || '-'}</td>
              <td>${p.total_stock} ${p.unit_abbr || ''}</td>
              <td>$${this.formatNumber(p.total_cost_value)}</td>
              <td>$${this.formatNumber(p.total_sale_value)}</td>
              <td><span class="badge badge-success">${margin}%</span></td>
            </tr>
          `;
        }).join('');
      }
    } catch (error) {
      console.error('Error cargando valoración:', error);
    }
  },

  async loadMovements() {
    try {
      const filters = {
        from: document.getElementById('movements-date-from')?.value || '',
        to: document.getElementById('movements-date-to')?.value || '',
        movement_type_id: document.getElementById('movements-type-filter')?.value || '',
        limit: 100
      };

      const data = await api.getReportMovementHistory(filters);

      const tbody = document.getElementById('movements-table-body');
      if (tbody) {
        if (data.movements.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="text-center">No hay movimientos en el período seleccionado</td></tr>';
          return;
        }
        tbody.innerHTML = data.movements.map(m => {
          const signClass = m.sign === '+' ? 'text-success' : 'text-danger';
          const signIcon = m.sign === '+' ? 'fa-arrow-up' : 'fa-arrow-down';
          const date = new Date(m.datetime).toLocaleString('es-CO');
          return `
            <tr>
              <td>${date}</td>
              <td><span class="badge ${m.sign === '+' ? 'badge-success' : 'badge-danger'}">${m.movement_type}</span></td>
              <td>${m.product_name}</td>
              <td>${m.batch_code}</td>
              <td class="${signClass}"><i class="fas ${signIcon}"></i> ${m.quantity}</td>
              <td>${m.previous_quantity}</td>
              <td>${m.posterior_quantity}</td>
              <td>${m.user_name}</td>
              <td>${m.reason || '-'}</td>
            </tr>
          `;
        }).join('');
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  },

  async loadWaste() {
    try {
      const filters = {
        from: document.getElementById('waste-date-from')?.value || '',
        to: document.getElementById('waste-date-to')?.value || ''
      };

      const data = await api.getReportWaste(filters);

      const summaryEl = document.getElementById('waste-summary');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="summary-card">
            <div class="summary-icon" style="background: #fee2e2; color: #dc2626;"><i class="fas fa-skull-crossbones"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.summary.total_waste_events}</span>
              <span class="summary-label">Eventos de Merma</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-box"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.summary.total_units_wasted}</span>
              <span class="summary-label">Unidades Perdidas</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fee2e2; color: #dc2626;"><i class="fas fa-dollar-sign"></i></div>
            <div class="summary-data">
              <span class="summary-value">$${this.formatNumber(data.summary.total_cost_loss)}</span>
              <span class="summary-label">Pérdida en Costo</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-tag"></i></div>
            <div class="summary-data">
              <span class="summary-value">$${this.formatNumber(data.summary.total_sale_value_loss)}</span>
              <span class="summary-label">Pérdida en Venta</span>
            </div>
          </div>
        `;
      }

      const tbody = document.getElementById('waste-table-body');
      if (tbody) {
        if (data.details.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay registros de merma</td></tr>';
        } else {
          tbody.innerHTML = data.details.map(w => {
            const date = new Date(w.datetime).toLocaleString('es-CO');
            return `
              <tr>
                <td>${date}</td>
                <td>${w.product_name}</td>
                <td>${w.batch_code}</td>
                <td>${w.quantity}</td>
                <td>$${this.formatNumber(w.waste_cost)}</td>
                <td>$${this.formatNumber(w.waste_sale_value)}</td>
                <td>${w.user_name}</td>
              </tr>
            `;
          }).join('');
        }
      }

      const chartEl = document.getElementById('waste-category-chart');
      if (chartEl) {
        if (data.byCategory.length === 0) {
          chartEl.innerHTML = '<p class="text-center" style="padding: 2rem; color: var(--text-muted);">No hay datos de merma por categoría</p>';
        } else {
          const maxCost = Math.max(...data.byCategory.map(c => c.cost_loss), 1);
          chartEl.innerHTML = `
            <div class="waste-category-bars">
              ${data.byCategory.map(c => {
                const pct = (c.cost_loss / maxCost * 100).toFixed(0);
                return `
                  <div class="waste-bar-item">
                    <div class="waste-bar-label">
                      <span>${c.category_name || 'Sin categoría'}</span>
                      <span>$${this.formatNumber(c.cost_loss)} (${c.units_wasted} unid.)</span>
                    </div>
                    <div class="waste-bar-track">
                      <div class="waste-bar-fill" style="width: ${pct}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error cargando reporte de merma:', error);
    }
  },

  async loadFirebase() {
    try {
      const data = await api.getFirebaseReport();

      
      const summaryEl = document.getElementById('firebase-summary');
      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="summary-card">
            <div class="summary-icon" style="background: #dbeafe; color: #3b82f6;"><i class="fas fa-database"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.total_events}</span>
              <span class="summary-label">Eventos Totales</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #d1fae5; color: #059669;"><i class="fas fa-layer-group"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.event_types}</span>
              <span class="summary-label">Tipos de Evento</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #fef3c7; color: #d97706;"><i class="fas fa-calendar-day"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.timeline_7d.reduce((a, [,c]) => a + c, 0)}</span>
              <span class="summary-label">Esta Semana</span>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon" style="background: #ede9fe; color: #7c3aed;"><i class="fas fa-fire"></i></div>
            <div class="summary-data">
              <span class="summary-value">${data.by_type[0]?.count || 0}</span>
              <span class="summary-label">Más Frecuente</span>
            </div>
          </div>
        `;
      }

      
      const typesEl = document.getElementById('firebase-types-chart');
      if (typesEl) {
        if (data.by_type.length === 0) {
          typesEl.innerHTML = '<p class="text-center" style="padding:2rem;color:var(--text-muted)">No hay eventos registrados</p>';
        } else {
          const maxCount = Math.max(...data.by_type.map(t => t.count), 1);
          const typeColors = {
            inventory_movement: '#10b981',
            product_view: '#6366f1',
            user_session: '#3b82f6',
            expiry_event: '#ef4444',
            stock_snapshot: '#f59e0b'
          };
          const typeIcons = {
            inventory_movement: 'fa-exchange-alt',
            product_view: 'fa-eye',
            user_session: 'fa-user-clock',
            expiry_event: 'fa-calendar-times',
            stock_snapshot: 'fa-boxes'
          };
          const typeLabels = {
            inventory_movement: 'Movimientos',
            product_view: 'Vistas Producto',
            user_session: 'Sesiones',
            expiry_event: 'Vencimientos',
            stock_snapshot: 'Snapshots Stock'
          };

          typesEl.innerHTML = `
            <div class="firebase-types-grid">
              ${data.by_type.map(t => {
                const pct = (t.count / maxCount * 100).toFixed(0);
                const color = typeColors[t.type] || '#8b5cf6';
                const icon = typeIcons[t.type] || 'fa-circle';
                const label = typeLabels[t.type] || t.type;
                return `
                  <div class="firebase-type-card" style="border-left-color: ${color};">
                    <div class="ft-icon" style="background: ${color}20; color: ${color};">
                      <i class="fas ${icon}"></i>
                    </div>
                    <div class="ft-info">
                      <span class="ft-label">${label}</span>
                      <span class="ft-count">${t.count} eventos</span>
                      <div class="ft-bar-track">
                        <div class="ft-bar-fill" style="width: ${pct}%; background: ${color};"></div>
                      </div>
                    </div>
                    <span class="ft-pct">${t.percentage}%</span>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }
      }

      
      const donutTotal = document.getElementById('firebase-total-events');
      if (donutTotal) donutTotal.textContent = data.total_events;

      const donutSvg = document.getElementById('firebase-donut-svg');
      const legendEl = document.getElementById('firebase-legend');
      if (donutSvg && legendEl) {
        const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];
        const radius = 80;
        const circumference = 2 * Math.PI * radius;
        let offset = 0;

        
        donutSvg.querySelectorAll('.donut-seg-firebase').forEach(s => s.remove());

        const legendItems = [];
        data.by_type.forEach((t, i) => {
          const pct = t.count / Math.max(data.total_events, 1);
          const strokeDash = pct * circumference;
          const color = colors[i % colors.length];

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', '100');
          circle.setAttribute('cy', '100');
          circle.setAttribute('r', '80');
          circle.setAttribute('fill', 'none');
          circle.setAttribute('stroke', color);
          circle.setAttribute('stroke-width', '24');
          circle.setAttribute('stroke-dasharray', `${strokeDash} ${circumference}`);
          circle.setAttribute('stroke-dashoffset', -offset);
          circle.setAttribute('class', 'donut-seg-firebase');
          donutSvg.appendChild(circle);
          offset += strokeDash;

          legendItems.push(`
            <div class="legend-item">
              <span class="legend-dot" style="background:${color}"></span>
              <span class="legend-label">${t.type}</span>
              <span class="legend-val">${t.count}</span>
            </div>
          `);
        });

        
        const texts = donutSvg.querySelectorAll('text');
        texts.forEach(t => donutSvg.appendChild(t));

        legendEl.innerHTML = legendItems.join('');
      }

      
      const timelineEl = document.getElementById('firebase-timeline-chart');
      if (timelineEl) {
        if (data.timeline_7d.length === 0 || data.timeline_7d.every(([,c]) => c === 0)) {
          timelineEl.innerHTML = '<p class="text-center" style="padding:2rem;color:var(--text-muted)">No hay datos de timeline</p>';
        } else {
          const maxVal = Math.max(...data.timeline_7d.map(([,c]) => c), 1);
          const days = data.timeline_7d.map(([date]) => {
            const d = new Date(date);
            return ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'][d.getDay()];
          });

          const barHtml = data.timeline_7d.map(([date, count], i) => {
            const pct = (count / maxVal * 100).toFixed(0);
            const dayName = days[i];
            return `
              <div class="timeline-bar-item">
                <div class="timeline-bar-track">
                  <div class="timeline-bar-fill" style="height: ${pct}%;"></div>
                </div>
                <span class="timeline-bar-day">${dayName}</span>
                <span class="timeline-bar-val">${count}</span>
              </div>
            `;
          }).join('');

          timelineEl.innerHTML = `<div class="timeline-bars">${barHtml}</div>`;
        }
      }

      
      const recentEl = document.getElementById('firebase-recent-events');
      if (recentEl) {
        if (data.recent_events.length === 0) {
          recentEl.innerHTML = '<p class="text-center" style="padding:1rem;color:var(--text-muted)">No hay eventos recientes</p>';
        } else {
          const eventColors = {
            inventory_movement: 'green',
            product_view: 'blue',
            user_session: 'purple',
            expiry_event: 'red',
            stock_snapshot: 'orange'
          };
          recentEl.innerHTML = data.recent_events.slice(0, 10).map(e => {
            const color = eventColors[e.event_type] || 'blue';
            const date = e.timestamp ? new Date(e.timestamp).toLocaleString('es-CO') : 'N/A';
            return `
              <div class="activity-item">
                <div class="activity-dot ${color}"></div>
                <div class="activity-info">
                  <span class="activity-text"><strong>${e.event_type}</strong> — ${e.user_id || 'Sistema'}</span>
                  <span class="activity-time">${date}</span>
                </div>
              </div>
            `;
          }).join('');
        }
      }
    } catch (error) {
      console.error('Error cargando reporte Firebase:', error);
      showToast('Error', 'No se pudo cargar el reporte de Firebase', 'error');
    }
  },

  async loadMySQLVerification() {
    const container = document.getElementById('mysql-verification-content');
    if (!container) return;

    container.innerHTML = `
      <div class="mysql-loading">
        <div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div>
        <p>Consultando entidades en MySQL...</p>
      </div>
    `;

    try {
      const data = await api.getMySQLVerification();

      const movCount = data.counts.movements?.total || 0;
      const alertCount = data.counts.alerts?.total || 0;
      const sessCount = data.counts.sessions?.total || 0;
      const movDate = data.counts.movements?.last_date ? new Date(data.counts.movements.last_date).toLocaleString('es-CO') : 'Sin registros';
      const alertDate = data.counts.alerts?.last_date ? new Date(data.counts.alerts.last_date).toLocaleString('es-CO') : 'Sin registros';
      const sessDate = data.counts.sessions?.last_date ? new Date(data.counts.sessions.last_date).toLocaleString('es-CO') : 'Sin registros';

      const hasData = movCount > 0 || alertCount > 0 || sessCount > 0;

      container.innerHTML = `
        <div class="mysql-verify-section">
          <!-- KPIs de conteo -->
          <div class="mysql-summary-row">
            <div class="mysql-kpi-card ${movCount > 0 ? 'sync-ok' : 'sync-empty'}">
              <div class="mysql-kpi-icon"><i class="fas fa-exchange-alt"></i></div>
              <div class="mysql-kpi-data">
                <span class="mysql-kpi-value">${movCount}</span>
                <span class="mysql-kpi-label">Movimientos de Inventario Importados</span>
                <span class="mysql-kpi-meta">Último: ${movDate}</span>
              </div>
              ${movCount > 0 ? '<span class="sync-badge ok"><i class="fas fa-check-circle"></i> Sincronizado</span>' : '<span class="sync-badge empty">Pendiente</span>'}
            </div>
            <div class="mysql-kpi-card ${alertCount > 0 ? 'sync-ok' : 'sync-empty'}">
              <div class="mysql-kpi-icon"><i class="fas fa-bell"></i></div>
              <div class="mysql-kpi-data">
                <span class="mysql-kpi-value">${alertCount}</span>
                <span class="mysql-kpi-label">Alertas de Vencimiento Importadas</span>
                <span class="mysql-kpi-meta">Último: ${alertDate}</span>
              </div>
              ${alertCount > 0 ? '<span class="sync-badge ok"><i class="fas fa-check-circle"></i> Sincronizado</span>' : '<span class="sync-badge empty">Pendiente</span>'}
            </div>
            <div class="mysql-kpi-card ${sessCount > 0 ? 'sync-ok' : 'sync-empty'}">
              <div class="mysql-kpi-icon"><i class="fas fa-user-clock"></i></div>
              <div class="mysql-kpi-data">
                <span class="mysql-kpi-value">${sessCount}</span>
                <span class="mysql-kpi-label">Sesiones de Usuario Importadas</span>
                <span class="mysql-kpi-meta">Último: ${sessDate}</span>
              </div>
              ${sessCount > 0 ? '<span class="sync-badge ok"><i class="fas fa-check-circle"></i> Sincronizado</span>' : '<span class="sync-badge empty">Pendiente</span>'}
            </div>
          </div>

          ${!hasData ? '<div class="mysql-no-data"><i class="fas fa-info-circle"></i> No se encontraron registros importados desde Firebase. Ejecuta el proceso ETL para sincronizar los datos.</div>' : ''}

          <!-- Tabla Movimientos -->
          ${data.movements.length > 0 ? `
          <div class="mysql-table-section">
            <h4><i class="fas fa-exchange-alt" style="color: #6366f1;"></i> Últimos Movimientos Importados</h4>
            <div class="table-responsive">
              <table class="data-table mysql-verify-table">
                <thead>
                  <tr>
                    <th>ID Movimiento</th>
                    <th>ID Lote</th>
                    <th>Tipo</th>
                    <th>Cantidad</th>
                    <th>Cantidad Anterior</th>
                    <th>Cantidad Posterior</th>
                    <th>Razón Documentada</th>
                    <th>Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.movements.map(m => `
                    <tr>
                      <td><strong>#${m.movement_id}</strong></td>
                      <td>${m.batch_id}</td>
                      <td><span class="badge badge-info">${m.movement_type}</span></td>
                      <td>${m.quantity}</td>
                      <td>${m.previous_quantity}</td>
                      <td>${m.posterior_quantity}</td>
                      <td class="text-muted">${m.reason}</td>
                      <td>${new Date(m.datetime).toLocaleString('es-CO')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}

          <!-- Tabla Alertas -->
          ${data.alerts.length > 0 ? `
          <div class="mysql-table-section">
            <h4><i class="fas fa-bell" style="color: #ef4444;"></i> Últimas Alertas Importadas</h4>
            <div class="table-responsive">
              <table class="data-table mysql-verify-table">
                <thead>
                  <tr>
                    <th>ID Alerta</th>
                    <th>Tipo de Alerta</th>
                    <th>Prioridad</th>
                    <th>Título</th>
                    <th>Mensaje</th>
                    <th>Estado</th>
                    <th>Fecha y Hora</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.alerts.map(a => `
                    <tr>
                      <td><strong>#${a.alert_id}</strong></td>
                      <td>${a.alert_type}</td>
                      <td>${a.priority}</td>
                      <td>${a.title}</td>
                      <td class="text-muted">${a.message}</td>
                      <td>${a.is_read ? '<span class="badge badge-success">Leído</span>' : '<span class="badge badge-warning">Pendiente</span>'}</td>
                      <td>${new Date(a.created_at).toLocaleString('es-CO')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}

          <!-- Tabla Sesiones -->
          ${data.sessions.length > 0 ? `
          <div class="mysql-table-section">
            <h4><i class="fas fa-user-clock" style="color: #3b82f6;"></i> Últimas Sesiones Importadas</h4>
            <div class="table-responsive">
              <table class="data-table mysql-verify-table">
                <thead>
                  <tr>
                    <th>ID Sesión</th>
                    <th>ID Usuario</th>
                    <th>Dirección IP</th>
                    <th>Agente de Usuario</th>
                    <th>Fecha y Hora Inicio</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.sessions.map(s => `
                    <tr>
                      <td><strong>#${s.session_id}</strong></td>
                      <td>${s.user_id}</td>
                      <td class="text-muted">${s.ip_address || '-'}</td>
                      <td class="text-muted" title="${s.user_agent || ''}">${(s.user_agent || '-').substring(0, 40)}${(s.user_agent || '').length > 40 ? '...' : ''}</td>
                      <td>${new Date(s.start_time).toLocaleString('es-CO')}</td>
                      <td>${s.is_active ? '<span class="badge badge-success">Activa</span>' : '<span class="badge badge-secondary">Finalizada</span>'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
          ` : ''}
        </div>
      `;

      showToast('Verificación completada', 'Datos de MySQL consultados exitosamente', 'success');
    } catch (error) {
      console.error('Error verificando MySQL:', error);
      container.innerHTML = `
        <div class="mysql-error">
          <i class="fas fa-exclamation-triangle"></i>
          <p>No se pudo consultar la base de datos MySQL.</p>
          <p class="text-muted">${error.message || 'Error de conexión'}</p>
        </div>
      `;
      showToast('Error', 'No se pudo verificar MySQL', 'error');
    }
  },

  formatNumber(num) {
    if (!num) return '0';
    return parseFloat(num).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};

const loadReports = ReportsScreen.load.bind(ReportsScreen);
