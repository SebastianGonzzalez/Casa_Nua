import { currentClient, readDb, writeDb } from './storage.js';
import { clearFieldErrors, focusFirstError, setFieldError, showToast } from './utils.js';
import { validateProfileData, emailAlreadyExists } from './validators.js';

export function initProfile() {
  const form = document.getElementById('profileForm');
  if (!form) return;

  const client = currentClient();
  if (!client) {
    window.location.href = 'dashboard.html';
    return;
  }

  ['nombre', 'apellido', 'correo'].forEach(id => {
    document.getElementById(id).value = client[id] || '';
  });

  const date = document.getElementById('profileDate');
  if (date) date.textContent = client.fecha ? `Registro creado el ${new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(client.fecha))}.` : '';
  if (client.complete) {
    document.getElementById('profileHint').textContent = 'Tu información está completa. Puedes actualizarla cuando lo necesites.';
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const ids = ['nombre', 'apellido', 'correo'];
    clearFieldErrors(ids);

    const result = validateProfileData({
      nombre: document.getElementById('nombre').value,
      apellido: document.getElementById('apellido').value,
      correo: document.getElementById('correo').value
    });

    Object.entries(result.errors).forEach(([id, message]) => setFieldError(id === 'email' ? 'correo' : id, message));
    if (!result.valid) {
      focusFirstError(ids);
      return;
    }

    const db = readDb();
    const target = db.cliente.find(item => item.id === client.id);
    const login = db.login.find(item => item.id === client.loginId);
    if (!target || !login) {
      showToast('No se pudo guardar', 'No encontramos la cuenta asociada al perfil.', 'error');
      return;
    }

    if (emailAlreadyExists(db, result.values.email, login.id)) {
      setFieldError('correo', 'Ese correo ya está asociado a otra cuenta. Usa otro correo.');
      document.getElementById('correo').focus();
      return;
    }

    target.nombre = result.values.nombre;
    target.apellido = result.values.apellido;
    target.correo = result.values.email;
    target.complete = true;
    login.email = result.values.email;

    writeDb(db);
    showToast('Perfil guardado', 'Tus datos están actualizados y las compras quedan habilitadas.');
    document.getElementById('profileHint').textContent = 'Tu información está completa. Puedes actualizarla cuando lo necesites.';
  });
}

