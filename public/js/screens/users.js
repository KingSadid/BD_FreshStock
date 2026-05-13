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
        const statusClass = u.is_online ? 'online' : 'offline';
        const statusText = u.is_online ? 'Conectado' : 'Desconectado';
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
            ${isAdmin ? `
              <div class="uc-footer">
                ${u.is_active ? `
                  <button class="btn-icon btn-warning" onclick="UsersScreen.deactivate(${u.user_id})" title="Desactivar usuario">
                    <i class="fas fa-user-slash"></i>
                  </button>
                ` : `
                  <button class="btn-icon btn-success" onclick="UsersScreen.activate(${u.user_id})" title="Activar usuario">
                    <i class="fas fa-user-check"></i>
                  </button>
                `}
                <button class="btn-icon btn-danger" onclick="UsersScreen.remove(${u.user_id})" title="Eliminar permanentemente">
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  },

  async deactivate(id) {
    if (!confirm('¿Desactivar este usuario? Podrá reactivarlo después.')) return;
    try {
      const result = await api.deactivateUser(id);
      alert(result.message || 'Usuario desactivado correctamente');
      this.load();
    } catch (error) {
      alert(error.error || 'Error al desactivar usuario');
    }
  },

  async activate(id) {
    if (!confirm('¿Activar este usuario?')) return;
    try {
      const result = await api.activateUser(id);
      alert(result.message || 'Usuario activado correctamente');
      this.load();
    } catch (error) {
      alert(error.error || 'Error al activar usuario');
    }
  },

  async remove(id) {
    if (!confirm('¿ELIMINAR PERMANENTEMENTE este usuario? Esta acción no se puede deshacer.')) return;
    try {
      const result = await api.deleteUser(id);
      alert(result.message || 'Usuario eliminado permanentemente');
      this.load();
    } catch (error) {
      alert(error.error || 'Error al eliminar usuario');
    }
  }
};

const loadUsers = UsersScreen.load.bind(UsersScreen);
