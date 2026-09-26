import { seedDatabase } from './storage.js';
import { pageName } from './utils.js';
import { guardPage, initLogin, initRegister } from './auth.js';
import { initProfile } from './profile.js';
import { buildShell } from './shell.js';
import { initDashboard } from './dashboard.js';
import { initUsers } from './users.js';
import { initClients } from './clients.js';
import { initProducts } from './products.js';
import { initPurchase } from './purchase.js';
import { initPurchases } from './purchases.js';
import { initDetails } from './details.js';
import { currentClient, currentLogin } from './storage.js';

function triggerAuthAnimation() {
  const body = document.body;
  if (!body) return;

  body.classList.remove('auth-page-enter', 'auth-page-exit');
  void body.offsetWidth;
  body.classList.add('auth-page-enter');
  window.setTimeout(() => {
    body.classList.remove('auth-page-enter');
  }, 420);
}

function setAuthView(view) {
  const panels = document.querySelectorAll('.auth-panel');
  const toggles = document.querySelectorAll('[data-auth-toggle]');

  panels.forEach(panel => {
    const isActive = panel.dataset.authPanel === view;
    panel.classList.toggle('active', isActive);
  });

  toggles.forEach(link => {
    const isCurrent = link.dataset.authToggle === view;
    link.setAttribute('aria-current', isCurrent ? 'page' : 'false');
  });

  const formTitle = document.getElementById('authTitle');
  if (formTitle) {
    formTitle.textContent = view === 'register'
      ? '¡Únete a la\nCasa del Libro!'
      : '¡Bienvenido a la\nCasa del Libro!';
  }
}

function redirectToSessionHome(login = currentLogin()) {
  if (!login) return;
  const client = currentClient();
  const target = login.role === 'Admin'
    ? 'dashboard.html'
    : (client?.complete ? 'dashboard.html' : 'profile.html');
  window.location.replace(target);
}

function enforceSessionState() {
  const page = pageName();
  const login = currentLogin();
  const isAuthPage = page === 'login' || page === 'register';

  if (login && isAuthPage) {
    redirectToSessionHome(login);
    return;
  }

  if (!login && !isAuthPage && page) {
    window.location.replace('index.html');
    return;
  }

  if (!login && isAuthPage) {
    window.history.replaceState(null, '', 'index.html');
  }
}

function start() {
  seedDatabase();

  const page = pageName();
  const isAuthPage = page === 'login' || page === 'register';

  if (isAuthPage) {
    const login = currentLogin();
    if (login) {
      redirectToSessionHome(login);
      return;
    }
    triggerAuthAnimation();
  }

  const authLinks = document.querySelectorAll('[data-auth-toggle]');
  authLinks.forEach(link => {
    link.addEventListener('click', event => {
      const target = link.dataset.authToggle;
      if (!target) return;
      event.preventDefault();
      setAuthView(target);
      document.body.classList.remove('auth-page-exit');
      document.body.classList.add('auth-page-enter');
      window.setTimeout(() => {
        document.body.classList.remove('auth-page-enter');
      }, 380);
    });
  });

  const initialView = document.body.dataset.page === 'register' || window.location.hash === '#register' ? 'register' : 'login';
  setAuthView(initialView);

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
window.addEventListener('pageshow', () => {
  enforceSessionState();

  const page = pageName();
  if (page === 'login' || page === 'register') {
    triggerAuthAnimation();
  }
});
