export default function Footer({ onOpenPrivacy, onOpenDelivery }) {
  return (
    <footer className="border-t border-gray-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8 sm:gap-12 mb-10">
          <div className="shrink-0">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">ArchiveStore</h3>
            <p className="text-sm text-gray-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              Селективный архивный стритвир, авангардный дизайн и субкультурная эстетика.
            </p>
          </div>
          <div className="flex gap-10 sm:gap-14">
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">Навигация</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-neutral-400">
                <li><a href="#catalog" className="hover:text-black dark:hover:text-white transition-colors">Каталог</a></li>
                <li><button onClick={onOpenDelivery} className="hover:text-black dark:hover:text-white transition-colors text-left">Доставка</button></li>
                <li><a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="hover:text-black dark:hover:text-white transition-colors">Наш Telegram</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4">Правовая информация</h3>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-neutral-400">
                <li>
                  <button onClick={onOpenPrivacy} className="hover:text-black dark:hover:text-white transition-colors text-left">
                    Политика конфиденциальности
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 dark:border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-mono text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
            &copy; {new Date().getFullYear()} ArchiveStore. Все права защищены.
          </p>
          <p className="font-mono text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
            DESIGNED IN DUST
          </p>
        </div>
      </div>
    </footer>
  );
}
