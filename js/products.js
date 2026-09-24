import { APP_CONFIG } from './config.js';
import { readDb, writeDb, nextId } from './storage.js';
import { esc, clearFieldErrors, focusFirstError, fmtMoney, setFieldError, showToast } from './utils.js';
import { validateProductData } from './validators.js';
import { icon } from './icons.js';

export function initProducts() {
  const form = document.getElementById('productForm');
  const body = document.getElementById('productsBody');
  if (!form || !body) return;

  let editingId = null;
  const fields = ['nombre', 'descripcion', 'valorUnitario', 'stock'];

  const restrictNumericField = (input) => {
    if (!input) return;
    input.addEventListener('keydown', event => {
      const keys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Escape'];
      if (keys.includes(event.key) || event.ctrlKey || event.metaKey || event.altKey) return;
      if (/\d/.test(event.key)) return;
      event.preventDefault();
    });
    input.addEventListener('input', () => {
      input.value = input.value.replace(/[^\d]/g, '');
    });
  };

  restrictNumericField(document.getElementById('valorUnitario'));
  restrictNumericField(document.getElementById('stock'));

  const clearForm = () => {
    form.reset();
    editingId = null;
    document.getElementById('productFormTitle').textContent = 'Nuevo producto';
    document.getElementById('cancelEdit').hidden = true;
    clearFieldErrors(fields);
  };

  const render = () => {
    const db = readDb();
    body.innerHTML = db.producto.map(product => `<tr>
      <td>#${product.id}</td>
      <td><strong>${esc(product.nombre)}</strong><br><span class="muted">${esc(product.descripcion)}</span></td>
      <td class="numeric">${fmtMoney(product.valorUnitario)}</td>
      <td class="numeric">${product.stock}</td>
      <td><span class="badge ${product.stock > 0 ? 'success' : 'danger'}">${product.stock > 0 ? 'Disponible' : 'Agotado'}</span></td>
      <td><div class="actions">
        <button type="button" class="btn secondary small" data-edit="${product.id}"><span>Editar</span></button>
        <button type="button" class="btn danger small" data-delete="${product.id}"><span>Eliminar</span></button>
      </div></td>
    </tr>`).join('') || `<tr><td colspan="6"><div class="empty"><strong>No hay productos registrados</strong>Crea el primero desde el formulario.</div></td></tr>`;
  };

  const askDeleteConfirmation = (message, onConfirm) => {
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    backdrop.dataset.open = 'true';
    backdrop.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="deleteTitle">
        <div class="dialog-head">
          <h2 id="deleteTitle">Confirmación</h2>
        </div>
        <div class="dialog-body">
          <p class="muted mb-1">${esc(message)}</p>
          <div class="actions">
            <button type="button" class="btn danger small" data-confirm="yes">Eliminar</button>
            <button type="button" class="btn secondary small" data-confirm="no">Cancelar</button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    const close = (value) => {
      backdrop.remove();
      if (value === 'yes') onConfirm();
    };

    backdrop.addEventListener('click', event => {
      if (event.target === backdrop) close('no');
    });
    backdrop.querySelector('[data-confirm="yes"]').addEventListener('click', () => close('yes'));
    backdrop.querySelector('[data-confirm="no"]').addEventListener('click', () => close('no'));
  };

  form.addEventListener('submit', event => {
    event.preventDefault();
    clearFieldErrors(fields);

    const result = validateProductData({
      nombre: document.getElementById('nombre').value,
      descripcion: document.getElementById('descripcion').value,
      valorUnitario: document.getElementById('valorUnitario').value,
      stock: document.getElementById('stock').value
    });

    Object.entries(result.errors).forEach(([id, message]) => setFieldError(id, message));
    if (!result.valid) {
      focusFirstError(fields);
      return;
    }

    const db = readDb();
    const duplicate = db.producto.some(product =>
      product.id !== editingId &&
      product.nombre.trim().toLocaleLowerCase('es-CO') === result.values.nombre.toLocaleLowerCase('es-CO')
    );

    if (duplicate) {
      setFieldError('nombre', 'Ya existe un producto con ese nombre.');
      document.getElementById('nombre').focus();
      return;
    }

    if (editingId !== null) {
      const product = db.producto.find(item => item.id === editingId);
      if (!product) {
        showToast('Producto no encontrado', 'La edición ya no corresponde a un producto existente.', 'error');
        clearForm();
        render();
        return;
      }

      product.nombre = result.values.nombre;
      product.descripcion = result.values.descripcion;
      product.valorUnitario = result.values.valorUnitario;
      product.stock = result.values.stock;
      showToast('Producto actualizado', `${product.nombre} refleja los nuevos datos.`);
    } else {
      db.producto.push({
        id: nextId(db.producto),
        ...result.values
      });
      showToast('Producto creado', `${result.values.nombre} ya está visible para los clientes.`);
    }

    writeDb(db);
    clearForm();
    render();
  });

  body.addEventListener('click', event => {
    const edit = event.target.closest('[data-edit]');
    if (edit) {
      const id = Number(edit.dataset.edit);
      const product = readDb().producto.find(item => item.id === id);
      if (!product) return;

      editingId = id;
      document.getElementById('productFormTitle').textContent = `Editar producto #${id}`;
      document.getElementById('nombre').value = product.nombre;
      document.getElementById('descripcion').value = product.descripcion;
      document.getElementById('valorUnitario').value = product.valorUnitario;
      document.getElementById('stock').value = product.stock;
      clearFieldErrors(fields);
      document.getElementById('cancelEdit').hidden = false;
      document.getElementById('nombre').focus();
      return;
    }

    const button = event.target.closest('[data-delete]');
    if (!button) return;

    const id = Number(button.dataset.delete);
    const db = readDb();
    const product = db.producto.find(item => item.id === id);
    if (!product) return;

    const referenced = db.detalles.some(detail => detail.idProducto === id);
    const message = referenced
      ? `¿Eliminar "${product.nombre}"? Tiene detalles de compra asociados. Se conservará la información histórica, pero dejará de estar disponible en el catálogo.`
      : `¿Eliminar "${product.nombre}" del catálogo?`;

    askDeleteConfirmation(message, () => {
      db.producto = db.producto.filter(item => item.id !== id);
      writeDb(db);

      if (editingId === id) clearForm();
      showToast('Producto eliminado', `${product.nombre} ya no aparece en el catálogo.`);
      render();
    });
  });

  document.getElementById('cancelEdit').addEventListener('click', clearForm);
  render();
}
