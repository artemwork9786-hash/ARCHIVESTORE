import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose, onNotify }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullname, setFullname] = useState('');
  const [phone, setPhone] = useState('');
  const [telegram, setTelegram] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setEmail('');
    setPassword('');
    setFullname('');
    setPhone('');
    setTelegram('');
  };

  const switchMode = (m) => {
    reset();
    setMode(m);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
        onNotify('Добро пожаловать!', 'success');
      } else {
        await register({ email, password, fullname, phone, telegram });
        onNotify('Аккаунт создан!', 'success');
      }
      reset();
      onClose();
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-none focus:outline-none focus:border-black dark:focus:border-white transition-colors placeholder-gray-300 dark:placeholder-neutral-600 font-mono text-sm";
  const labelClass = "font-mono text-[10px] uppercase tracking-wider text-gray-400 dark:text-neutral-500 mb-1 block";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white dark:bg-black w-full sm:max-w-sm sm:mx-4 border-t sm:border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-sm font-bold uppercase tracking-wider">
            {mode === 'login' ? 'Вход' : 'Регистрация'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-lg">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Email</label>
            <input type="email" required placeholder="mail@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Пароль</label>
            <input type="password" required minLength={6} placeholder="Минимум 6 символов" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className={labelClass}>ФИО</label>
                <input type="text" placeholder="Иванов Иван Иванович" value={fullname} onChange={(e) => setFullname(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Телефон</label>
                <input type="tel" placeholder="+7 (999) 123-45-67" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Telegram</label>
                <input type="text" placeholder="@username" value={telegram} onChange={(e) => setTelegram(e.target.value)} className={inputClass} />
              </div>
            </>
          )}

          <button type="submit" disabled={submitting}
            className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors font-mono text-xs uppercase tracking-wider rounded-none font-bold disabled:opacity-50">
            {submitting ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <button onClick={() => switchMode('register')} className="font-mono text-[11px] text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
              Нет аккаунта? Зарегистрироваться
            </button>
          ) : (
            <button onClick={() => switchMode('login')} className="font-mono text-[11px] text-gray-400 dark:text-neutral-500 hover:text-black dark:hover:text-white transition-colors">
              Уже есть аккаунт? Войти
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
