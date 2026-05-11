const UsersScreen = {
  async load() {
    try {
      const users = await api.getUsers();
      const grid = document.getElementById('users-grid');
      const isAdmin = AppState.user && AppState.user.role === 'admin';

      const roleLabels = { admin: 'Administrador', warehouse: 'Almacén', seller: 'Vendedor' };
      const roleColors = { admin: '#7c3aed', warehouse: '#3b82f6', seller: '#f59e0b' };

      grid.innerHTML = users.map(u => {
        const initials = u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        const roleLabel = roleLabels[u.role] || u.role;
        const statusClass = u.is_active ? 'online' : 'offline';
        const statusText = u.is_active ? 'Activo' : 'Inactivo';
        const date = new Date(u.created_at).toLocaleDateString('es-CO');

        return `
          <div class="user-card">
            <div class="uc-header">
              <div class="uc-avatar" style="background:${roleColors[u.role]}20;color:${roleColors[u.role]};">${initials}</div>
              <span class="role-badge ${u.role}">${roleLabel}</span>
            </div>
            <h4>${u.name}</h4>
            <p class="uc-email">${u.email}</p>
            <div class="uc-stats">
              <div class="uc-stat">
                <span class="status-dot ${statusClass}"></span>
                <span>${statusText}</span>
              </div>
              <div class="uc-stat">
                <span>${date}</span>
                <span>Registro</span>
              </div>
            </div>
            ${isAdmin ? `<div class="uc-footer"><span class="role-badge ${u.role}">${roleLabel}</span></div>` : ''}
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }
};

const loadUsers = UsersScreen.load.bind(UsersScreen);
