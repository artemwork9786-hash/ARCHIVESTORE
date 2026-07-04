import ProductCard from './ProductCard';
import LoadingOverlay from './LoadingOverlay';

export default function CatalogGrid({ products, cart, loading, onAddToCart, onChangeQuantity }) {
  return (
    <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <p className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.3em] text-gray-400 dark:text-neutral-500 mb-6 sm:mb-8">
        Каталог / New arrivals
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            index={i}
            cartItem={cart.find((c) => c.id === p.id)}
            onAddToCart={onAddToCart}
            onChangeQuantity={onChangeQuantity}
          />
        ))}
      </div>
      <LoadingOverlay show={loading} />
    </main>
  );
}
