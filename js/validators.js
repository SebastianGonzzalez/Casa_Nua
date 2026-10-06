import { APP_CONFIG } from './config.js';
import {
  normalizeEmail, normalizeText, validateEmail, validatePersonName,
  validatePassword, validateRole,
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
