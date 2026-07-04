import { useState, useEffect } from 'react';
import { formatPrice } from '../utils';
import { apiUrl } from '../config';

export default function HistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setHistory([]);
      return;
    }

    setLoading(true);
    fetch(apiUrl('/api/orders'), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setHistory(data))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-black w-full sm:max-w-lg sm:mx-4 max-h-[90vh] flex flex-col transition-colors border-t sm:border border-gray-200 dark:border-white/10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/10">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">Мои заказы</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg">
            &times;
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600 text-center py-8">
              Загрузка...
            </p>
          ) : history.length === 0 ? (
            <p className="font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-600 text-center py-8">
              У вас пока нет заказов
            </p>
          ) : (
            history.map((order) => (
              <div key={order.id} className="border border-gray-200 dark:border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500">{order.date}</span>
                  <span className="font-mono text-sm font-bold">{formatPrice(order.total)}</span>
                </div>
                <div className="space-y-1">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-bold uppercase tracking-wide">{item.name}</span>
                      <span className="font-mono text-gray-400 dark:text-neutral-500">{item.quantity} шт. × {formatPrice(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
