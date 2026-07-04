import { useEffect, useState } from 'react';

export default function Toast({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} message={t.message} type={t.type} />
      ))}
    </div>
  );
}

function ToastItem({ message, type }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const borderColor = type === 'error' ? 'border-l-2 border-l-red-500' : 'border-l-2 border-l-emerald-500';

  return (
    <div className={`bg-white dark:bg-neutral-900 text-black dark:text-white border border-white/10 ${borderColor} px-4 py-3 font-mono text-xs pointer-events-auto transition-opacity duration-300 max-w-xs`}
      style={{ opacity: visible ? 1 : 0 }}>
      {message}
    </div>
  );
}
