import { currentLogin, currentClient, readDb } from './storage.js';
import { esc, fmtDate, fmtMoney } from './utils.js';
import { icon } from './icons.js';

export function initPurchases() {
  const table = document.getElementById('purchasesBody');
  if (!table) return;

  const login = currentLogin();
  if (!login) return;
  const isAdmin = login.role === 'Admin';

  const render = () => {
    const db = readDb();
    const client = currentClient();
    const headers = isAdmin
      ? db.encabezado
      : db.encabezado.filter(header => header.idCliente === client?.id);

    table.innerHTML = headers.map(header => {
      const owner = db.cliente.find(c => c.id === header.idCliente);
      const detailsCount = db.detalles.filter(d => d.idEncabezado === header.id).length;

      return `<tr>
        <td>#${header.id}</td>
        <td>${esc(owner ? `${owner.nombre} ${owner.apellido}` : '—')}</td>
        <td>${fmtDate(header.fecha)}</td>
        <td class="numeric">${detailsCount}</td>
        <td class="numeric"><strong>${fmtMoney(header.total)}</strong></td>
        <td><a class="btn secondary small" href="details.html?id=${header.id}"><span>Ver detalle</span></a></td>
      </tr>`;
    }).join('') || `<tr><td colspan="6"><div class="empty"><strong>No hay compras registradas</strong>${isAdmin ? 'Las compras confirmadas aparecerán aquí.' : 'Cuando confirmes un pedido, podrás verlo en tu historial.'}</div></td></tr>`;
  };

  render();
}
