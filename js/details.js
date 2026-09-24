import { readDb, currentLogin, currentClient } from './storage.js';
import { esc, fmtDate, fmtMoney } from './utils.js';

export function initDetails() {
  const root = document.getElementById('detailsContent');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get('id'));
  const db = readDb();
  const header = db.encabezado.find(item => item.id === id);
  const login = currentLogin();
  const client = currentClient();

  const unauthorized = !header || !login ||
    (login.role !== 'Admin' && header.idCliente !== client?.id);

  if (unauthorized) {
    root.innerHTML = `<div class="panel empty"><strong>Compra no disponible</strong><p>El pedido no existe, el identificador es inválido o no pertenece a la cuenta actual.</p><a class="btn" href="purchases.html">Volver a compras</a></div>`;
    return;
  }

  const owner = db.cliente.find(item => item.id === header.idCliente);
  const details = db.detalles.filter(item => item.idEncabezado === header.id);

  document.getElementById('purchaseTitle').textContent = `Compra #${header.id}`;
  document.getElementById('purchaseSubtitle').textContent = `${fmtDate(header.fecha)} · ${owner ? `${owner.nombre} ${owner.apellido}` : 'Cliente'}`;

  const rows = details.map(detail => {
    const product = db.producto.find(item => item.id === detail.idProducto);
    const unitPrice = Number(detail.valorUnitario);
    const subtotal = Number(detail.valor);
    return `<tr>
      <td>#${detail.id}</td>
      <td><strong>${esc(product?.nombre || 'Producto eliminado')}</strong><br><span class="muted">${esc(product?.descripcion || 'El producto ya no está en el catálogo.')}</span></td>
      <td class="numeric">${detail.cantidad}</td>
      <td class="numeric">${fmtMoney(unitPrice)}</td>
      <td class="numeric"><strong>${fmtMoney(subtotal)}</strong></td>
    </tr>`;
  }).join('');

  root.innerHTML = `
    <div class="detail-grid">
      <section class="panel">
        <div class="panel-head"><h2>Resumen</h2><span class="badge success">Confirmada</span></div>
        <div class="panel-body detail-list">
          <div class="detail-line"><span>Cliente</span><strong>${esc(owner ? `${owner.nombre} ${owner.apellido}` : '—')}</strong></div>
          <div class="detail-line"><span>Correo</span><strong>${esc(owner?.correo || '—')}</strong></div>
          <div class="detail-line"><span>Fecha</span><strong>${fmtDate(header.fecha)}</strong></div>
          <div class="detail-line"><span>Total</span><strong>${fmtMoney(header.total)}</strong></div>
        </div>
      </section>
      <section class="panel">
        <div class="panel-head"><h2>Reglas aplicadas</h2></div>
        <div class="panel-body"><p class="mb-0 muted">La compra guarda encabezado y detalles, registra el valor unitario histórico y descuenta el stock dentro de una sola escritura de datos.</p></div>
      </section>
    </div>
    <section class="panel mt-3">
      <div class="panel-head"><h2>Detalle de productos</h2></div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID</th><th>Producto</th><th class="numeric">Cantidad</th><th class="numeric">Valor unitario</th><th class="numeric">Subtotal</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="5"><div class="empty"><strong>Sin detalles</strong>Este encabezado no tiene productos asociados.</div></td></tr>`}</tbody>
          <tfoot><tr><td colspan="4" class="numeric"><strong>Total</strong></td><td class="numeric"><strong>${fmtMoney(header.total)}</strong></td></tr></tfoot>
        </table>
      </div>
    </section>
  `;
}
