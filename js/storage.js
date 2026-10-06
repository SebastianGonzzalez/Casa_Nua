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

function blankDb() {
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

function getSession() {
  try {
    const storedSession = localStorage.getItem(APP_CONFIG.sessionKey);
    if (storedSession) {
      const session = JSON.parse(storedSession);
      if (session && typeof session === 'object') return session;
    }

    const sessionStorageValue = sessionStorage.getItem(APP_CONFIG.sessionKey);
    if (sessionStorageValue) {
      const session = JSON.parse(sessionStorageValue);
      if (session && typeof session === 'object') return session;
    }

    return null;
  } catch {
    return null;
  }
}

export function getRememberedLogin() {
  try {
    const remembered = JSON.parse(localStorage.getItem('rememberedLogin_v2'));
    return remembered && typeof remembered === 'object' ? remembered : null;
  } catch {
    return null;
  }
}

export function setSession(login, rememberMe = true) {
  const payload = {
    loginId: login.id,
    role: login.role,
    email: login.email,
    rememberMe
  };

  localStorage.removeItem(APP_CONFIG.sessionKey);
  sessionStorage.removeItem(APP_CONFIG.sessionKey);

  if (rememberMe) {
    localStorage.setItem('rememberedLogin_v2', JSON.stringify({ email: login.email }));
    localStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(payload));
  } else {
    sessionStorage.setItem(APP_CONFIG.sessionKey, JSON.stringify(payload));
    localStorage.removeItem('rememberedLogin_v2');
  }
}

export function clearSession() {
  localStorage.removeItem(APP_CONFIG.sessionKey);
  sessionStorage.removeItem(APP_CONFIG.sessionKey);
}

export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

export function nowIso() {
  return new Date().toISOString();
}

const BOOK_PRODUCTS = [
  { id: 1, nombre: 'Atlas de relatos', descripcion: 'Antología de cuentos breves para leer en una tarde y volver a abrir.', valorUnitario: 32000, stock: 18 },
  { id: 2, nombre: 'Poesía en la tarde', descripcion: 'Selección de poemas íntimos y luminosos para una lectura contemplativa.', valorUnitario: 54000, stock: 9 },
  { id: 3, nombre: 'Historia de la lectura', descripcion: 'Un recorrido visual y crítico por la evolución de los libros y sus lectores.', valorUnitario: 41000, stock: 15 },
  { id: 4, nombre: 'La sombra del viento', descripcion: 'Edición cuidada de una novela de misterio, memoria y pasión por los libros.', valorUnitario: 48000, stock: 24 },
  { id: 5, nombre: 'Ficciones', descripcion: 'Colección esencial de textos de Borges con edición elegante y papel de alto gramaje.', valorUnitario: 62000, stock: 6 },
  { id: 6, nombre: 'El alquimista', descripcion: 'Edición especial con sobrecubierta y diseño editorial inspirador.', valorUnitario: 39000, stock: 12 }
];

function hasBookCatalog(products) {
  return products.some(product => {
    const haystack = `${product.nombre || ''} ${product.descripcion || ''}`.toLowerCase();
    return /(libro|poes|novela|ensayo|atlas|lectura|biblioteca|edición|antología|cuento|literatura|borges|alquimista)/i.test(haystack);
  });
}

function hasLegacyCatalog(products) {
  return products.some(product => {
    const haystack = `${product.nombre || ''} ${product.descripcion || ''}`.toLowerCase();
    return /(cuaderno|lápiz|taza|agenda|bolso|cerámica|papelería|papelera|material|escritorio|resaltador|borrador)/i.test(haystack);
  });
}

export function seedDatabase() {
  const current = readDb();

  const needsBookCatalog = current.producto.length === 0 || hasLegacyCatalog(current.producto) || !hasBookCatalog(current.producto);

  if (!current.login.length && !current.producto.length) {
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
      producto: BOOK_PRODUCTS,
      encabezado: [],
      detalles: []
    });
    return;
  }

  if (needsBookCatalog) {
    const nextDb = {
      ...current,
      producto: BOOK_PRODUCTS.map(item => ({ ...item }))
    };
    writeDb(nextDb);
  }
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
