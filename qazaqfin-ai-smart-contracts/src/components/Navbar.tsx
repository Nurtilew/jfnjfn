import React from 'react';
import { 
  Bot, 
  FileText, 
  Calculator, 
  User, 
  Mic, 
  Sparkles, 
  CreditCard,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  activeTab: 'chat' | 'deals' | 'contracts' | 'profile';
  setActiveTab: (tab: 'chat' | 'deals' | 'contracts' | 'profile') => void;
  user: UserProfile | null;
  onOpenVoiceModal: () => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  contractsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenVoiceModal,
  onOpenAuthModal,
  onLogout,
  contractsCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  QazaqFin AI
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-md">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Ақылды қаржылық кеңесші & Келісімшарттар
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Чат & Кеңес
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'deals'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              Бөліп төлеу & Калькулятор
            </button>

            <button
              onClick={() => setActiveTab('contracts')}
              className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'contracts'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Келісімшарттар
              {contractsCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] flex items-center justify-center font-bold">
                  {contractsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'profile'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Скоринг & Кабинет
            </button>
          </nav>

          {/* Right Action buttons: Live Voice + Profile Badge */}
          <div className="flex items-center gap-2.5">
            {/* Live Voice mode trigger */}
            <button
              onClick={onOpenVoiceModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-transform active:scale-95 cursor-pointer"
              title="Дауыстық режим (Gemini / ChatGPT Voice)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-4 h-4" />
              <span className="hidden sm:inline">Дауыстық AI</span>
            </button>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2.5 bg-slate-800/80 hover:bg-slate-800 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700/60 transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'Н'}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                      {user.fullName || 'Қолданушы'}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-medium">
                      {user.balance.toLocaleString()} ₸
                    </p>
                  </div>
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  title="Шығу"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <User className="w-4 h-4" />
                Кіру
              </button>
            )}
          </div>

        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/60">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'chat' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Чат</span>
          </button>
          <button
            onClick={() => setActiveTab('deals')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'deals' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Бөліп төлеу</span>
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] relative ${
              activeTab === 'contracts' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Шарттар</span>
            {contractsCount > 0 && (
              <span className="absolute -top-1 right-2 w-3.5 h-3.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                {contractsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 text-[11px] ${
              activeTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-400'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Кабинет</span>
          </button>
        </div>
      </div>
    </header>
  );
};
