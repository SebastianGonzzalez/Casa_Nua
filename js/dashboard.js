import { currentLogin, currentClient, readDb } from './storage.js';
import { esc, fmtMoney } from './utils.js';

export function initDashboard() {
  const root = document.querySelector('[data-dashboard-root]');
  if (!root) return;

  const login = currentLogin();
  if (!login) return;

  const db = readDb();
  const isAdmin = login.role === 'Admin';
  const client = currentClient();

  const set = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  };

  set('greeting', isAdmin ? 'Panel de administración' : `Hola, ${client?.nombre || 'Cliente'}`);
  set('roleNote', isAdmin
    ? 'Controla cuentas, inventario y compras desde un mismo lugar.'
    : (client?.complete ? 'Tu perfil está listo para comprar y consultar tus pedidos.' : 'Completa tu perfil para habilitar las compras.'));

  set('statOne', isAdmin ? String(db.cliente.length) : String(db.producto.filter(p => p.stock > 0).length));
  set('statOneLabel', isAdmin ? 'Clientes' : 'Productos disponibles');
  set('statOneFoot', isAdmin ? `${db.login.filter(u => u.status === 'Pendiente').length} solicitudes pendientes` : 'Con existencias actuales');

  set('statTwo', isAdmin ? String(db.producto.length) : String(db.encabezado.filter(h => h.idCliente === client?.id).length));
  set('statTwoLabel', isAdmin ? 'Productos' : 'Compras realizadas');
  set('statTwoFoot', isAdmin ? `${db.producto.reduce((sum, p) => sum + p.stock, 0)} unidades en stock` : 'Historial asociado a tu perfil');

  const sales = db.encabezado.reduce((sum, h) => sum + Number(h.total || 0), 0);
  const personalSales = db.encabezado
    .filter(h => h.idCliente === client?.id)
    .reduce((sum, h) => sum + Number(h.total || 0), 0);

  set('statThree', isAdmin ? fmtMoney(sales) : fmtMoney(personalSales));
  set('statThreeLabel', isAdmin ? 'Total ventas' : 'Total comprado');
  set('statThreeFoot', isAdmin ? 'Ingresos acumulados' : 'Valor acumulado');

  const quick = document.getElementById('quickActions');
  if (!quick) return;

  quick.innerHTML = isAdmin ? `
    <a class="panel quick-card primary" href="products.html"><span class="index">01 · Inventario</span><h3>Actualizar productos</h3><p>Crea, edita y revisa stock y precio desde una sola vista.</p></a>
    <a class="panel quick-card" href="users.html"><span class="index">02 · Acceso</span><h3>Activar cuentas</h3><p>Revisa solicitudes pendientes y asigna el rol correspondiente.</p></a>
    <a class="panel quick-card" href="purchases.html"><span class="index">03 · Compras</span><h3>Consultar ventas</h3><p>Abre encabezados y detalles de compras registradas.</p></a>
  ` : `
    <a class="panel quick-card primary" href="purchase.html"><span class="index">01 · Compra</span><h3>Elegir productos</h3><p>Consulta disponibilidad, define cantidades y confirma tu pedido.</p></a>
    <a class="panel quick-card" href="profile.html"><span class="index">02 · Perfil</span><h3>Actualizar mis datos</h3><p>Revisa nombre, apellido y correo asociados a tu cuenta.</p></a>
    <a class="panel quick-card" href="purchases.html"><span class="index">03 · Historial</span><h3>Ver mis compras</h3><p>Consulta cada pedido y sus productos a detalle.</p></a>
  `;
}
