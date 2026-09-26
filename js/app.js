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

function start() {
  seedDatabase();

  const page = pageName();
  const isAuthPage = page === 'login' || page === 'register';

  if (isAuthPage) {
    triggerAuthAnimation();
  }

  const authLinks = document.querySelectorAll('a[href="index.html"], a[href="register.html"]');
  authLinks.forEach(link => {
    link.addEventListener('click', event => {
      const target = link.getAttribute('href');
      if (!target || target === location.pathname.split('/').pop()) return;
      event.preventDefault();
      document.body.classList.remove('auth-page-enter');
      document.body.classList.add('auth-page-exit');
      window.setTimeout(() => {
        window.location.href = target;
      }, 220);
    });
  });

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
  const page = pageName();
  if (page === 'login' || page === 'register') {
    triggerAuthAnimation();
  }
});
