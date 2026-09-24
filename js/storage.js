import { APP_CONFIG } from './config.js';

const EMPTY_DB = Object.freeze({
  login: [],
  cliente: [],
  producto: [],
  encabezado: [],
  detalles: []
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeDb(raw) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    login: Array.isArray(source.login) ? source.login : [],
    cliente: Array.isArray(source.cliente) ? source.cliente : [],
    producto: Array.isArray(source.producto) ? source.producto : [],
    encabezado: Array.isArray(source.encabezado) ? source.encabezado : [],
    detalles: Array.isArray(source.detalles) ? source.detalles : []
  };
}

export function blankDb() {
  return clone(EMPTY_DB);
}

function migrateLegacyDb() {
  try {
    const legacyRaw = localStorage.getItem('parcialCompraDB_v1');
    if (!legacyRaw) return null;
    const legacy = normalizeDb(JSON.parse(legacyRaw));
    for (const detail of legacy.detalles) {
      if (!Number.isFinite(Number(detail.valorUnitario))) {
        const product = legacy.producto.find(item => item.id === detail.idProducto);
        const quantity = Number(detail.cantidad);
        const subtotal = Number(detail.valor);
        detail.valorUnitario = product?.valorUnitario || (
          Number.isSafeInteger(quantity) && quantity > 0 && Number.isSafeInteger(subtotal)
            ? subtotal / quantity
            : 0
        );
      }
    }
    localStorage.setItem(APP_CONFIG.dbKey, JSON.stringify(legacy));
    return legacy;
  } catch {
    return null;
  }
}

export function readDb() {
  try {
    const current = localStorage.getItem(APP_CONFIG.dbKey);
    if (current) return normalizeDb(JSON.parse(current));
    return migrateLegacyDb() || blankDb();
  } catch {
    return migrateLegacyDb() || blankDb();
  }
}

export function writeDb(db) {
  const normalized = normalizeDb(db);
  localStorage.setItem(APP_CONFIG.dbKey, JSON.stringify(normalized));
}

export function getSession() {
  try {
    const session = JSON.parse(localStorage.getItem(APP_CONFIG.sessionKey));
    return session && typeof session === 'object' ? session : null;
  } catch {
    return null;
  }
}

export function setSession(login) {
  localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify({
    loginId: login.id,
    role: login.role,
    email: login.email
  }));
}

export function clearSession() {
  localStorage.removeItem(APP_CONFIG.sessionKey);
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function nowIso() {
  return new Date().toISOString();
}

export function seedDatabase() {
  const current = readDb();
  if (current.login.length || current.producto.length) return;

  const createdAt = nowIso();
  const adminLogin = {
    id: 1,
    email: 'admin@tienda.local',
    password: 'Admin123!',
    role: 'Admin',
    status: 'Activo',
    createdAt
  };
  const clientLogin = {
    id: 2,
    email: 'cliente@tienda.local',
    password: 'Cliente123!',
    role: 'Cliente',
    status: 'Activo',
    createdAt
  };

  writeDb({
    login: [adminLogin, clientLogin],
    cliente: [{
      id: 1,
      loginId: 2,
      nombre: 'Cliente',
      apellido: 'Demo',
      correo: clientLogin.email,
      fecha: createdAt,
      complete: true
    }],
    producto: [
      { id: 1, nombre: 'Cuaderno Atlas', descripcion: 'Tapa dura, 120 hojas y formato A5.', valorUnitario: 28000, stock: 18 },
      { id: 2, nombre: 'Lámpara Nube', descripcion: 'Luz cálida regulable para escritorio.', valorUnitario: 79000, stock: 9 },
      { id: 3, nombre: 'Taza Terra', descripcion: 'Cerámica artesanal con acabado mate.', valorUnitario: 42000, stock: 15 },
      { id: 4, nombre: 'Agenda Línea', descripcion: 'Planificador semanal, encuadernación flexible.', valorUnitario: 35000, stock: 24 },
      { id: 5, nombre: 'Bolso Campo', descripcion: 'Textil resistente, bolsillo interior y asa larga.', valorUnitario: 118000, stock: 6 },
      { id: 6, nombre: 'Vela Estudio', descripcion: 'Aroma amaderado, cera vegetal y 40 horas.', valorUnitario: 52000, stock: 12 }
    ],
    encabezado: [],
    detalles: []
  });
}

export function currentLogin() {
  const session = getSession();
  if (!session) return null;
  const db = readDb();
  return db.login.find(item => item.id === Number(session.loginId)) || null;
}

export function currentClient() {
  const login = currentLogin();
  if (!login) return null;
  return readDb().cliente.find(item => item.loginId === login.id) || null;
}
