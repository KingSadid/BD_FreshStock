
const AppUtils = {
  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  getDaysRemaining(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const exp = new Date(expiryDate);
    exp.setHours(0, 0, 0, 0);
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  },

  getStatusBadge(days) {
    if (days < 0) return '<span class="status-badge critical">Vencido</span>';
    if (days === 0) return '<span class="status-badge critical">Vence Hoy</span>';
    if (days <= 3) return `<span class="status-badge warning">${days} días</span>`;
    return `<span class="status-badge ok">${days} días</span>`;
  },

  animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      obj.textContent = Math.floor(progress * (end - start) + start);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }
};

const formatDate = AppUtils.formatDate;
const getDaysRemaining = AppUtils.getDaysRemaining;
const getStatusBadge = AppUtils.getStatusBadge;
const animateValue = AppUtils.animateValue;
