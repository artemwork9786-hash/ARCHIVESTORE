import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../utils';
import { imgUrl } from '../config';

export default function ProductCard({ product, cartItem, index, onAddToCart, onChangeQuantity }) {
  const [loaded, setLoaded] = useState(false);
  const navigate = useNavigate();
  const delay = (index || 0) * 80;

  const goToProduct = () => navigate(`/product/${product.id}`);

  return (
    <div
      className="cursor-pointer group"
      style={{
        opacity: loaded ? 1 : 0,
        filter: loaded ? 'blur(0px)' : 'blur(1.5px)',
        transition: `opacity 500ms ease-out ${delay}ms, filter 500ms ease-out ${delay}ms`,
      }}
      onClick={goToProduct}
    >
      <div className="aspect-[3/4] bg-gray-100 dark:bg-white/5 overflow-hidden relative">
        <img src={imgUrl(product.preview)} alt=""
          className="absolute inset-0 w-full h-full object-cover blur-xl scale-110" aria-hidden="true" />
        <img src={imgUrl(product.preview)} alt={product.name || ''}
          className="relative w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          onLoad={() => setLoaded(true)} />
      </div>
      <div className="pt-3 sm:pt-4">
        <p className="font-mono text-[10px] sm:text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
          {(product.specs && product.specs['Артикул']) || ''}
        </p>
        <h3 className="text-sm sm:text-base font-bold mt-1 uppercase tracking-wide">
          {product.name || ''}
        </h3>
        <div className="flex items-center justify-between mt-2 sm:mt-3">
          <span className="font-mono text-sm sm:text-base font-bold">
            {formatPrice(product.price)}
          </span>
          <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
            {cartItem ? (
              <div className="flex items-center rounded-none overflow-hidden border border-gray-300 dark:border-white/20">
                <button onClick={() => onChangeQuantity(product.id, -1)}
                  className="px-2.5 sm:px-3 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">−</button>
                <span className="w-6 sm:w-8 text-center font-mono text-xs sm:text-sm font-bold">{cartItem.quantity}</span>
                <button onClick={() => onChangeQuantity(product.id, 1)}
                  className="px-2.5 sm:px-3 py-2 text-sm font-bold hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">+</button>
              </div>
            ) : (
              <button onClick={() => onAddToCart(product.id, product.price)}
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors px-4 py-2 font-mono text-[10px] sm:text-xs uppercase tracking-wider whitespace-nowrap rounded-none">
                В корзину
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
