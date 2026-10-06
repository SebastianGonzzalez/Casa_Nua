import { seedDatabase, currentLogin } from './storage.js';
import { pageName } from './utils.js';
import { guardPage, initLogin, initRegister, redirectForRole } from './auth.js';
import { initProfile } from './profile.js';
import { buildShell } from './shell.js';
import { initDashboard } from './dashboard.js';
import { initUsers } from './users.js';
import { initClients } from './clients.js';
import { initProducts } from './products.js';
import { initPurchase } from './purchase.js';
import { initPurchases } from './purchases.js';
import { initDetails } from './details.js';

// La animación de entrada más larga del acceso dura ~700 ms; la clase se retira después.
const AUTH_ENTER_MS = 800;

function isAuthPage(page = pageName()) {
  return page === 'login' || page === 'register';
}

function triggerAuthAnimation() {
  const body = document.body;
  if (!body) return;

  body.classList.remove('auth-page-enter');
  void body.offsetWidth;
  body.classList.add('auth-page-enter');
  window.setTimeout(() => {
    body.classList.remove('auth-page-enter');
  }, AUTH_ENTER_MS);
}

function start() {
  seedDatabase();

  const role = currentLogin()?.role || 'Admin';
  document.body.dataset.userRole = role === 'Cliente' ? 'Cliente' : 'Admin';

  const page = pageName();

  if (isAuthPage(page)) {
    const login = currentLogin();
    if (login) {
      redirectForRole(login);
      return;
    }
    triggerAuthAnimation();
  }

  if (!guardPage(page)) return;

  buildShell();

  initLogin();
  initRegister();
  initDashboard();
  initProfile();
  initUsers();
  initClients();
  initProducts();
  initPurchase();
  initPurchases();
  initDetails();
}

document.addEventListener('DOMContentLoaded', start);

// Al volver con el botón Atrás, el navegador puede restaurar la página desde su caché sin
// ejecutar start(): ahí se revalida la sesión (por ejemplo, tras cerrar sesión).
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;

  const login = currentLogin();
  if (isAuthPage()) {
    if (login) redirectForRole(login);
    else triggerAuthAnimation();
    return;
  }
  if (!login) window.location.replace('index.html');
});
