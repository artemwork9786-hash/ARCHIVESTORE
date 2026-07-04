import { useState } from 'react';
import { formatPrice } from '../utils';

function Thumb({ src, isActive, onClick }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) return null;

  return (
    <div className="relative w-16 h-16 shrink-0 cursor-pointer" onClick={onClick}>
      {!loaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-white/10 animate-pulse" />
      )}
      <img src={src} loading="lazy" alt=""
        className={`w-16 h-16 object-cover border transition-all duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${
          isActive ? 'border-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white'
        }`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)} />
    </div>
  );
}

export default function ProductPageModal({ isOpen, product, onClose, onAddToCart, onOpenLightbox }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || !product) return null;

  const images = (product.images || []).filter(Boolean);
  const currentImage = images[currentIndex] || product.preview;

  const prev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setCurrentIndex((i) => (i + 1) % images.length);

  const specsRows = Object.entries(product.specs || {}).map(([key, val]) => (
    <tr key={key} className="border-b border-gray-200 dark:border-white/5">
      <td className="py-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 pr-6">{key}</td>
      <td className="py-2 font-mono text-sm font-bold">{val || 'Неизвестно'}</td>
    </tr>
  ));

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black overflow-y-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={onClose}
          className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
          <span className="text-lg">←</span> Назад к каталогу
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Gallery */}
          <div className="lg:col-span-7">
            {/* Main image with slider arrows */}
            <div className="group relative aspect-square bg-gray-100 dark:bg-white/5 overflow-hidden mb-3 cursor-pointer"
              onClick={() => onOpenLightbox(images, currentIndex)}>
              <img src={currentImage} alt="" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" aria-hidden="true" />
              <img src={currentImage} className="relative w-full h-full object-contain" draggable="false" />

              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 text-xl">
                    ‹
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-black/30 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/50 transition-all opacity-0 group-hover:opacity-100 text-xl">
                    ›
                  </button>
                </>
              )}
            </div>

            {/* Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <Thumb key={i} src={img} isActive={i === currentIndex} onClick={() => setCurrentIndex(i)} />
              ))}
            </div>
          </div>

          {/* Info + Buy */}
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
            <button onClick={() => { onAddToCart(product.id, product.price); onClose(); }}
              className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold">
              Добавить в корзину
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
