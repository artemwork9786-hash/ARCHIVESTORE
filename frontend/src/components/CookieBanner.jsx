import { useState } from 'react';

export default function CookieBanner() {
  const [accepted, setAccepted] = useState(() => localStorage.getItem('cookiesAccepted') === '1');

  if (accepted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[90] bg-black dark:bg-neutral-950 border-t border-neutral-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="font-mono text-[10px] sm:text-xs text-gray-400 dark:text-neutral-500 uppercase tracking-wider text-center sm:text-left">
          На сайте осуществляется обработка персональных данных с использованием файлов cookie.
        </p>
        <button onClick={() => { localStorage.setItem('cookiesAccepted', '1'); setAccepted(true); }}
          className="px-5 py-2 bg-white dark:bg-neutral-800 text-black dark:text-white font-mono text-[10px] uppercase tracking-wider hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors rounded-none whitespace-nowrap flex-shrink-0">
          Принять
        </button>
      </div>
    </div>
  );
}
