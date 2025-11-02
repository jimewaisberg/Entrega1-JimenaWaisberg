// client-side socket handler for realtimeProducts view
const socket = io();

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function renderProducts(products) {
  const container = document.getElementById('productsList');
  if (!container) return;
  if (!products || products.length === 0) {
    container.innerHTML = '<p>No hay productos aún.</p>';
    return;
  }
  container.innerHTML = products.map(p => `
    <div class="product" data-id="${p.id}">
      <div>
        <strong>${escapeHtml(p.title)}</strong> — ${escapeHtml(p.description)} <br/>
        <small>Precio: $${p.price} | Stock: ${p.stock} | ID: ${p.id}</small>
      </div>
      <div class="controls">
        <button class="btn btn-danger btn-delete" data-id="${p.id}">Eliminar</button>
      </div>
    </div>
  `).join('');
  // attach delete listeners
  $$('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      if (!id) return;
      if (!confirm('¿Eliminar producto?')) return;
      socket.emit('deleteProduct', id);
    });
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/* --------------------
   Toast implementation
   -------------------- */
function showToast(type = 'success', text = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<div class="msg">${escapeHtml(text)}</div>`;
  container.appendChild(toast);
  // Force reflow to enable transition
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  // Hide after 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3000);
}

/* --------------------
   Socket events
   -------------------- */
socket.on('connect', () => {
  console.log('Conectado al server via socket, id:', socket.id);
});

socket.on('updateProducts', (products) => {
  console.log('updateProducts', products);
  renderProducts(products);
});

socket.on('actionSuccess', (payload) => {
  const msg = payload && payload.message ? payload.message : 'Acción completada';
  showToast('success', msg);
});

socket.on('actionError', (payload) => {
  const msg = payload && payload.message ? payload.message : 'Ocurrió un error';
  showToast('error', msg);
});

// generic socket error
socket.on('error', (err) => {
  console.error('Socket error', err);
  showToast('error', (err && err.message) ? err.message : 'Error en la conexión');
});

/* --------------------
   Form submit (create product)
   -------------------- */
const form = document.getElementById('createProductForm');
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const payload = {
      title: fd.get('title'),
      description: fd.get('description'),
      code: fd.get('code'),
      price: fd.get('price') ? parseFloat(fd.get('price')) : 0,
      stock: fd.get('stock') ? parseInt(fd.get('stock')) : 0,
      category: fd.get('category'),
      thumbnails: fd.get('thumbnails')
    };
    socket.emit('createProduct', payload);
    form.reset();
  });
}

