import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatPrice } from '../utils';
import { imgUrl } from '../config';

function Thumb({ src, isActive, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  if (error) return null;
  return (
    <div className="relative w-16 h-16 shrink-0 cursor-pointer" onClick={onClick}>
      {!loaded && <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 animate-pulse" />}
      <img src={imgUrl(src)} loading="lazy" alt=""
        className={`w-16 h-16 object-cover border transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${
          isActive ? 'border-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)} />
    </div>
  );
}

export default function ProductPage({ products, cart, onAddToCart, onChangeQuantity, onNotify, onOpenLightbox }) {
  const { id } = useParams();
  const [currentIndex, setCurrentIndex] = useState(0);

  const product = products.find((p) => String(p.id) === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-center">
        <p className="font-mono text-sm text-gray-400 dark:text-neutral-500">Товар не найден</p>
        <Link to="/" className="inline-block mt-4 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
          ← Назад к каталогу
        </Link>
      </div>
    );
  }

  const images = (product.images || []).filter(Boolean).filter((img) => img !== product.preview);
  const allImages = [product.preview, ...images].filter(Boolean);
  const currentImage = allImages[currentIndex] || product.preview;
  const prev = () => setCurrentIndex((i) => (i - 1 + allImages.length) % allImages.length);
  const next = () => setCurrentIndex((i) => (i + 1) % allImages.length);

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => (
    <tr key={key} className="border-b border-gray-200 dark:border-white/5">
      <td className="py-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 pr-6">{key}</td>
      <td className="py-2 font-mono text-sm font-bold">{val || 'Неизвестно'}</td>
    </tr>
  ));

  const cartItem = cart.find((c) => c.id === product.id);

  const handleAddToCart = () => {
    onAddToCart(product.id, product.price);
    onNotify('Товар добавлен в корзину', 'success');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link to="/"
        className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
        <span className="text-lg">←</span> Назад к каталогу
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        <div className="lg:col-span-7">
          <div className="group relative aspect-square bg-gray-100 dark:bg-white/5 overflow-hidden mb-3 cursor-pointer"
            onClick={() => onOpenLightbox(allImages, currentIndex)}>
            <img src={imgUrl(currentImage)} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" aria-hidden="true" />
            <img src={imgUrl(currentImage)} className="relative w-full h-full object-contain" draggable="false" />
            {allImages.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 text-xl">‹</button>
                <button onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 text-xl">›</button>
              </>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {allImages.map((img, i) => (
              <Thumb key={i} src={img} isActive={i === currentIndex} onClick={() => setCurrentIndex(i)} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-gray-400 dark:text-neutral-500 mb-2">
            {(product.specs && product.specs['Артикул']) || ''}
          </p>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-4">{product.name}</h1>
          <div className="font-mono text-3xl sm:text-4xl font-bold mb-6">{formatPrice(product.price)}</div>
          <p className="text-sm text-gray-600 dark:text-neutral-400 leading-relaxed mb-6">
            {product.description || 'Нет описания'}
          </p>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-gray-400 dark:text-neutral-500 mb-3">Характеристики</h3>
          <table className="w-full mb-8"><tbody>{specsRows}</tbody></table>
          {cartItem ? (
            <div className="flex items-center justify-center gap-0 border border-gray-300 dark:border-white/20 overflow-hidden">
              <button onClick={() => onChangeQuantity(product.id, -1)}
                className="px-6 py-3 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono">−</button>
              <span className="w-12 text-center font-mono text-sm font-bold">{cartItem.quantity}</span>
              <button onClick={() => onChangeQuantity(product.id, 1)}
                className="px-6 py-3 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono">+</button>
            </div>
          ) : (
            <button onClick={handleAddToCart}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold">
              Добавить в корзину
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
