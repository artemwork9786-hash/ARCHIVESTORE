import { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import CatalogGrid from './components/CatalogGrid';
import CartModal from './components/CartModal';
import HistoryModal from './components/HistoryModal';
import AuthModal from './components/AuthModal';
import AdminModal from './components/AdminModal';
import Lightbox from './components/Lightbox';
import CookieBanner from './components/CookieBanner';
import PrivacyModal from './components/PrivacyModal';
import DeliveryModal from './components/DeliveryModal';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ProductPage from './pages/ProductPage';
import { useCart } from './hooks/useCart';
import { apiUrl } from './config';

function AppContent() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [toasts, setToasts] = useState([]);

  const [cartOpen, setCartOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const { cart, cartCount, cartTotal, addToCart, changeQuantity, removeFromCart, clearCart } = useCart(products);

  useEffect(() => {
    fetch(apiUrl('/api/products'))
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((data) => { setProducts(data); setLoadingProducts(false); })
      .catch((e) => {
        console.error('Ошибка загрузки товаров:', e);
        setLoadingProducts(false);
        notify('Не удалось загрузить каталог', 'error');
      });
  }, []);

  const notify = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3300);
  }, []);

  const handleLogout = useCallback(() => {
    useAuth().logout();
    setAdminOpen(false);
    notify('Вы вышли из аккаунта', 'success');
  }, [notify]);

  const isAdmin = user?.role === 'admin';

  const anyModalOpen = cartOpen || historyOpen || authOpen || adminOpen || lightbox.open || privacyOpen || deliveryOpen;
  useEffect(() => {
    document.body.style.overflow = anyModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyModalOpen]);

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white transition-colors flex flex-col">
      <Header
        user={user}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenAuth={() => {
          if (user) {
            useAuth().logout();
            setAdminOpen(false);
            notify('Вы вышли из аккаунта', 'success');
          } else {
            setAuthOpen(true);
          }
        }}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <div className="flex-1">
        <Routes>
          <Route path="/" element={
            <CatalogGrid
              products={products}
              cart={cart}
              loading={loadingProducts}
              onAddToCart={addToCart}
              onChangeQuantity={changeQuantity}
            />
          } />
          <Route path="/product/:id" element={
            <ProductPage
              products={products}
              cart={cart}
              onAddToCart={addToCart}
              onChangeQuantity={changeQuantity}
              onNotify={notify}
              onOpenLightbox={(images, index) => setLightbox({ open: true, images, index })}
            />
          } />
        </Routes>
      </div>

      <CartModal
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        products={products}
        cartTotal={cartTotal}
        user={user}
        onChangeQuantity={changeQuantity}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        onNotify={notify}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      <HistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} onNotify={notify} />

      <AdminModal
        isOpen={adminOpen}
        onClose={() => setAdminOpen(false)}
        products={products}
        setProducts={setProducts}
        onNotify={notify}
      />

      <Lightbox
        isOpen={lightbox.open}
        images={lightbox.images}
        startIndex={lightbox.index}
        onClose={() => setLightbox((prev) => ({ ...prev, open: false }))}
      />

      <Footer onOpenPrivacy={() => setPrivacyOpen(true)} onOpenDelivery={() => setDeliveryOpen(true)} />
      <CookieBanner />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <DeliveryModal isOpen={deliveryOpen} onClose={() => setDeliveryOpen(false)} />
      <Toast toasts={toasts} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
