import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  CreditCard, 
  TrendingUp, 
  Plus, 
  Save, 
  Sparkles, 
  Phone, 
  Hash, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { UserProfile } from '../types';
import { api } from '../services/api';

interface ProfileTabProps {
  user: UserProfile | null;
  onUpdateProfile: (updated: UserProfile) => void;
  onRefreshUser: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  onUpdateProfile,
  onRefreshUser,
}) => {
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [iin, setIin] = useState(user?.iin || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Topup state
  const [topupAmount, setTopupAmount] = useState<number>(50000);
  const [isTopupLoading, setIsTopupLoading] = useState(false);
  const [topupSuccess, setTopupSuccess] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await api.updateProfile({ fullName, iin, phone });
      onUpdateProfile(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Сақтау қатесі');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTopup = async () => {
    if (topupAmount <= 0) return;
    setIsTopupLoading(true);
    setTopupSuccess(false);

    try {
      await api.topupBalance(topupAmount);
      onRefreshUser();
      setTopupSuccess(true);
      setTimeout(() => setTopupSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Толтыру қатесі');
    } finally {
      setIsTopupLoading(false);
    }
  };

  const score = user?.creditScore || 745;
  const scorePercent = Math.min(100, Math.max(0, ((score - 300) / (850 - 300)) * 100));

  let scoreGrade = 'Жоғары сенімділік';
  let scoreColor = 'text-emerald-400';
  let scoreBg = 'from-emerald-500 to-teal-600';
  if (score < 550) {
    scoreGrade = 'Төмен рейтинг';
    scoreColor = 'text-rose-400';
    scoreBg = 'from-rose-500 to-red-600';
  } else if (score < 680) {
    scoreGrade = 'Орташа рейтинг';
    scoreColor = 'text-amber-400';
    scoreBg = 'from-amber-500 to-orange-600';
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 text-white space-y-6">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
          Жеке кабинет және Кредиттік скоринг
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Деректеріңізді басқару, баланс толтыру және кредиттік сенімділік дәрежесі
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Credit Scoring & Balance */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Credit Score Gauge Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Кредиттік рейтинг (1CB / ПКБ)
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md text-slate-400 border border-slate-700">
                Макс: 850
              </span>
            </div>

            {/* Score Big Display */}
            <div className="text-center my-4">
              <div className="inline-block relative">
                <span className="text-5xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                  {score}
                </span>
                <span className="text-xs font-bold text-slate-400 ml-1">ұпай</span>
              </div>
              <p className={`text-sm font-bold mt-1 ${scoreColor}`}>
                {scoreGrade}
              </p>
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1 mb-4">
              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${scoreBg} transition-all duration-1000 shadow-md`}
                  style={{ width: `${scorePercent}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>300 (Төмен)</span>
                <span>650 (Орташа)</span>
                <span>850 (Мінсіз)</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-300 space-y-2">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                Банктердің мақұлдау ықтималдығы: 94%
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Сіздің тарихыңызда мерзімі өткен берешек жоқ. Бөліп төлеу мен несиелер еш кедергісіз автоматты түрде мақұлданады.
              </p>
            </div>
          </div>

          {/* Balance & Topup Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                Қолжетімді баланс
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-semibold">
                Белсенді
              </span>
            </div>

            <div className="my-2">
              <p className="text-3xl font-black text-white">
                {(user?.balance || 0).toLocaleString()} ₸
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Бөліп төлеу жарналарын өтеуге және тауар сатып алуға болады
              </p>
            </div>

            {/* Quick Topup */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Баланс толтыру (Kaspi Pay / Visa / Mastercard):
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopupAmount(amt)}
                    className={`py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                      topupAmount === amt
                        ? 'bg-blue-600/30 border-blue-500 text-cyan-300 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    +{(amt / 1000).toFixed(0)} мың ₸
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(Number(e.target.value))}
                  placeholder="Сомасы"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleTopup}
                  disabled={isTopupLoading}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isTopupLoading ? 'Толтырылуда...' : 'Толтыру'}
                </button>
              </div>

              {topupSuccess && (
                <p className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Баланс сәтті толықтырылды!
                </p>
              )}
            </div>

          </div>

        </div>

        {/* Right Column: Profile Information Form */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" />
              Жеке мәліметтер және ЭЦҚ/ИИН
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              Бұл мәліметтер заңды келісімшарттарды құру және цифрлық қол қою кезінде қолданылады
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Толық аты-жөніңіз (ФИО)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Мысалы: Ахметов Берік Қайратұлы"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* IIN (ЖСН) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  ЖСН (ИИН - 12 таңбалы)
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iin}
                    maxLength={12}
                    onChange={(e) => setIin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Мысалы: 980415301824"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Келісімшарттарға цифрлық заңды күш беру үшін талап етіледі
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Телефон нөмірі (SMS OTP растау үшін)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 775 842 9102"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email аккаунт
                </label>
                <input
                  type="email"
                  value={user?.email || 'nurik.nur478@gmail.com'}
                  disabled
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Status and Save button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Сақталуда...' : 'Мәліметтерді жаңарту'}
                </button>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Профиль мәліметтері сәтті жаңартылды!
                </div>
              )}

            </form>

            {/* Legal Security Badge */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-start gap-3 text-xs text-slate-400">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-300">ҚР Заңымен қорғалған деректер</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Жеке деректер шифрланған түрде сақталады. 133-бапқа сәйкес үшінші тұлғаларға берілмейді.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
