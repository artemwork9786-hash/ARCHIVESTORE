import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Header({ user, cartCount, onOpenCart, onOpenHistory, onOpenAuth, onOpenAdmin }) {
  const isAdmin = user?.role === 'admin';
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    const nowDark = document.documentElement.classList.contains('dark');
    setIsDark(nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-black border-b border-gray-200 dark:border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <Link to="/" className="font-mono text-lg sm:text-xl font-bold tracking-tight uppercase no-underline text-inherit hover:opacity-70 transition-opacity">
          ArchiveStore
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleTheme}
            className="w-10 h-10 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors rounded-none font-mono text-xs"
            title={isDark ? 'Светлая тема' : 'Тёмная тема'}
          >
            {isDark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" /><path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" /><path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-4 py-2.5 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-wider"
            >
              Админка
            </button>
          )}
          <button
            onClick={onOpenAuth}
            className="sm:block px-4 py-2.5 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-wider"
          >
            {user ? 'Выйти' : 'Войти'}
          </button>
          <button
            onClick={onOpenHistory}
            className="sm:block px-4 py-2.5 border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-mono text-xs uppercase tracking-wider"
          >
            Заказы
          </button>
          <button
            onClick={onOpenCart}
            className="px-4 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider"
          >
            Корзина ({cartCount})
          </button>
        </div>
      </div>
    </header>
  );
}
