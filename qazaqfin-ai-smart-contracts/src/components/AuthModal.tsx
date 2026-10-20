import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, Hash, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('nurik.nur478@gmail.com');
  const [password, setPassword] = useState('123456');
  const [fullName, setFullName] = useState('Нұртілеу Айтбайұлы');
  const [iin, setIin] = useState('980415301824');
  const [phone, setPhone] = useState('+7 775 842 9102');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await api.register({
          email,
          password,
          fullName,
          iin,
          phone,
        });
        onSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onSuccess(res.user);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Қате орын алды');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.login('nurik.nur478@gmail.com', '123456');
      onSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Кіру қатесі');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isRegister ? 'Жаңа аккаунт ашу' : 'Жүйеге кіру'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Demo Login Banner */}
        <div className="mb-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-cyan-300">Жылдам демо режимі</p>
            <p className="text-[10px] text-slate-400">Нұртілеу (Баланс 450,000₸, Скоринг 755)</p>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            1-басумен кіру
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Аты-жөніңіз (ФИО)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ахметов Берік"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ЖСН (ИИН)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iin}
                    maxLength={12}
                    onChange={(e) => setIin(e.target.value)}
                    placeholder="980415301824"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Телефон
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 775 842 9102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nurik.nur478@gmail.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Құпия сөз
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 font-medium text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? 'Жүктелуде...' : isRegister ? 'Тіркелу' : 'Кіру'}
          </button>
        </form>

        {/* Toggle Register / Login */}
        <div className="text-center mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-cyan-400 hover:underline cursor-pointer"
          >
            {isRegister ? 'Аккаунтыңыз бар ма? Кіру' : 'Аккаунт жоқ па? Тіркелу'}
          </button>
        </div>

      </div>
    </div>
  );
};
