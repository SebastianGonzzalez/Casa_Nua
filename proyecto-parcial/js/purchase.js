import { APP_CONFIG } from './config.js';
import { readDb, writeDb, nextId, currentClient, nowIso } from './storage.js';
import { esc, fmtMoney, showToast } from './utils.js';
import { validateCartQuantity, validatePurchaseLines } from './validators.js';
import { icon } from './icons.js';

export function initPurchase() {
  const catalog = document.getElementById('catalog');
  const cartList = document.getElementById('cartList');
  const confirmButton = document.getElementById('confirmPurchase');
  const clearButton = document.getElementById('clearCart');
  if (!catalog || !cartList || !confirmButton || !clearButton) return;

  let cart = new Map();

  const sanitizeCartAgainstStock = () => {
    const db = readDb();
    for (const [id, item] of cart.entries()) {
      const product = db.producto.find(p => p.id === id);
      if (!product || product.stock <= 0) {
        cart.delete(id);
        continue;
      }
      const check = validateCartQuantity(item.cantidad, product.stock);
      if (!check.valid) {
        cart.set(id, { cantidad: product.stock });
      }
    }
  };

  const renderCatalog = () => {
    sanitizeCartAgainstStock();
    const db = readDb();

    catalog.innerHTML = db.producto.map(product => {
      const selected = cart.get(product.id)?.cantidad || 1;
      const max = product.stock;
      return `
        <article class="panel product-card">
          <div class="product-top">
            <div><span class="product-id">Producto #${product.id}</span><h3>${esc(product.nombre)}</h3></div>
            <span class="badge ${max > 0 ? 'success' : 'danger'}">${max > 0 ? `${max} disponibles` : 'Agotado'}</span>
          </div>
          <p class="product-desc">${esc(product.descripcion)}</p>
          <div class="product-price">${fmtMoney(product.valorUnitario)}</div>
          <div class="actions">
            <label class="field" style="flex:1;min-width:120px">
              <span class="helper">Cantidad</span>
              <input class="input qty-input" data-product="${product.id}" type="number" inputmode="numeric" min="1" max="${max}" step="1" value="${Math.max(1, Math.min(selected, max || 1))}" ${max === 0 ? 'disabled' : ''} aria-label="Cantidad de ${esc(product.nombre)}">
            </label>
            <button class="btn" type="button" data-add="${product.id}" ${max === 0 ? 'disabled' : ''}>${icon.cart}<span>Agregar</span></button>
          </div>
        </article>`;
    }).join('') || `<div class="panel empty" style="grid-column:1/-1"><strong>No hay productos registrados</strong>El administrador debe crear productos antes de realizar una compra.</div>`;
  };

  const renderCart = () => {
    sanitizeCartAgainstStock();
    const db = readDb();
    const entries = [...cart.entries()]
      .map(([id, item]) => ({ product: db.producto.find(p => p.id === id), ...item }))
      .filter(entry => entry.product);

    cartList.innerHTML = entries.length
      ? entries.map(({ product, cantidad }) => `
        <div class="cart-item">
          <div><strong>${esc(product.nombre)}</strong><small>${fmtMoney(product.valorUnitario)} por unidad · máximo ${product.stock}</small></div>
          <div class="qty-control">
            <input class="input cart-qty" data-cart-id="${product.id}" type="number" min="1" max="${product.stock}" step="1" value="${cantidad}" aria-label="Cantidad de ${esc(product.nombre)} en el carrito">
          </div>
        </div>`).join('')
      : `<div class="empty"><strong>Tu carrito está vacío</strong>Agrega productos del catálogo para comenzar.</div>`;

    const total = entries.reduce((sum, entry) => sum + entry.product.valorUnitario * entry.cantidad, 0);
    const units = entries.reduce((sum, entry) => sum + entry.cantidad, 0);

    document.getElementById('cartCount').textContent = `${units} ${units === 1 ? 'unidad' : 'unidades'}`;
    document.getElementById('cartTotal').textContent = fmtMoney(total);
    confirmButton.disabled = entries.length === 0;
  };

  catalog.addEventListener('input', event => {
    const input = event.target.closest('.qty-input');
    if (!input) return;
    if (input.value === '') return;
    const product = readDb().producto.find(p => p.id === Number(input.dataset.product));
    if (!product) return;

    const result = validateCartQuantity(input.value, product.stock);
    input.setCustomValidity(result.valid ? '' : result.message);
  });

  catalog.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;

    const id = Number(button.dataset.add);
    const db = readDb();
    const product = db.producto.find(p => p.id === id);
    if (!product || product.stock <= 0) return;

    const input = catalog.querySelector(`.qty-input[data-product="${id}"]`);
    const result = validateCartQuantity(input?.value, product.stock);
    if (!result.valid) {
      showToast('Cantidad inválida', result.message, 'error');
      input?.focus();
      return;
    }

    const current = cart.get(id)?.cantidad || 0;
    const requested = current + result.quantity;
    if (requested > product.stock) {
      showToast('Límite de stock', `Solo quedan ${product.stock} unidades de ${product.nombre}.`, 'error');
      return;
    }

    cart.set(id, { cantidad: requested });
    renderCatalog();
    renderCart();
  });

  cartList.addEventListener('change', event => {
    const input = event.target.closest('[data-cart-id]');
    if (!input) return;

    const id = Number(input.dataset.cartId);
    const product = readDb().producto.find(p => p.id === id);
    if (!product) {
      cart.delete(id);
      renderCatalog();
      renderCart();
      return;
    }

    const result = validateCartQuantity(input.value, product.stock);
    if (!result.valid) {
      showToast('Cantidad inválida', result.message, 'error');
      input.value = cart.get(id)?.cantidad || 1;
      return;
    }

    cart.set(id, { cantidad: result.quantity });
    renderCatalog();
    renderCart();
  });

  clearButton.addEventListener('click', () => {
    cart.clear();
    renderCatalog();
    renderCart();
  });

  confirmButton.addEventListener('click', () => {
    const client = currentClient();
    if (!client?.complete) {
      showToast('Completa tu perfil', 'Guarda tus datos personales antes de confirmar una compra.', 'error');
      window.location.href = 'profile.html';
      return;
    }

    const db = readDb();
    const entries = [...cart.entries()].map(([id, item]) => ({ id, cantidad: item.cantidad }));
    const result = validatePurchaseLines(db, entries);

    if (!result.valid) {
      showToast('No se pudo confirmar', result.message, 'error');
      renderCatalog();
      renderCart();
      return;
    }

    const nextDb = JSON.parse(JSON.stringify(db));
    const headerId = nextId(nextDb.encabezado);
    let detailId = nextId(nextDb.detalles);

    for (const line of result.lines) {
      const product = nextDb.producto.find(p => p.id === line.product.id);
      if (!product || product.stock < line.cantidad) {
        showToast('Stock actualizado', 'Algún producto cambió de disponibilidad. Revisa el carrito.', 'error');
        renderCatalog();
        renderCart();
        return;
      }
      product.stock -= line.cantidad;
    }

    nextDb.encabezado.push({
      id: headerId,
      idCliente: client.id,
      fecha: nowIso(),
      total: result.total
    });

    nextDb.detalles.push(...result.lines.map(line => ({
      id: detailId++,
      idEncabezado: headerId,
      idProducto: line.product.id,
      cantidad: line.cantidad,
      valorUnitario: line.valorUnitario,
      valor: line.subtotal
    })));

    writeDb(nextDb);
    cart.clear();
    renderCatalog();
    renderCart();

    showToast('Compra confirmada', `Pedido #${headerId} creado por ${fmtMoney(result.total)}.`);
    window.setTimeout(() => {
      window.location.href = `details.html?id=${headerId}`;
    }, 500);
  });

  renderCatalog();
  renderCart();
}
