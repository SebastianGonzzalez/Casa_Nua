import { currentLogin, currentClient, clearSession } from './storage.js';
import { pageName, esc } from './utils.js';
import { icon } from './icons.js';

export function buildShell() {
  const root = document.querySelector('[data-shell]');
  if (!root) return;

  const login = currentLogin();
  if (!login) return;

  const isAdmin = login.role === 'Admin';
  const items = isAdmin
    ? [
        ['dashboard.html', icon.home, 'Inicio'],
        ['clients.html', icon.users, 'Clientes'],
        ['users.html', icon.user, 'Solicitudes'],
        ['products.html', icon.box, 'Productos'],
        ['purchases.html', icon.receipt, 'Compras']
      ]
    : [
        ['dashboard.html', icon.home, 'Inicio'],
        ['profile.html', icon.user, 'Mi perfil'],
        ['purchase.html', icon.cart, 'Comprar'],
        ['purchases.html', icon.receipt, 'Mis compras']
      ];

  const active = pageName();
  const links = items.map(([href, svg, label]) => {
    const activePage = href.replace('.html', '') === active;
    return `<a href="${href}" ${activePage ? 'aria-current="page"' : ''}>${svg}<span>${label}</span></a>`;
  }).join('');

  const displayName = isAdmin ? 'Administrador' : (currentClient()?.nombre || 'Cliente');

  root.innerHTML = `
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <header class="topbar">
      <div class="topbar-inner">
        <a class="brand" href="dashboard.html" aria-label="Casa Nua, ir al inicio">
          <span class="brand-dot" aria-hidden="true"></span>
          <span class="brand-copy"><span class="brand-title">Casa Nua</span><span class="brand-sub">Compra & catálogo</span></span>
        </a>
        <button class="nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="main-nav">${icon.menu}</button>
        <nav class="main-nav" id="main-nav" aria-label="Navegación principal" data-open="false">${links}</nav>
        <div class="session">
          <div class="session-user"><strong>${esc(displayName)}</strong><span>${esc(login.role)}</span></div>
          <button class="btn danger small" type="button" data-action="logout"><span>Salir</span></button>
        </div>
      </div>
    </header>`;

  const button = root.querySelector('.nav-toggle');
  const nav = root.querySelector('#main-nav');

  button?.addEventListener('click', () => {
    const open = nav.dataset.open === 'true';
    nav.dataset.open = String(!open);
    button.setAttribute('aria-expanded', String(!open));
    button.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    button.innerHTML = open ? icon.menu : icon.close;
  });

  root.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}
