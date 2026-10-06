import { currentLogin, currentClient, readDb } from './storage.js';
import { fmtMoney } from './utils.js';

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
    ? 'Controla clientes, catálogo y ventas desde un mismo punto de lectura.'
    : (client?.complete ? 'Tu perfil está listo para descubrir nuevas historias y reservar tus próximas lecturas.' : 'Completa tu perfil para habilitar tus compras favoritas.'));

  set('statOne', isAdmin ? String(db.cliente.length) : String(db.producto.filter(p => p.stock > 0).length));
  set('statOneLabel', isAdmin ? 'Clientes' : 'Libros disponibles');
  set('statOneFoot', isAdmin ? `${db.login.filter(u => u.status === 'Pendiente').length} solicitudes pendientes` : 'Con existencias actuales');

  set('statTwo', isAdmin ? String(db.producto.length) : String(db.encabezado.filter(h => h.idCliente === client?.id).length));
  set('statTwoLabel', isAdmin ? 'Catálogo' : 'Compras realizadas');
  set('statTwoFoot', isAdmin ? `${db.producto.reduce((sum, p) => sum + p.stock, 0)} ejemplares en inventario` : 'Historial asociado a tu perfil');

  const sales = db.encabezado.reduce((sum, h) => sum + Number(h.total || 0), 0);
  const personalSales = db.encabezado
    .filter(h => h.idCliente === client?.id)
    .reduce((sum, h) => sum + Number(h.total || 0), 0);

  set('statThree', isAdmin ? fmtMoney(sales) : fmtMoney(personalSales));
  set('statThreeLabel', isAdmin ? 'Total ventas' : 'Total gastado');
  set('statThreeFoot', isAdmin ? 'Ingresos acumulados' : 'Valor acumulado');

  const quick = document.getElementById('quickActions');
  if (!quick) return;

  quick.innerHTML = isAdmin ? `
    <a class="panel quick-card primary" href="products.html"><span class="index">01 · Catálogo</span><h3>Actualizar libros</h3><p>Crea, edita y revisa existencias y precios de cada edición.</p></a>
    <a class="panel quick-card" href="users.html"><span class="index">02 · Acceso</span><h3>Activar cuentas</h3><p>Revisa solicitudes pendientes y asigna permisos para cada lector.</p></a>
    <a class="panel quick-card" href="purchases.html"><span class="index">03 · Ventas</span><h3>Consultar compras</h3><p>Revisa cada venta, sus libros y el total cobrado.</p></a>
  ` : `
    <a class="panel quick-card primary" href="purchase.html"><span class="index">01 · Compra</span><h3>Elegir libros</h3><p>Consulta disponibilidad, define cantidades y confirma tu próxima lectura.</p></a>
    <a class="panel quick-card" href="profile.html"><span class="index">02 · Perfil</span><h3>Actualizar mi cuenta</h3><p>Revisa nombre, apellido y correo asociados a tu perfil lector.</p></a>
    <a class="panel quick-card" href="purchases.html"><span class="index">03 · Historial</span><h3>Ver mis compras</h3><p>Consulta cada pedido y sus libros a detalle.</p></a>
  `;
}
