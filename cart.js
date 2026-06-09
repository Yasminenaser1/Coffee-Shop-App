// ── Cart Management (shared across all pages) ─────────────────────────────
window.Cart = (() => {
  const KEY = 'tdd_cart';

  function getItems() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent('cart-updated'));
  }

  function add(item) {
    const items = getItems();
    const existing = items.find(i => i.id === item.id);
    if (existing) { existing.quantity += 1; }
    else { items.push({ ...item, quantity: 1 }); }
    save(items);
  }

  function remove(id) {
    save(getItems().filter(i => i.id !== id));
  }

  function setQty(id, qty) {
    if (qty < 1) { remove(id); return; }
    const items = getItems();
    const it = items.find(i => i.id === id);
    if (it) { it.quantity = qty; save(items); }
  }

  function getCount() {
    return getItems().reduce((s, i) => s + i.quantity, 0);
  }

  function getSubtotal() {
    return getItems().reduce((s, i) => s + i.price * i.quantity, 0);
  }

  function clear() { save([]); }

  return { getItems, add, remove, setQty, getCount, getSubtotal, clear };
})();

// ── Navbar cart badge (runs on every page) ────────────────────────────────
function updateCartBadge() {
  const badge = document.querySelector('.cart-badge');
  if (!badge) return;
  const count = Cart.getCount();
  badge.textContent = count;
  badge.classList.toggle('hidden', count === 0);
}
window.addEventListener('cart-updated', updateCartBadge);
document.addEventListener('DOMContentLoaded', updateCartBadge);

// ── Toast helper ──────────────────────────────────────────────────────────
window.showToast = function(msg, type = '') {
  let tc = document.querySelector('.toast-container');
  if (!tc) {
    tc = document.createElement('div');
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span> ${msg}`;
  tc.appendChild(t);
  setTimeout(() => t.remove(), 3200);
};
