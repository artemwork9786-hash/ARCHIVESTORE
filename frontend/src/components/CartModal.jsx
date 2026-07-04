import { useState, useEffect } from 'react';
import { formatPrice } from '../utils';
import { apiUrl, imgUrl } from '../config';
import LoadingOverlay from './LoadingOverlay';

export default function CartModal({ isOpen, onClose, cart, products, cartTotal, user, onChangeQuantity, removeFromCart, clearCart, onNotify, onOpenPrivacy }) {
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setEmail(user.email || '');
      setTelegram(user.telegram || '');
      setFullname(user.fullname || '');
      setPhone(user.phone || '');
    } else if (isOpen) {
      setEmail('');
      setTelegram('');
      setFullname('');
      setPhone('');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const saveOrderToHistory = () => {
    const history = JSON.parse(localStorage.getItem('orderHistory')) || [];
    const order = {
      date: new Date().toLocaleString('ru-RU'),
      items: cart.map((i) => ({ ...i })),
      total: cartTotal,
    };
    history.unshift(order);
    localStorage.setItem('orderHistory', JSON.stringify(history));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !telegram || !fullname || !phone) {
      onNotify('Заполните все поля', 'error');
      return;
    }
    if (!privacyChecked || !termsChecked) {
      onNotify('Необходимо принять оба соглашения', 'error');
      return;
    }
    if (cart.length === 0) {
      onNotify('Корзина пуста', 'error');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(apiUrl('/api/orders'), {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email,
          telegram,
          fullname,
          phone,
          items: cart.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity })),
          total: cartTotal,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      saveOrderToHistory();
      onNotify('Заказ принят! Мы скоро свяжемся с вами.', 'success');
      onClose();
      clearCart();
      setEmail('');
      setTelegram('');
      setFullname('');
      setPhone('');
      setPrivacyChecked(false);
      setTermsChecked(false);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      onNotify('Не удалось отправить заказ. Попробуйте позже.', 'error');
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-neutral-600 font-mono text-sm";
  const labelClass = "font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-black w-full sm:max-w-lg sm:mx-4 max-h-[90vh] flex flex-col transition-colors border-t sm:border border-gray-200 dark:border-white/10">
        <LoadingOverlay show={loading} />
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">Корзина</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg">
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600 text-center py-8">
              Корзина пуста
            </p>
          ) : (
            cart.map((item) => {
              const product = products.find((p) => p.id === item.id);
              const preview = product ? product.preview : '';
              return (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 gap-3">
                  <div className="w-10 h-10 shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5">
                    <img src={imgUrl(preview)} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm uppercase tracking-wide truncate">{item.name}</p>
                    <p className="font-mono text-[10px] text-gray-400 dark:text-neutral-500 mt-0.5">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-sm font-bold mr-2">{formatPrice(item.price * item.quantity)}</span>
                    <button onClick={() => onChangeQuantity(item.id, -1)}
                      className="w-7 h-7 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold rounded-none">−</button>
                    <span className="w-6 text-center font-mono text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => onChangeQuantity(item.id, 1)}
                      className="w-7 h-7 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm font-bold rounded-none">+</button>
                    <button onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors text-sm font-bold rounded-none ml-1">✕</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-gray-500 dark:text-neutral-400">Итого</span>
          <span className="font-mono text-lg font-bold">{formatPrice(cartTotal)}</span>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3 border-t border-gray-200 dark:border-white/10 pt-4">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" name="email" placeholder="mail@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            <p className="font-mono text-[9px] text-gray-400 dark:text-neutral-600 mt-1">Указывайте регистрационный e-mail адрес — это важно</p>
          </div>
          <div>
            <label className={labelClass}>Telegram</label>
            <input type="text" name="telegram" placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputClass} />
            <p className="font-mono text-[9px] text-gray-400 dark:text-neutral-600 mt-1">Как с вами связаться</p>
          </div>
          <div>
            <label className={labelClass}>ФИО</label>
            <input type="text" name="fullname" placeholder="Иванов Иван Иванович" value={fullname} onChange={(e) => setFullname(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Телефон</label>
            <input type="tel" name="phone" placeholder="+7 (999) 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={privacyChecked} onChange={(e) => setPrivacyChecked(e.target.checked)}
              className="appearance-none w-5 h-5 rounded-none bg-transparent border border-neutral-600 dark:border-neutral-400 checked:border-black dark:checked:border-white checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22black%22%3E%3Cpath%20d%3D%22M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41z%22%2F%3E%3C%2Fsvg%3E')] dark:checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41z%22%2F%3E%3C%2Fsvg%3E')] checked:bg-transparent dark:checked:bg-transparent checked:bg-no-repeat checked:bg-center checked:bg-[length:16px_16px] cursor-pointer flex-shrink-0" />
            <span className="font-mono text-[10px] text-gray-400 dark:text-neutral-500 leading-tight uppercase tracking-wider">
              Даю согласие на <button type="button" onClick={onOpenPrivacy} className="underline hover:text-black dark:hover:text-white transition-colors">обработку моих персональных данных</button>
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" checked={termsChecked} onChange={(e) => setTermsChecked(e.target.checked)}
              className="appearance-none w-5 h-5 rounded-none bg-transparent border border-neutral-600 dark:border-neutral-400 checked:border-black dark:checked:border-white checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22black%22%3E%3Cpath%20d%3D%22M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41z%22%2F%3E%3C%2Fsvg%3E')] dark:checked:bg-[url('data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M9%2016.17L4.83%2012l-1.42%201.41L9%2019%2021%207l-1.41-1.41z%22%2F%3E%3C%2Fsvg%3E')] checked:bg-transparent dark:checked:bg-transparent checked:bg-no-repeat checked:bg-center checked:bg-[length:16px_16px] cursor-pointer flex-shrink-0" />
            <span className="font-mono text-[10px] text-gray-400 dark:text-neutral-500 leading-tight uppercase tracking-wider">
              Принимаю условия <button type="button" onClick={onOpenPrivacy} className="underline hover:text-black dark:hover:text-white transition-colors">Пользовательского соглашения и Публичной оферты</button>
            </span>
          </label>
          <button type="submit"
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold">
            Оформить заказ
          </button>
        </form>
      </div>
    </div>
  );
}
