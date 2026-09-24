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

function start() {
  seedDatabase();

  const page = pageName();
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
