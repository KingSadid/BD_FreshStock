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

  formatNumber(num) {
    if (!num) return '0';
    return parseFloat(num).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
};

const loadReports = ReportsScreen.load.bind(ReportsScreen);
