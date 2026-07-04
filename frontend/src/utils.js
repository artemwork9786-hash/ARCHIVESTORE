const STORAGE_KEY = 'cart';

export function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

export function formatPrice(price) {
  return (price || 0).toLocaleString('ru-RU') + ' р.';
}
