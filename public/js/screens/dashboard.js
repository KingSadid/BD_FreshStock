/**
 * Dashboard screen logic.
 */
const DashboardScreen = {
  async load() {
    try {
      const welcome = document.getElementById('welcome-text');
      if (welcome && AppState.user) {
        welcome.textContent = `¡Buenos días, ${AppState.user.name}!`;
      }

      const etlBtn = document.getElementById('btn-run-etl');
      if (etlBtn) {
        etlBtn.style.display = AppState.user && AppState.user.role === 'admin' ? 'inline-flex' : 'none';
      }

      const kpis = await api.getKPIs();
      document.getElementById('kpi-products').textContent = kpis.active_products;
      document.getElementById('kpi-batches').textContent = kpis.total_batches;
      document.getElementById('kpi-expiring').textContent = kpis.expiring_soon;
      document.getElementById('kpi-critical').textContent = kpis.critical_stock;

      document.querySelectorAll('[id^="nav-badge-products"]').forEach(b => b.textContent = kpis.active_products);
      document.querySelectorAll('[id^="nav-badge-alerts"]').forEach(b => b.textContent = kpis.expiring_soon);
      document.getElementById('banner-alerts').textContent = kpis.expiring_soon + ' alertas';
      document.getElementById('banner-expiring').textContent = kpis.expiring_soon + ' productos';
      document.getElementById('login-stat-products').textContent = kpis.active_products + ' productos';
      document.getElementById('login-stat-alerts').textContent = kpis.expiring_soon + ' alertas';

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

      const [movementStats, categoryStats] = await Promise.all([
        api.getMovementStats(),
        api.getCategoryStats()
      ]);

      this.renderMovementChart(movementStats);
      this.renderCategoryChart(categoryStats);

      animateValue('kpi-products', 0, kpis.active_products, 1000);
      animateValue('kpi-batches', 0, kpis.total_batches, 1000);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      showToast('Error', 'No se pudieron cargar los datos', 'error');
    }
  },

  renderMovementChart(data) {
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
  },

  renderCategoryChart(data) {
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

    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let offset = 0;

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
    
    const texts = svg.querySelectorAll('text');
    texts.forEach(t => svg.appendChild(t));
  },

  async runETL() {
    const btn = document.getElementById('btn-run-etl');
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Ejecutando...';
    btn.disabled = true;

    try {
      const result = await api.runETL();
      showToast('ETL Completado',
        `${result.results.alerts} alertas, ${result.results.movements} movimientos, ${result.results.sessions} sesiones migrados`,
        'success'
      );
      loadDashboard();
    } catch (err) {
      showToast('Error', err.error || 'No se pudo ejecutar el ETL', 'error');
    } finally {
      btn.innerHTML = original;
      btn.disabled = false;
    }
  }
};

const loadDashboard = DashboardScreen.load.bind(DashboardScreen);
