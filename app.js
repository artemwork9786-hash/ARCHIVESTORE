// ===== Telegram конфигурация =====
const TELEGRAM_TOKEN = '8784018769:AAFFL8Z0AX4hOrX60CIjPofQS_CPXuN2_wg';
const TELEGRAM_CHAT_ID = '2019789091';

// ===== Состояние корзины =====
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let products = [];

// ===== DOM-элементы =====
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItems = document.getElementById('cart-items');
const cartModal = document.getElementById('cart-modal');
const cartBackdrop = document.getElementById('cart-backdrop');
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');
const checkoutForm = document.getElementById('checkout-form');
const historyModal = document.getElementById('history-modal');
const historyBackdrop = document.getElementById('history-backdrop');
const historyItems = document.getElementById('history-items');
const openHistoryBtn = document.getElementById('open-history');
const closeHistoryBtn = document.getElementById('close-history');
const productPageModal = document.getElementById('product-page-modal');
const catalogGrid = document.getElementById('catalog-grid');

// ===== Загрузка товаров с сервера =====
const API_URL = 'http://localhost:3000/api/products';

async function loadProducts() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    products = await res.json();
    renderCatalog();
  } catch (e) {
    console.error('Ошибка загрузки товаров:', e);
    showNotification('Не удалось загрузить каталог', 'error');
    products = [];
    renderCatalog();
  }
}

// ===== Рендер каталога =====
function renderCatalog() {
  catalogGrid.innerHTML = products.map(p => `
    <div class="product-card cursor-pointer group" data-product-id="${p.id}">
      <div class="aspect-[3/4] bg-gray-100 dark:bg-white/5 overflow-hidden relative">
        <img src="${p.preview || ''}" alt="" class="absolute inset-0 w-full h-full object-cover blur-xl scale-110" aria-hidden="true">
        <img src="${p.preview || ''}" alt="${escapeHtml(p.name || '')}" class="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500">
      </div>
      <div class="pt-3 sm:pt-4">
        <p class="font-mono text-[10px] sm:text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider">${(p.specs && p.specs['Артикул']) || ''}</p>
        <h3 class="text-sm sm:text-base font-bold mt-1 uppercase tracking-wide">${escapeHtml(p.name || '')}</h3>
        <div class="flex items-center justify-between mt-2 sm:mt-3">
          <span class="font-mono text-sm sm:text-base font-bold">${formatPrice(p.price)}</span>
          <div class="card-action" data-id="${p.id}" data-price="${p.price || 0}">
            <button class="add-to-cart bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors px-4 py-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap rounded-none">В корзину</button>
            <div class="qty-control hidden items-center rounded-none overflow-hidden border border-gray-300 dark:border-white/20">
              <button data-action="decrease" class="qty-btn px-2.5 sm:px-3 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">−</button>
              <span class="qty-value w-6 sm:w-8 text-center font-mono text-xs sm:text-sm font-bold">1</span>
              <button data-action="increase" class="qty-btn px-2.5 sm:px-3 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">+</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `).join('');

  // Привязываем обработчики к новым карточкам
  catalogGrid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.card-action')) return;
      const id = parseInt(card.dataset.productId, 10);
      openProductPage(id);
    });
  });

  catalogGrid.querySelectorAll('.card-action').forEach(container => {
    const btn = container.querySelector('.add-to-cart');
    const id = parseInt(container.dataset.id, 10);
    const price = parseInt(container.dataset.price, 10);

    btn.addEventListener('click', (e) => { e.stopPropagation(); addToCart(id, price); });
    container.querySelector('[data-action="decrease"]').addEventListener('click', (e) => { e.stopPropagation(); changeQuantity(id, -1); });
    container.querySelector('[data-action="increase"]').addEventListener('click', (e) => { e.stopPropagation(); changeQuantity(id, 1); });
  });

  syncCardControls();
}

// ===== Уведомления =====
function showNotification(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  const isDark = document.documentElement.classList.contains('dark');

  const borderColor = type === 'error' ? 'border-l-2 border-l-red-500' : type === 'success' ? 'border-l-2 border-l-emerald-500' : '';
  const bgColor = isDark ? 'bg-neutral-900 text-white' : 'bg-white text-black';
  const borderColorMain = isDark ? 'border border-white/10' : 'border border-gray-200';

  toast.className = `${bgColor} ${borderColorMain} ${borderColor} px-4 py-3 font-mono text-xs pointer-events-auto opacity-0 transition-opacity duration-300 max-w-xs`;
  toast.textContent = message;

  container.appendChild(toast);
  requestAnimationFrame(() => { toast.style.opacity = '1'; });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== Работа с localStorage =====
function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
  cart = JSON.parse(localStorage.getItem('cart')) || [];
  updateCartCount();
  syncCardControls();
  renderCartModal();
}

// ===== Обновление счётчика в шапке =====
function updateCartCount() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = totalItems;
}

// ===== Подсчёт общей суммы =====
function getTotal() {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ===== Форматирование цены =====
function formatPrice(price) {
  return (price || 0).toLocaleString('ru-RU') + ' р.';
}

// ===== XSS-защита =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Синхронизация кнопок на карточках с состоянием корзины =====
function syncCardControls() {
  document.querySelectorAll('.card-action').forEach((container) => {
    const id = parseInt(container.dataset.id, 10);
    const btn = container.querySelector('.add-to-cart');
    const qtyCtrl = container.querySelector('.qty-control');
    const qtyValue = qtyCtrl.querySelector('.qty-value');
    const item = cart.find((i) => i.id === id);

    if (item) {
      btn.classList.add('hidden');
      qtyCtrl.classList.remove('hidden');
      qtyCtrl.classList.add('flex');
      qtyValue.textContent = item.quantity;
    } else {
      btn.classList.remove('hidden');
      qtyCtrl.classList.add('hidden');
      qtyCtrl.classList.remove('flex');
    }
  });
}

// ===== Добавление товара в корзину =====
function addToCart(id, price) {
  const product = products.find(p => p.id === id);
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      id,
      name: product ? product.name : `Товар #${id}`,
      price,
      quantity: 1,
    });
  }
  saveCart();
  updateCartCount();
  syncCardControls();
  renderCartModal();
}

// ===== Управление количеством =====
function changeQuantity(id, delta) {
  const item = cart.find((i) => i.id === id);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter((i) => i.id !== id);
  }

  saveCart();
  updateCartCount();
  syncCardControls();
  renderCartModal();
}

// ===== Удаление товара =====
function removeFromCart(id) {
  cart = cart.filter((i) => i.id !== id);
  saveCart();
  updateCartCount();
  syncCardControls();
  renderCartModal();
}

// ===== Рендер модалки корзины =====
function renderCartModal() {
  cartTotal.textContent = formatPrice(getTotal());

  if (cart.length === 0) {
    cartItems.innerHTML =
      '<p class="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600 text-center py-8">Корзина пуста</p>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => {
        const product = products.find(p => p.id === item.id);
        const preview = product ? product.preview : '';
        return `
            <div class="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 gap-3">
                <div class="w-10 h-10 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                  <img src="${preview}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'">
                </div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-sm uppercase tracking-wide truncate">${escapeHtml(item.name)}</p>
                    <p class="font-mono text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">${formatPrice(item.price)} × ${item.quantity}</p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                    <span class="font-mono text-sm font-bold mr-2">${formatPrice(item.price * item.quantity)}</span>
                    <button data-action="decrease" data-id="${item.id}"
                        class="w-7 h-7 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold rounded-none">−</button>
                    <span class="w-6 text-center font-mono text-xs font-bold">${item.quantity}</span>
                    <button data-action="increase" data-id="${item.id}"
                        class="w-7 h-7 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold rounded-none">+</button>
                    <button data-action="remove" data-id="${item.id}"
                        class="w-7 h-7 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-bold rounded-none ml-1">✕</button>
                </div>
            </div>
        `;
      },
    )
    .join('');
}

// ===== Открытие / закрытие модалки =====
function openModal() {
  cartModal.classList.remove('hidden');
  renderCartModal();
}

function closeModal() {
  cartModal.classList.add('hidden');
}

// ===== История заказов =====
function getOrderHistory() {
  return JSON.parse(localStorage.getItem('orderHistory')) || [];
}

function saveOrderToHistory() {
  const history = getOrderHistory();
  const order = {
    date: new Date().toLocaleString('ru-RU'),
    items: structuredClone(cart),
    total: getTotal(),
  };
  history.unshift(order);
  localStorage.setItem('orderHistory', JSON.stringify(history));
}

function openHistoryModal() {
  historyModal.classList.remove('hidden');
  renderHistory();
}

function closeHistoryModal() {
  historyModal.classList.add('hidden');
}

function renderHistory() {
  const history = getOrderHistory();

  if (history.length === 0) {
    historyItems.innerHTML =
      '<p class="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600 text-center py-8">У вас пока нет заказов</p>';
    return;
  }

  historyItems.innerHTML = history
    .map(
      (order) => `
            <div class="border border-gray-200 dark:border-white/10 p-4">
                <div class="flex items-center justify-between mb-3">
                    <span class="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500">${escapeHtml(order.date)}</span>
                    <span class="font-mono text-sm font-bold">${formatPrice(order.total)}</span>
                </div>
                <div class="space-y-1">
                    ${order.items
                      .map(
                        (item) => `
                        <div class="flex items-center justify-between text-xs">
                            <span class="font-bold uppercase tracking-wide">${escapeHtml(item.name)}</span>
                            <span class="font-mono text-gray-400 dark:text-neutral-500">${item.quantity} шт. × ${formatPrice(item.price)}</span>
                        </div>
                    `,
                      )
                      .join('')}
                </div>
            </div>
        `,
    )
    .join('');
}

// ===== Страница товара =====
function openProductPage(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  const specsRows = Object.entries(product.specs || {})
    .map(([key, val]) => `
      <tr class="border-b border-gray-200 dark:border-white/5">
        <td class="py-2 font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 pr-6">${key}</td>
        <td class="py-2 font-mono text-sm font-bold">${val || 'Неизвестно'}</td>
      </tr>
    `).join('');

  const thumbsHtml = product.images
    .map((img, i) => `<img src="${img}" onerror="this.style.display='none'" class="w-16 h-16 object-cover cursor-pointer border border-transparent hover:border-black dark:hover:border-white transition-colors ${i === 0 ? 'border-black dark:border-white' : ''}">`)
    .join('');

  productPageModal.innerHTML = `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <button onclick="closeProductPage()" class="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
        <span class="text-lg">←</span> Назад к каталогу
      </button>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

        <!-- Галерея -->
        <div class="lg:col-span-7">
          <div class="aspect-square bg-gray-100 dark:bg-white/5 overflow-hidden relative mb-3 cursor-pointer" id="product-main-image-wrap">
            <img id="product-main-image-bg" src="${product.preview}" alt="" class="absolute inset-0 w-full h-full object-cover blur-xl scale-110" aria-hidden="true">
            <img id="product-main-image" src="${product.preview}" class="relative w-full h-full object-contain">
          </div>
          <div id="product-thumbs" class="flex gap-2 overflow-x-auto pb-2">
            ${thumbsHtml}
          </div>
        </div>

        <!-- Инфо + покупка -->
        <div class="lg:col-span-5">
          <p class="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-neutral-500 mb-2">${(product.specs && product.specs['Артикул']) || ''}</p>
          <h1 class="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4">${escapeHtml(product.name)}</h1>
          <div class="font-mono text-3xl sm:text-4xl font-bold mb-6">${formatPrice(product.price)}</div>

          <p class="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-6">${escapeHtml(product.description || 'Нет описания')}</p>

          <h3 class="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500 mb-3">Характеристики</h3>
          <table class="w-full mb-8">
            ${specsRows}
          </table>

          <button onclick="addToCart(${product.id}, ${product.price}); closeProductPage();"
            class="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold">
            Добавить в корзину
          </button>
        </div>

      </div>
    </div>
  `;

  // Переключение миниатюр
  const mainImage = productPageModal.querySelector('#product-main-image');
  const mainImageBg = productPageModal.querySelector('#product-main-image-bg');
  productPageModal.querySelectorAll('#product-thumbs img').forEach(thumb => {
    thumb.addEventListener('click', () => {
      mainImage.src = thumb.src;
      mainImageBg.src = thumb.src;
      productPageModal.querySelectorAll('#product-thumbs img').forEach(t => t.classList.remove('border-black', 'dark:border-white'));
      thumb.classList.add('border-black', 'dark:border-white');
    });
  });

  // Клик по главному изображению — открыть лайтбокс
  mainImage.parentElement.addEventListener('click', () => {
    const currentSrc = mainImage.src;
    const allImages = product.images.filter(Boolean);
    const startIdx = allImages.findIndex(img => currentSrc.endsWith(img)) || 0;
    openLightbox(allImages, startIdx);
  });

  productPageModal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeProductPage() {
  productPageModal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ===== Лайтбокс =====
const lightbox = document.getElementById('lightbox');
const lightboxViewport = document.getElementById('lightbox-viewport');
const lightboxImage = document.getElementById('lightbox-image');
const lightboxCounter = document.getElementById('lightbox-counter');
const lightboxCloseBtn = document.getElementById('lightbox-close');
const lightboxPrevBtn = document.getElementById('lightbox-prev');
const lightboxNextBtn = document.getElementById('lightbox-next');

const LB_MIN_SCALE = 1;
const LB_MAX_SCALE = 4;
const LB_ZOOM_SPEED = 0.002;

let lb = {
  images: [],
  index: 0,
  scale: 1,
  tx: 0,
  ty: 0,
  dragging: false,
  dragX: 0,
  dragY: 0,
  dragTx: 0,
  dragTy: 0,
  didDrag: false,
  pinchDist: 0,
  pinchScale: 1,
};

function openLightbox(images, startIndex) {
  lb.images = images;
  lb.index = startIndex || 0;
  resetLbTransform();
  lb.dragging = false;
  lb.didDrag = false;
  lightboxImage.src = lb.images[lb.index];
  lightboxCounter.textContent = (lb.index + 1) + ' / ' + lb.images.length;
  lightboxPrevBtn.classList.toggle('hidden', lb.images.length < 2);
  lightboxNextBtn.classList.toggle('hidden', lb.images.length < 2);
  lightbox.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.add('hidden');
  document.body.style.overflow = '';
  resetLbTransform();
}

function resetLbTransform() {
  lb.scale = 1;
  lb.tx = 0;
  lb.ty = 0;
  applyLbTransform();
  lightboxViewport.style.cursor = 'grab';
}

function applyLbTransform() {
  lightboxImage.style.transform = 'translate(' + lb.tx + 'px,' + lb.ty + 'px) scale(' + lb.scale + ')';
}

function clampTranslate() {
  if (lb.scale <= 1) { lb.tx = 0; lb.ty = 0; return; }
  const vw = lightboxViewport.clientWidth;
  const vh = lightboxViewport.clientHeight;
  const imgW = lightboxImage.naturalWidth * lb.scale;
  const imgH = lightboxImage.naturalHeight * lb.scale;
  const maxX = Math.max(0, (imgW - vw) / 2);
  const maxY = Math.max(0, (imgH - vh) / 2);
  lb.tx = Math.max(-maxX, Math.min(maxX, lb.tx));
  lb.ty = Math.max(-maxY, Math.min(maxY, lb.ty));
}

function setLbIndex(newIndex) {
  lb.index = newIndex;
  resetLbTransform();
  lightboxImage.src = lb.images[lb.index];
  lightboxCounter.textContent = (lb.index + 1) + ' / ' + lb.images.length;
}

function lbZoomAt(clientX, clientY, delta) {
  const vw = lightboxViewport.clientWidth;
  const vh = lightboxViewport.clientHeight;
  const oldScale = lb.scale;
  const newScale = Math.max(LB_MIN_SCALE, Math.min(LB_MAX_SCALE, oldScale * (1 + delta)));
  if (newScale === oldScale) return;
  const imageX = (clientX - vw / 2 - lb.tx) / oldScale;
  const imageY = (clientY - vh / 2 - lb.ty) / oldScale;
  lb.tx = clientX - vw / 2 - imageX * newScale;
  lb.ty = clientY - vh / 2 - imageY * newScale;
  lb.scale = newScale;
  clampTranslate();
  applyLbTransform();
  lightboxViewport.style.cursor = lb.scale > 1 ? 'grab' : 'grab';
}

// Wheel zoom
lightboxViewport.addEventListener('wheel', (e) => {
  e.preventDefault();
  const delta = -e.deltaY * LB_ZOOM_SPEED;
  lbZoomAt(e.clientX, e.clientY, delta);
}, { passive: false });

// Pointer drag
lightboxViewport.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  lb.dragging = true;
  lb.didDrag = false;
  lb.dragX = e.clientX;
  lb.dragY = e.clientY;
  lb.dragTx = lb.tx;
  lb.dragTy = lb.ty;
  lightboxViewport.style.cursor = 'grabbing';
  lightboxViewport.setPointerCapture(e.pointerId);
});

lightboxViewport.addEventListener('pointermove', (e) => {
  if (!lb.dragging) return;
  const dx = e.clientX - lb.dragX;
  const dy = e.clientY - lb.dragY;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) lb.didDrag = true;
  if (lb.scale <= 1) return;
  lb.tx = lb.dragTx + dx;
  lb.ty = lb.dragTy + dy;
  clampTranslate();
  applyLbTransform();
});

lightboxViewport.addEventListener('pointerup', (e) => {
  if (!lb.dragging) return;
  lb.dragging = false;
  lightboxViewport.style.cursor = lb.scale > 1 ? 'grab' : 'grab';
  lightboxViewport.releasePointerCapture(e.pointerId);
});

// Click backdrop to close (only if not dragged)
lightboxViewport.addEventListener('click', (e) => {
  if (lb.didDrag) return;
  if (e.target === lightboxViewport) closeLightbox();
});

// Close / nav buttons
lightboxCloseBtn.addEventListener('click', closeLightbox);
lightboxPrevBtn.addEventListener('click', () => {
  if (lb.images.length < 2) return;
  setLbIndex((lb.index - 1 + lb.images.length) % lb.images.length);
});
lightboxNextBtn.addEventListener('click', () => {
  if (lb.images.length < 2) return;
  setLbIndex((lb.index + 1) % lb.images.length);
});

// Touch pinch-to-zoom
let lbTouches = [];

lightboxViewport.addEventListener('touchstart', (e) => {
  lbTouches = Array.from(e.touches);
  if (e.touches.length === 2) {
    e.preventDefault();
    lb.pinchDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    lb.pinchScale = lb.scale;
  }
}, { passive: false });

lightboxViewport.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    e.preventDefault();
    const newDist = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const ratio = newDist / lb.pinchDist;
    const newScale = Math.max(LB_MIN_SCALE, Math.min(LB_MAX_SCALE, lb.pinchScale * ratio));
    const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
    const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    const vw = lightboxViewport.clientWidth;
    const vh = lightboxViewport.clientHeight;
    const oldScale = lb.scale;
    const imageX = (midX - vw / 2 - lb.tx) / oldScale;
    const imageY = (midY - vh / 2 - lb.ty) / oldScale;
    lb.tx = midX - vw / 2 - imageX * newScale;
    lb.ty = midY - vh / 2 - imageY * newScale;
    lb.scale = newScale;
    clampTranslate();
    applyLbTransform();
  }
}, { passive: false });

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (lightbox.classList.contains('hidden')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft' && lb.images.length > 1) setLbIndex((lb.index - 1 + lb.images.length) % lb.images.length);
  if (e.key === 'ArrowRight' && lb.images.length > 1) setLbIndex((lb.index + 1) % lb.images.length);
  if (e.key === '+' || e.key === '=') lbZoomAt(lightboxViewport.clientWidth / 2, lightboxViewport.clientHeight / 2, 0.15);
  if (e.key === '-') lbZoomAt(lightboxViewport.clientWidth / 2, lightboxViewport.clientHeight / 2, -0.15);
});

// ===== Отправка заказа в Telegram =====
async function sendOrderToTelegram(event) {
  event.preventDefault();

  const form = event.target;
  const email = form.querySelector('input[name="email"]').value.trim();
  const telegram = form.querySelector('input[name="telegram"]').value.trim();
  const fullname = form.querySelector('input[name="fullname"]').value.trim();
  const phone = form.querySelector('input[name="phone"]').value.trim();

  if (!email || !telegram || !fullname || !phone) {
    showNotification('Заполните все поля', 'error');
    return;
  }

  const privacyCheckbox = document.getElementById('privacy-checkbox');
  const termsCheckbox = document.getElementById('terms-checkbox');
  if (!privacyCheckbox.checked || !termsCheckbox.checked) {
    showNotification('Необходимо принять оба соглашения', 'error');
    return;
  }

  if (cart.length === 0) {
    showNotification('Корзина пуста', 'error');
    return;
  }

  const itemsList = cart
    .map(
      (item) =>
        `  • ${item.name} — ${item.quantity} шт. × ${formatPrice(item.price)} = ${formatPrice(item.price * item.quantity)}`,
    )
    .join('\n');

  const text = [
    `🛒 *Новый заказ — ArchiveStore*`,
    ``,
    `📧 Email: ${email}`,
    `💬 Telegram: ${telegram}`,
    `👤 ФИО: ${fullname}`,
    `📞 Телефон: ${phone}`,
    ``,
    `📦 *Товары:*`,
    itemsList,
    ``,
    `💰 *Итого: ${formatPrice(getTotal())}*`,
  ].join('\n');

  // Сохраняем заказ в историю ДО отправки (чтобы не потерять при ошибке Telegram)
  saveOrderToHistory();

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const response = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

        showNotification('Заказ отправлен! Мы скоро свяжемся с вами.', 'success');
    cart = [];
    saveCart();
    updateCartCount();
    syncCardControls();
    renderCartModal();
    form.reset();
    closeModal();
  } catch (error) {
    console.error('Ошибка отправки:', error);
      showNotification('Не удалось отправить заказ. Попробуйте позже.', 'error');
  }
}

// ===== Переключатель темы =====
function initThemeToggle() {
  const toggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-icon');
  if (!toggle || !icon) return;

  function updateIcon() {
    icon.textContent = document.documentElement.classList.contains('dark') ? '☀️' : '🌙';
  }

  updateIcon();

  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateIcon();
  });
}

// ===== Инициализация =====
function init() {
  loadCart();
  initThemeToggle();
  loadProducts();

  // Открытие / закрытие модалки корзины
  openCartBtn.addEventListener('click', openModal);
  closeCartBtn.addEventListener('click', closeModal);
  cartBackdrop.addEventListener('click', closeModal);

  // Открытие / закрытие модалки истории
  openHistoryBtn.addEventListener('click', openHistoryModal);
  closeHistoryBtn.addEventListener('click', closeHistoryModal);
  historyBackdrop.addEventListener('click', closeHistoryModal);

  // Действия внутри модалки (+, −, удаление)
  cartItems.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = parseInt(btn.dataset.id, 10);
    const action = btn.dataset.action;

    if (action === 'increase') changeQuantity(id, 1);
    else if (action === 'decrease') changeQuantity(id, -1);
    else if (action === 'remove') removeFromCart(id);
  });

  // Сабмит формы
  checkoutForm.addEventListener('submit', sendOrderToTelegram);

  // Cookie-баннер
  const cookieBanner = document.getElementById('cookie-banner');
  const acceptCookiesBtn = document.getElementById('accept-cookies');
  if (!localStorage.getItem('cookiesAccepted')) {
    cookieBanner.classList.remove('hidden');
  }
  acceptCookiesBtn.addEventListener('click', () => {
    localStorage.setItem('cookiesAccepted', '1');
    cookieBanner.classList.add('hidden');
  });

  // Escape закрывает страницу товара
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !productPageModal.classList.contains('hidden')) {
      closeProductPage();
    }
  });

  // === Авторизация и админка ===
  const authModal = document.getElementById('auth-modal');
  const adminModal = document.getElementById('admin-panel-modal');
  const openAuthBtn = document.getElementById('open-auth');
  const closeAuthBtn = document.getElementById('close-auth');
  const authForm = document.getElementById('auth-form');
  const openAdminBtn = document.getElementById('open-admin');
  const closeAdminBtn = document.getElementById('close-admin');
  const adminForm = document.getElementById('admin-form');
  const adminScreenAdd = document.getElementById('admin-screen-add');
  const adminScreenList = document.getElementById('admin-screen-list');
  const adminBack = document.getElementById('admin-back');
  const adminHeaderNav = document.getElementById('admin-header-nav');
  const adminHeaderTitle = document.getElementById('admin-header-title');
  const adminTabAdd = document.getElementById('admin-tab-add');
  const adminTabList = document.getElementById('admin-tab-list');
  const adminSubmitBtn = document.getElementById('admin-submit-btn');
  const adminProductList = document.getElementById('admin-product-list');
  const adminEmptyList = document.getElementById('admin-empty-list');

  let adminMode = 'add';
  let editingProductId = null;

  function isAdmin() {
    return localStorage.getItem('isAdmin') === 'true';
  }

  function setAdminUI(loggedIn) {
    if (loggedIn) {
      openAuthBtn.textContent = 'Выйти';
      openAdminBtn.classList.remove('hidden');
    } else {
      openAuthBtn.textContent = 'Войти';
      openAdminBtn.classList.add('hidden');
      adminModal.classList.add('hidden');
    }
  }

  function switchAdminTab(tab) {
    adminMode = tab;
    adminBack.classList.add('hidden');
    adminBack.classList.remove('inline-flex');
    adminHeaderNav.classList.remove('hidden');
    if (tab === 'add') {
      adminHeaderTitle.textContent = 'Добавить товар';
      adminScreenAdd.classList.remove('hidden');
      adminScreenList.classList.add('hidden');
      adminTabAdd.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'dark:hover:text-white');
      adminTabList.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'dark:hover:text-white');
      adminTabAdd.classList.remove('border-gray-300', 'dark:border-white/20');
      adminTabList.classList.add('border-gray-300', 'dark:border-white/20');
      adminForm.reset();
      editingProductId = null;
      const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      document.getElementById('admin-article').value = `ARC-${String(nextId).padStart(3, '0')}`;
      document.getElementById('preview-file-label').textContent = 'Выбрать превью';
      document.getElementById('gallery-file-label').textContent = 'Выбрать доп. картинки';
      adminSubmitBtn.textContent = 'Добавить товар в каталог';
    } else {
      adminHeaderTitle.textContent = 'Список товаров';
      adminScreenAdd.classList.add('hidden');
      adminScreenList.classList.remove('hidden');
      adminTabList.classList.add('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'dark:hover:text-white');
      adminTabAdd.classList.remove('bg-black', 'dark:bg-white', 'text-white', 'dark:text-black', 'dark:hover:text-white');
      adminTabList.classList.remove('border-gray-300', 'dark:border-white/20');
      adminTabAdd.classList.add('border-gray-300', 'dark:border-white/20');
      renderAdminProductList();
    }
  }

  function switchAdminToEdit(productId) {
    adminMode = 'edit';
    editingProductId = productId;
    adminHeaderNav.classList.add('hidden');
    adminBack.classList.remove('hidden');
    adminBack.classList.add('inline-flex');
    adminHeaderTitle.textContent = 'Редактирование';
    adminScreenAdd.classList.remove('hidden');
    adminScreenList.classList.add('hidden');
    const product = products.find(p => p.id === productId);
    if (!product) return;
    adminForm.querySelector('input[name="name"]').value = product.name;
    adminForm.querySelector('input[name="price"]').value = product.price;
    document.getElementById('admin-article').value = (product.specs && product.specs['Артикул']) || '';
    adminForm.querySelector('input[name="composition"]').value = (product.specs && product.specs['Состав']) || '';
    adminForm.querySelector('input[name="country"]').value = (product.specs && product.specs['Страна']) || '';
    document.getElementById('preview-file-label').textContent = 'Выбрать превью';
    document.getElementById('gallery-file-label').textContent = 'Выбрать доп. картинки';
    adminSubmitBtn.textContent = 'Сохранить изменения';
  }

  function renderAdminProductList() {
    if (products.length === 0) {
      adminProductList.innerHTML = '';
      adminEmptyList.classList.remove('hidden');
      return;
    }
    adminEmptyList.classList.add('hidden');
    adminProductList.innerHTML = products.map(p => `
      <div class="flex items-center justify-between px-5 py-3 gap-3">
        <div class="w-10 h-10 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
          <img src="${p.preview}" alt="" class="w-full h-full object-cover" onerror="this.style.display='none'">
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-sm uppercase tracking-wide truncate">${escapeHtml(p.name)}</p>
          <p class="font-mono text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">${(p.specs && p.specs['Артикул']) || ''} &middot; ${formatPrice(p.price)}</p>
        </div>
        <div class="flex items-center gap-1.5 shrink-0">
          <button data-admin-edit="${p.id}" class="admin-edit-btn w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm" title="Редактировать">✎</button>
          <button data-admin-delete="${p.id}" class="admin-delete-btn w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm" title="Удалить">✕</button>
        </div>
      </div>
    `).join('');
  }

  async function deleteAdminProduct(id) {
    const row = adminProductList.querySelector(`[data-admin-delete="${id}"]`)?.closest('.flex');
    if (!row) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      products = products.filter(p => p.id !== id);
      row.remove();

      if (products.length === 0) {
        adminEmptyList.classList.remove('hidden');
      }

      showNotification('Товар удалён', 'success');
    } catch (err) {
      console.error('Ошибка удаления товара:', err);
      showNotification('Не удалось удалить товар', 'error');
    }
  }

  adminTabAdd.addEventListener('click', () => switchAdminTab('add'));
  adminTabList.addEventListener('click', () => switchAdminTab('list'));

  adminBack.addEventListener('click', () => switchAdminTab('list'));

  adminProductList.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-admin-edit]');
    const deleteBtn = e.target.closest('[data-admin-delete]');
    if (editBtn) switchAdminToEdit(parseInt(editBtn.dataset.adminEdit, 10));
    else if (deleteBtn) deleteAdminProduct(parseInt(deleteBtn.dataset.adminDelete, 10));
  });

  // Показать состояние авторизации при загрузке
  setAdminUI(isAdmin());

  // Кнопка "Войти/Выйти" — переключатель
  openAuthBtn.addEventListener('click', () => {
    if (isAdmin()) {
      // Выход
      localStorage.removeItem('isAdmin');
      setAdminUI(false);
      showNotification('Вы вышли из аккаунта', 'success');
    } else {
      // Показать форму входа
      authModal.classList.remove('hidden');
    }
  });

  closeAuthBtn.addEventListener('click', () => authModal.classList.add('hidden'));
  authModal.querySelector('.absolute').addEventListener('click', () => authModal.classList.add('hidden'));

  openAdminBtn.addEventListener('click', () => {
    switchAdminTab('add');
    adminModal.classList.remove('hidden');
  });
  closeAdminBtn.addEventListener('click', () => adminModal.classList.add('hidden'));
  adminModal.querySelector('.absolute').addEventListener('click', () => adminModal.classList.add('hidden'));

  authForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const login = authForm.querySelector('input[name="login"]').value.trim();
    const password = authForm.querySelector('input[name="password"]').value.trim();
    if (login === 'admin' && password === 'archivestore2026') {
      localStorage.setItem('isAdmin', 'true');
      authModal.classList.add('hidden');
      setAdminUI(true);
      switchAdminTab('add');
      adminModal.classList.remove('hidden');
      authForm.reset();
      showNotification('Добро пожаловать, администратор', 'success');
    } else {
      showNotification('Неверный логин или пароль', 'error');
    }
  });

  // File input labels
  const previewFile = document.getElementById('preview-file');
  const galleryFiles = document.getElementById('gallery-files');

  previewFile.addEventListener('change', () => {
    document.getElementById('preview-file-label').textContent = previewFile.files.length ? previewFile.files[0].name : 'Выбрать превью';
  });
  galleryFiles.addEventListener('change', () => {
    document.getElementById('gallery-file-label').textContent = galleryFiles.files.length ? `${galleryFiles.files.length} файл(ов)` : 'Выбрать доп. картинки';
  });

  adminForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(adminForm);

    if (adminMode === 'edit' && editingProductId !== null) {
      const product = products.find(p => p.id === editingProductId);
      if (product) {
        product.name = fd.get('name');
        product.price = parseInt(fd.get('price'), 10);
        product.description = fd.get('description');
        if (!product.specs) product.specs = {};
        product.specs['Состав'] = fd.get('composition') || '';
        product.specs['Страна'] = fd.get('country') || '';
        renderCatalog();
        showNotification('Товар обновлён', 'success');
      }
      switchAdminTab('list');
      return;
    }

    // FormData уже содержит файл превью из инпута name="preview"
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: fd,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      adminForm.reset();
      document.getElementById('preview-file-label').textContent = 'Выбрать превью';
      document.getElementById('gallery-file-label').textContent = 'Выбрать доп. картинки';
      adminModal.classList.add('hidden');
      await loadProducts();
      showNotification('Товар успешно добавлен', 'success');
    } catch (err) {
      console.error('Ошибка добавления товара:', err);
      showNotification('Не удалось добавить товар', 'error');
    }
  });

}

document.addEventListener('DOMContentLoaded', init);
