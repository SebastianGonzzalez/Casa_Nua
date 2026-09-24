import { readDb } from './storage.js';
import { esc, fmtDateOnly } from './utils.js';

export function initClients() {
  const table = document.getElementById('clientsBody');
  if (!table) return;

  const render = () => {
    const db = readDb();
    const rows = db.cliente.map(client => {
      const login = db.login.find(item => item.id === client.loginId);
      return `<tr>
        <td>#${client.id}</td>
        <td>${esc(client.nombre)} ${esc(client.apellido)}</td>
        <td>${esc(client.correo)}</td>
        <td>${fmtDateOnly(client.fecha)}</td>
        <td><span class="badge ${client.complete ? 'success' : 'warning'}">${client.complete ? 'Completo' : 'Incompleto'}</span></td>
        <td><span class="badge ${login?.status === 'Activo' ? 'success' : 'warning'}">${esc(login?.status || '—')}</span></td>
      </tr>`;
    }).join('');

    table.innerHTML = rows || `<tr><td colspan="6"><div class="empty"><strong>Aún no hay clientes</strong>Los clientes aparecerán cuando completen su registro.</div></td></tr>`;
  };

  render();
}
