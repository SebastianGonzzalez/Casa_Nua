import { APP_CONFIG } from './config.js';

export const money = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
});
export const dateFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
export const dateOnlyFmt = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });

export function fmtMoney(value) {
  const number = Number(value);
  return Number.isFinite(number) ? money.format(number) : '—';
}

export function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFmt.format(date);
}

export function fmtDateOnly(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateOnlyFmt.format(date);
}

export function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[character]));
}

export function pageName() {
  return document.body.dataset.page || '';
}

export function nowIso() {
  return new Date().toISOString();
}

export function showToast(title, message, kind = 'success') {
  let region = document.querySelector('.toast-region');
  if (!region) {
    region = document.createElement('div');
    region.className = 'toast-region';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.innerHTML = `<strong>${esc(title)}</strong><small>${esc(message)}</small>`;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4800);
}

export function setFieldError(inputId, message = '') {
  const input = document.getElementById(inputId);
  if (!input) return;
  const error = document.querySelector(`[data-error-for="${inputId}"]`);
  if (error) error.textContent = message;
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
}

export function clearFieldErrors(ids) {
  ids.forEach(id => setFieldError(id, ''));
}

export function focusFirstError(ids) {
  const id = ids.find(item => document.querySelector(`[data-error-for="${item}"]`)?.textContent.trim());
  if (id) document.getElementById(id)?.focus();
}

export function getNumberValue(id) {
  const input = document.getElementById(id);
  return input ? Number(input.value) : NaN;
}

export function isSafePositiveInteger(value, max = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value >= 1 && value <= max;
}

export function isSafeNonNegativeInteger(value, max = Number.MAX_SAFE_INTEGER) {
  return Number.isSafeInteger(value) && value >= 0 && value <= max;
}

export function isFinitePositiveNumber(value, max = Number.MAX_SAFE_INTEGER) {
  return Number.isFinite(value) && value > 0 && value <= max;
}

export function isValidId(value) {
  return Number.isSafeInteger(Number(value)) && Number(value) >= 1;
}

export function normalizeText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

export function normalizeEmail(value) {
  return String(value ?? '').trim().toLowerCase();
}

export function validateEmail(value) {
  const email = normalizeEmail(value);
  return email.length > 0 && email.length <= APP_CONFIG.limits.emailMax &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validatePersonName(value) {
  const name = normalizeText(value);
  if (name.length < APP_CONFIG.limits.nameMin || name.length > APP_CONFIG.limits.nameMax) return false;
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñÀ-ÿ' -]+$/.test(name);
}

export function validatePassword(value) {
  return typeof value === 'string' &&
    value.length >= APP_CONFIG.limits.passwordMin &&
    value.length <= APP_CONFIG.limits.passwordMax &&
    /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(value) &&
    /\d/.test(value);
}

export function validateRole(role) {
  return APP_CONFIG.roles.includes(role);
}

export function validateStatus(status) {
  return APP_CONFIG.statuses.includes(status);
}

export function isSafeProduct(product) {
  return product &&
    isValidId(product.id) &&
    typeof product.nombre === 'string' &&
    product.nombre.trim().length >= APP_CONFIG.limits.nameMin &&
    product.nombre.trim().length <= APP_CONFIG.limits.nameMax &&
    typeof product.descripcion === 'string' &&
    product.descripcion.trim().length >= APP_CONFIG.limits.descriptionMin &&
    product.descripcion.trim().length <= APP_CONFIG.limits.descriptionMax &&
    isFinitePositiveNumber(Number(product.valorUnitario), APP_CONFIG.limits.priceMax) &&
    isSafeNonNegativeInteger(Number(product.stock), APP_CONFIG.limits.stockMax);
}

export function safeTotal(lines) {
  return lines.reduce((sum, line) => sum + line.subtotal, 0);
}
