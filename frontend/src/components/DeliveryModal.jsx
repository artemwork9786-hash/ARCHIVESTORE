export default function DeliveryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black overflow-y-auto transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <button onClick={onClose}
          className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
          <span className="text-lg">←</span> Назад
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2 uppercase tracking-tight">Доставка</h1>
        <p className="font-mono text-[10px] sm:text-xs text-gray-400 dark:text-neutral-500 mb-8 uppercase tracking-wider">Информация о доставке заказов</p>

        <div className="space-y-10 text-gray-600 dark:text-neutral-300 leading-relaxed text-sm sm:text-base">

          <section>
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">Способы доставки</h2>
            <ul className="space-y-2 text-gray-500 dark:text-neutral-400">
              <li><span className="font-mono text-black dark:text-white font-bold">СДЭК</span> — доставка по всей России, в отделения и пункты выдачи</li>
              <li><span className="font-mono text-black dark:text-white font-bold">Почта России</span> — доставка в любой населённый пункт РФ</li>
              <li><span className="font-mono text-black dark:text-white font-bold">Курьерская доставка</span> — по Москве и Санкт-Петербургу</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">Сроки</h2>
            <p>Отправка заказов производится в течение <span className="font-mono text-black dark:text-white font-bold">48 часов</span> после подтверждения оплаты. Сроки доставки зависят от выбранного способа и региона:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-gray-500 dark:text-neutral-400">
              <li>Москва и Санкт-Петербург — 1–3 рабочих дня</li>
              <li>Центральная Россия — 3–7 рабочих дней</li>
              <li>Другие регионы — 7–14 рабочих дней</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-3 uppercase tracking-wide">Упаковка</h2>
            <p>Все вещи отправляются в фирменных зип-пакетах с архивными бирками. Каждый заказ тщательно упаковывается для сохранности товара при транспортировке.</p>
          </section>

          <section className="border-t border-gray-200 dark:border-white/10 pt-6">
            <p className="font-mono text-[10px] text-gray-400 dark:text-neutral-600 uppercase tracking-wider">По вопросам доставки обращайтесь: <span className="text-black dark:text-white">delivery@archivestore.store</span></p>
          </section>

        </div>
      </div>
    </div>
  );
}
