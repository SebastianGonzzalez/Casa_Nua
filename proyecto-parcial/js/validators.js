import { APP_CONFIG } from './config.js';
import {
  normalizeEmail, normalizeText, validateEmail, validatePersonName,
  validatePassword, validateRole, validateStatus,
  isSafeProduct, isSafePositiveInteger, isSafeNonNegativeInteger,
  isFinitePositiveNumber
} from './utils.js';

export function validateUserData({ nombre, apellido, email, password, confirmPassword = null }) {
  const errors = {};
  const cleanName = normalizeText(nombre);
  const cleanLastName = normalizeText(apellido);
  const cleanEmail = normalizeEmail(email);

  if (!validatePersonName(cleanName)) {
    errors.nombre = `El nombre debe tener entre ${APP_CONFIG.limits.nameMin} y ${APP_CONFIG.limits.nameMax} caracteres y solo usar letras, espacios, guiones o apóstrofes.`;
  }
  if (!validatePersonName(cleanLastName)) {
    errors.apellido = `El apellido debe tener entre ${APP_CONFIG.limits.nameMin} y ${APP_CONFIG.limits.nameMax} caracteres y solo usar letras, espacios, guiones o apóstrofes.`;
  }
  if (!validateEmail(cleanEmail)) {
    errors.email = 'Ingresa un correo válido y de máximo 120 caracteres.';
  }
  if (password !== undefined && !validatePassword(password)) {
    errors.password = `La contraseña debe tener entre ${APP_CONFIG.limits.passwordMin} y ${APP_CONFIG.limits.passwordMax} caracteres, con al menos una letra y un número.`;
  }
  if (confirmPassword !== null && password !== confirmPassword) {
    errors.confirmPassword = 'Las contraseñas deben coincidir.';
  }

  return { valid: Object.keys(errors).length === 0, errors, values: {
    nombre: cleanName, apellido: cleanLastName, email: cleanEmail
  }};
}

export function validateProfileData(data) {
  return validateUserData({
    nombre: data.nombre,
    apellido: data.apellido,
    email: data.correo
  });
}

export function validateProductData({ nombre, descripcion, valorUnitario, stock }) {
  const errors = {};
  const cleanName = normalizeText(nombre);
  const cleanDescription = normalizeText(descripcion);
  const rawPrice = String(valorUnitario ?? '').trim();
  const rawStock = String(stock ?? '').trim();
  const price = Number(rawPrice);
  const inventory = Number(rawStock);

  if (!cleanName) {
    errors.nombre = 'No hay un nombre de producto puesto.';
  } else if (!/^[\p{L}\p{N}ÁÉÍÓÚÜÑáéíóúüñÀ-ÿ'&().,\- ]+$/u.test(cleanName)) {
    errors.nombre = 'El nombre contiene caracteres especiales.';
  }
  if (cleanDescription.length < APP_CONFIG.limits.descriptionMin || cleanDescription.length > APP_CONFIG.limits.descriptionMax) {
    errors.descripcion = `La descripción debe tener entre ${APP_CONFIG.limits.descriptionMin} y ${APP_CONFIG.limits.descriptionMax} caracteres.`;
  }
  if (!rawPrice || !isFinitePositiveNumber(price, APP_CONFIG.limits.priceMax) || !Number.isSafeInteger(price)) {
    errors.valorUnitario = 'Debe ser mayor a 0.';
  }
  if (!rawStock || !isSafeNonNegativeInteger(inventory, APP_CONFIG.limits.stockMax)) {
    errors.stock = 'Debe ser mayor a 0.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    values: { nombre: cleanName, descripcion: cleanDescription, valorUnitario: price, stock: inventory }
  };
}

export function validateCartQuantity(value, stock) {
  const quantity = Number(value);
  const available = Number(stock);
  if (!isSafePositiveInteger(quantity, APP_CONFIG.limits.quantityMax)) {
    return { valid: false, quantity, message: `La cantidad debe ser un entero positivo, máximo ${APP_CONFIG.limits.quantityMax.toLocaleString('es-CO')}.` };
  }
  if (!isSafeNonNegativeInteger(available, APP_CONFIG.limits.stockMax)) {
    return { valid: false, quantity, message: 'El producto tiene un stock inválido.' };
  }
  if (quantity > available) {
    return { valid: false, quantity, message: `La cantidad no puede superar el stock disponible (${available}).` };
  }
  return { valid: true, quantity };
}

export function validateRoleInput(role) {
  return validateRole(role) ? null : 'El rol seleccionado no es válido.';
}

export function validateStatusInput(status) {
  return validateStatus(status) ? null : 'El estado de la cuenta no es válido.';
}

export function validatePurchaseLines(db, entries) {
  if (!Array.isArray(entries) || entries.length === 0) {
    return { valid: false, message: 'El carrito está vacío.' };
  }

  const seen = new Set();
  const lines = [];

  for (const entry of entries) {
    const productId = Number(entry.id);
    if (!isSafePositiveInteger(productId)) {
      return { valid: false, message: 'El carrito contiene un identificador de producto inválido.' };
    }
    if (seen.has(productId)) {
      return { valid: false, message: 'El carrito contiene un producto duplicado.' };
    }
    seen.add(productId);

    const product = db.producto.find(item => item.id === productId);
    if (!isSafeProduct(product)) {
      return { valid: false, message: 'El carrito contiene un producto inválido o corrupto.' };
    }

    const quantityResult = validateCartQuantity(entry.cantidad, product.stock);
    if (!quantityResult.valid) return { valid: false, message: `${product.nombre}: ${quantityResult.message}` };

    const subtotal = product.valorUnitario * quantityResult.quantity;
    if (!Number.isSafeInteger(subtotal)) {
      return { valid: false, message: 'El subtotal supera el límite numérico seguro.' };
    }

    lines.push({
      product,
      cantidad: quantityResult.quantity,
      subtotal,
      valorUnitario: product.valorUnitario
    });
  }

  const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
  if (!Number.isSafeInteger(total) || total < 0) {
    return { valid: false, message: 'El total de la compra no es numéricamente válido.' };
  }

  return { valid: true, lines, total };
}

export function emailAlreadyExists(db, email, excludedLoginId = null) {
  const normalized = normalizeEmail(email);
  return db.login.some(login =>
    login.id !== excludedLoginId &&
    typeof login.email === 'string' &&
    normalizeEmail(login.email) === normalized
  );
}

export function validateDatabaseRelations(db) {
  const errors = [];
  const loginIds = new Set();

  for (const login of db.login) {
    if (!isSafePositiveInteger(Number(login.id))) errors.push('Existe un login con ID inválido.');
    if (loginIds.has(login.id)) errors.push(`ID de login duplicado: ${login.id}.`);
    loginIds.add(login.id);
    if (!validateEmail(login.email)) errors.push(`Correo inválido en login #${login.id}.`);
    if (!validateRole(login.role)) errors.push(`Rol inválido en login #${login.id}.`);
    if (!validateStatus(login.status)) errors.push(`Estado inválido en login #${login.id}.`);
  }

  const loginIdSet = new Set(db.login.map(item => item.id));
  const clientIds = new Set();
  for (const client of db.cliente) {
    if (!isSafePositiveInteger(Number(client.id))) errors.push('Existe un cliente con ID inválido.');
    if (clientIds.has(client.id)) errors.push(`ID de cliente duplicado: ${client.id}.`);
    clientIds.add(client.id);
    if (!loginIdSet.has(client.loginId)) errors.push(`Cliente #${client.id} referencia un login inexistente.`);
  }

  const productIds = new Set();
  for (const product of db.producto) {
    if (!isSafeProduct(product)) errors.push(`Producto #${product.id} contiene datos inválidos.`);
    if (productIds.has(product.id)) errors.push(`ID de producto duplicado: ${product.id}.`);
    productIds.add(product.id);
  }

  const headerIds = new Set();
  for (const header of db.encabezado) {
    if (!isSafePositiveInteger(Number(header.id))) errors.push('Existe un encabezado con ID inválido.');
    if (headerIds.has(header.id)) errors.push(`ID de encabezado duplicado: ${header.id}.`);
    headerIds.add(header.id);
    if (!clientIds.has(header.idCliente)) errors.push(`Encabezado #${header.id} referencia un cliente inexistente.`);
    if (!Number.isSafeInteger(Number(header.total)) || Number(header.total) < 0) errors.push(`Total inválido en encabezado #${header.id}.`);
  }

  for (const detail of db.detalles) {
    if (!headerIds.has(detail.idEncabezado)) errors.push(`Detalle #${detail.id} referencia un encabezado inexistente.`);
    // El producto puede haber sido eliminado del catálogo después de la compra.
    // El detalle conserva el snapshot económico para mantener el historial.
    if (!isSafePositiveInteger(Number(detail.cantidad), APP_CONFIG.limits.quantityMax)) errors.push(`Cantidad inválida en detalle #${detail.id}.`);
    if (!Number.isSafeInteger(Number(detail.valor)) || Number(detail.valor) < 0) errors.push(`Subtotal inválido en detalle #${detail.id}.`);
    if (!Number.isSafeInteger(Number(detail.valorUnitario)) || Number(detail.valorUnitario) <= 0) errors.push(`Valor unitario inválido en detalle #${detail.id}.`);
  }

  return errors;
}
