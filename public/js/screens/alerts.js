
const AlertsScreen = {
  async load() {
    try {
      const expiring = await api.getExpiringBatches(30);

      document.getElementById('alert-expired').textContent = expiring.filter(b => getDaysRemaining(b.expiry_date) < 0).length;
      document.getElementById('alert-today').textContent = expiring.filter(b => getDaysRemaining(b.expiry_date) === 0).length;
      document.getElementById('alert-week').textContent = expiring.filter(b => {
        const d = getDaysRemaining(b.expiry_date);
        return d > 0 && d <= 7;
      }).length;
      document.getElementById('alert-stock').textContent = '3'; 

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
};

const loadAlerts = AlertsScreen.load.bind(AlertsScreen);
