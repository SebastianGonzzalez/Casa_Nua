import { APP_CONFIG } from './config.js';
import {
  readDb, writeDb, setSession, clearSession, currentLogin, currentClient,
  nextId, nowIso, getRememberedLogin
} from './storage.js';
import {
  clearFieldErrors, focusFirstError, normalizeEmail, setFieldError,
  showToast
} from './utils.js';
import {
  validateUserData, emailAlreadyExists, validateRoleInput
} from './validators.js';

function redirectForRole(login) {
  if (!login) return;
  const client = currentClient();
  window.location.href = login.role === 'Admin'
    ? 'dashboard.html'
    : (client?.complete ? 'dashboard.html' : 'profile.html');
}

export function initLogin() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  const emailInput = form.querySelector('#email');
  const rememberInput = form.querySelector('input[name="remember"]');
  const rememberedLogin = getRememberedLogin();

  if (rememberedLogin?.email) {
    emailInput.value = rememberedLogin.email;
    if (rememberInput) rememberInput.checked = true;
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearFieldErrors(['email', 'password']);

    const email = normalizeEmail(document.getElementById('email').value);
    const password = document.getElementById('password').value;
    let valid = true;

    if (!email) {
      setFieldError('email', 'Ingresa tu correo electrónico.');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setFieldError('email', 'Usa un correo válido, por ejemplo: nombre@dominio.com.');
      valid = false;
    }
    if (!password) {
      setFieldError('password', 'Ingresa tu contraseña.');
      valid = false;
    }

    if (!valid) {
      focusFirstError(['email', 'password']);
      return;
    }

    const db = readDb();
    const login = db.login.find(item => normalizeEmail(item.email) === email);

    if (!login) {
      setFieldError('email', 'No encontramos una cuenta con ese correo.');
      document.getElementById('email').focus();
      return;
    }

    if (login.status === 'Pendiente') {
      setFieldError('email', 'Tu cuenta está pendiente de aprobación por un administrador.');
      document.getElementById('email').focus();
      return;
    }

    if (login.status !== 'Activo') {
      setFieldError('email', 'El estado de tu cuenta no permite iniciar sesión.');
      document.getElementById('email').focus();
      return;
    }

    if (login.password !== password) {
      setFieldError('password', 'Las credenciales no coinciden. Verifica tu contraseña.');
      document.getElementById('password').focus();
      return;
    }

    if (!['Admin', 'Cliente'].includes(login.role)) {
      setFieldError('email', 'La cuenta tiene un rol inválido. Contacta al administrador.');
      return;
    }

    const rememberMe = form.querySelector('input[name="remember"]')?.checked ?? true;

    if (rememberMe) {
      localStorage.setItem('rememberedLogin_v2', JSON.stringify({ email: email }));
    } else {
      localStorage.removeItem('rememberedLogin_v2');
    }

    setSession(login, rememberMe);
    form.querySelector('button[type="submit"]').disabled = true;
    redirectForRole(login);
  });
}

export function initRegister() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const ids = ['nombre', 'apellido', 'email', 'password', 'confirmPassword'];
    clearFieldErrors(ids);

    const nombreInput = form.querySelector('#nombre');
    const apellidoInput = form.querySelector('#apellido');
    const emailInput = form.querySelector('input[name="email"]');
    const passwordInput = form.querySelector('input[name="password"]');
    const confirmPasswordInput = form.querySelector('#confirmPassword');

    const result = validateUserData({
      nombre: nombreInput.value,
      apellido: apellidoInput.value,
      email: emailInput.value,
      password: passwordInput.value,
      confirmPassword: confirmPasswordInput.value
    });

    Object.entries(result.errors).forEach(([id, message]) => setFieldError(id, message));
    if (!result.valid) {
      focusFirstError(ids);
      return;
    }

    const db = readDb();
    if (emailAlreadyExists(db, result.values.email)) {
      setFieldError('email', 'Este correo ya está registrado. Prueba iniciar sesión o usa otro correo.');
      emailInput.focus();
      return;
    }

    const loginId = nextId(db.login);
    const createdAt = nowIso();

    db.login.push({
      id: loginId,
      email: result.values.email,
      password: passwordInput.value,
      role: 'Cliente',
      status: 'Pendiente',
      createdAt
    });
    db.cliente.push({
      id: nextId(db.cliente),
      loginId,
      nombre: result.values.nombre,
      apellido: result.values.apellido,
      correo: result.values.email,
      fecha: createdAt,
      complete: false
    });

    writeDb(db);
    form.reset();

    const status = document.getElementById('registerStatus');
    status.textContent = 'Solicitud enviada. Un administrador debe activar tu cuenta antes del primer ingreso.';
    status.className = 'success-msg';
    status.focus();
  });
}

export function initLogout() {
  document.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });
}

export function guardPage(page) {
  const login = currentLogin();
  const publicPage = APP_CONFIG.pages.public.includes(page);

  if (publicPage) {
    if (login?.status === 'Activo') redirectForRole(login);
    return true;
  }

  if (!login) {
    window.location.href = 'index.html';
    return false;
  }

  if (login.status !== 'Activo') {
    clearSession();
    window.location.href = 'index.html';
    return false;
  }

  if (!APP_CONFIG.roles.includes(login.role)) {
    clearSession();
    window.location.href = 'index.html';
    return false;
  }

  if (APP_CONFIG.pages.adminOnly.includes(page) && login.role !== 'Admin') {
    window.location.href = 'dashboard.html';
    return false;
  }

  if (page === 'purchase' && login.role !== 'Cliente') {
    window.location.href = 'dashboard.html';
    return false;
  }

  if (page === 'profile' && login.role !== 'Cliente') {
    window.location.href = 'dashboard.html';
    return false;
  }

  if (page === 'purchase' && !currentClient()?.complete) {
    window.location.href = 'profile.html';
    return false;
  }

  return true;
}

export function activatePendingUser(userId, role) {
  const roleError = validateRoleInput(role);
  if (roleError) return { ok: false, message: roleError };

  const id = Number(userId);
  if (!Number.isSafeInteger(id) || id < 1) return { ok: false, message: 'Identificador de usuario inválido.' };

  const db = readDb();
  const user = db.login.find(item => item.id === id);
  if (!user) return { ok: false, message: 'La cuenta solicitada no existe.' };
  if (user.status !== 'Pendiente') return { ok: false, message: 'La cuenta ya no está pendiente.' };

  user.status = 'Activo';
  user.role = role;
  writeDb(db);
  return { ok: true, user };
}
