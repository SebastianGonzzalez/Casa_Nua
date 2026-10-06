import { readDb } from './storage.js';
import { esc, showToast } from './utils.js';
import { activatePendingUser } from './auth.js';
import { icon } from './icons.js';

export function initUsers() {
  const table = document.getElementById('pendingUsersBody');
  if (!table) return;

  const render = () => {
    const db = readDb();
    const pending = db.login.filter(item => item.status === 'Pendiente');

    if (!pending.length) {
      table.innerHTML = `<tr><td colspan="5"><div class="empty"><strong>No hay solicitudes pendientes</strong>Las nuevas cuentas aparecerán aquí después de registrarse.</div></td></tr>`;
      return;
    }

    table.innerHTML = pending.map(user => {
      const client = db.cliente.find(c => c.loginId === user.id);
      return `<tr>
        <td>#${user.id}</td>
        <td>${esc(client?.nombre || '—')} ${esc(client?.apellido || '')}</td>
        <td>${esc(user.email)}</td>
        <td><span class="badge warning">Pendiente</span></td>
        <td>
          <div class="actions">
            <select class="select" data-role-for="${user.id}" aria-label="Rol para ${esc(user.email)}">
              <option value="Cliente">Cliente</option>
              <option value="Admin">Admin</option>
            </select>
            <button class="btn small success" type="button" data-activate="${user.id}">${icon.check}<span>Activar</span></button>
          </div>
        </td>
      </tr>`;
    }).join('');
  };

  table.addEventListener('click', event => {
    const button = event.target.closest('[data-activate]');
    if (!button) return;

    const id = Number(button.dataset.activate);
    const selector = table.querySelector(`[data-role-for="${id}"]`);
    const result = activatePendingUser(id, selector?.value);

    if (!result.ok) {
      showToast('No se pudo activar', result.message, 'error');
      return;
    }

    showToast('Cuenta activada', `${result.user.email} quedó activa con rol ${result.user.role}.`);
    render();
  });

  render();
}
