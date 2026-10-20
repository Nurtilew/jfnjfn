import React, { useState, useRef } from 'react';
import { 
  Calculator, 
  Sparkles, 
  FileCheck, 
  ShieldAlert, 
  CheckCircle2, 
  CreditCard, 
  Clock, 
  Building2, 
  Smartphone, 
  Laptop, 
  Car, 
  ArrowRight,
  KeyRound,
  Download,
  Camera,
  Image as ImageIcon,
  ScanLine,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, Contract } from '../types';
import { api } from '../services/api';
import { generateContractPDF } from '../utils/pdfGenerator';
import { CameraModal } from './CameraModal';

interface DealsTabProps {
  user: UserProfile | null;
  onContractCreated: (contract: Contract) => void;
  onOpenAuthModal: () => void;
}

export const DealsTab: React.FC<DealsTabProps> = ({
  user,
  onContractCreated,
  onOpenAuthModal,
}) => {
  const [productName, setProductName] = useState('Apple iPhone 16 Pro 256GB');
  const [totalAmount, setTotalAmount] = useState<number>(680000);
  const [paymentType, setPaymentType] = useState<'CREDIT_INSTALLMENT' | 'FULL_PAYMENT'>('CREDIT_INSTALLMENT');
  const [months, setMonths] = useState<number>(12);
  const [initialFee, setInitialFee] = useState<number>(0);
  const [sellerName, setSellerName] = useState('TOO "QazaqFin Store"');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Scanner state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const receiptFileInputRef = useRef<HTMLInputElement | null>(null);

  // Signing modal state
  const [activeCreatedContract, setActiveCreatedContract] = useState<Contract | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'error'>('idle');
  const [signMessage, setSignMessage] = useState('');

  // Calculations
  const financedAmount = Math.max(0, totalAmount - initialFee);
  const monthlyPayment =
    paymentType === 'CREDIT_INSTALLMENT' ? Math.round(financedAmount / months) : financedAmount;
  const overpayment = 0; // 0-0-12/24 promo installment

  const handleScanImage = async (dataUrl: string, mimeType = 'image/jpeg') => {
    setIsScanning(true);
    setScanMessage(null);
    try {
      const res = await api.scanReceipt({ data: dataUrl, mimeType });
      if (res.productName) setProductName(res.productName);
      if (res.totalAmount && res.totalAmount > 0) setTotalAmount(res.totalAmount);
      if (res.sellerName) setSellerName(res.sellerName);

      setScanMessage(`Табылды: ${res.productName} (${res.totalAmount.toLocaleString()} ₸)`);
      setTimeout(() => setScanMessage(null), 5000);
    } catch (e: any) {
      alert('Чекті тану сәтсіз аяқталды. Қайталап көріңіз.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGalleryReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleScanImage(dataUrl, file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handlePresetProduct = (name: string, price: number) => {
    setProductName(name);
    setTotalAmount(price);
  };

  const handleAiAnalysis = async () => {
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const res = await api.analyzeDeal({
        productName,
        totalAmount,
        months,
        monthlyPayment,
      });
      setAiAnalysis(res.analysis);
    } catch (e: any) {
      setAiAnalysis('AI сараптаманы жасау кезінде қате орын алды. Қайталап көріңіз.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateContract = async () => {
    if (!user) {
      onOpenAuthModal();
      return;
    }

    if (!user.iin) {
      alert('Келісімшарт жасау үшін алдымен жеке кабинеттен ЖСН (ИИН) енгізіңіз!');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createContract({
        productName,
        totalAmount,
        type: paymentType,
        months,
        initialFee,
      });

      setActiveCreatedContract(res.contract);
      setOtpInput(res.otpCode); // Pre-fill with returned SMS OTP for instant convenience
      onContractCreated(res.contract);
    } catch (err: any) {
      alert(err.message || 'Келісімшарт жасау мүмкін болмады');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignContract = async () => {
    if (!activeCreatedContract || !otpInput) return;

    setSignStatus('signing');
    try {
      const res = await api.signContract(activeCreatedContract.id, otpInput);
      setSignStatus('success');
      setSignMessage(res.message);
      setActiveCreatedContract(res.contract);
      onContractCreated(res.contract);

      // Trigger Confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err: any) {
      setSignStatus('error');
      setSignMessage(err.message || 'OTP код қате');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-white">
      
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
          Бөліп төлеу & Заңды электронды келісімшарт
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Тауарды 0-0-12 немесе 0-0-24 шарттарымен есептеп, Қазақстан заңнамасына сай заңды келісімшарт жасаңыз
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Product & Term Selection */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* AI Photo Scanner Banner (Камера & Галерея) */}
          <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shrink-0">
                  <ScanLine className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Чек немесе бағаны (ценник) фотомен енгізу</span>
                    <span className="px-1.5 py-0.2 bg-cyan-500/20 text-cyan-300 text-[9px] font-bold rounded">AI Vision</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Камерамен түсіріңіз немесе галереядан таңдаңыз — сомасы мен тауар аты автоматты толтырылады
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                  title="Камерамен түсіру"
                >
                  <Camera className="w-4 h-4" />
                  <span>Камера</span>
                </button>

                <button
                  type="button"
                  onClick={() => receiptFileInputRef.current?.click()}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  title="Галереядан фото таңдау"
                >
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Галерея</span>
                </button>

                <input
                  ref={receiptFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGalleryReceipt}
                  className="hidden"
                />
              </div>
            </div>

            {/* Scanning Status */}
            {isScanning && (
              <div className="mt-3 pt-3 border-t border-cyan-500/20 flex items-center gap-2 text-xs text-cyan-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini Vision чекті немесе тауар суретін талдауда...</span>
              </div>
            )}

            {scanMessage && (
              <div className="mt-3 pt-3 border-t border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>{scanMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Presets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <label className="text-xs font-semibold text-slate-300 mb-2 block">
              Немесе дайын тауар үлгісін таңдаңыз:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Apple iPhone 16 Pro', price: 680000, icon: Smartphone },
                { name: 'MacBook Air M3', price: 790000, icon: Laptop },
                { name: 'Samsung 65" QLED TV', price: 420000, icon: Building2 },
                { name: 'Автобөлшектер жинағы', price: 250000, icon: Car },
              ].map((item, idx) => {
                const Icon = item.icon;
                const isSelected = productName === item.name;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetProduct(item.name, item.price)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1 text-cyan-400" />
                    <span className="text-[11px] font-semibold truncate w-full">{item.name}</span>
                    <span className="text-[10px] text-slate-500">{item.price.toLocaleString()} ₸</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            
            {/* Product Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Тауар немесе қызмет атауы
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Мысалы: Ноутбук Asus ROG Strix"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            {/* Total Amount */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Жалпы сомасы (₸ KZT)
                </label>
                <span className="text-xs font-bold text-cyan-400">
                  {totalAmount.toLocaleString()} ₸
                </span>
              </div>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(Math.max(1000, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 mb-2"
              />
              <div className="flex gap-2">
                {[150000, 350000, 500000, 750000, 1000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTotalAmount(amt)}
                    className="flex-1 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] font-medium text-slate-300 transition-colors"
                  >
                    {(amt / 1000).toFixed(0)} мың ₸
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Type */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Төлем түрі
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentType('CREDIT_INSTALLMENT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentType === 'CREDIT_INSTALLMENT'
                      ? 'bg-blue-600/20 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-cyan-300">Бөліп төлеу (Рассрочка)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">0% артық төлемсіз, ай сайын</p>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentType('FULL_PAYMENT')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    paymentType === 'FULL_PAYMENT'
                      ? 'bg-blue-600/20 border-cyan-500 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs font-bold text-slate-200">Толық төлем (100%)</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Бір ретте толық өтеу</p>
                </button>
              </div>
            </div>

            {/* Months Selector (if installment) */}
            {paymentType === 'CREDIT_INSTALLMENT' && (
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Бөліп төлеу мерзімі:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[3, 6, 12, 24].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMonths(m)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        months === m
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-600 border-cyan-400 text-white shadow-md shadow-blue-500/20'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {m} ай
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Initial Down payment */}
            {paymentType === 'CREDIT_INSTALLMENT' && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    Бастапқы жарна (Down Payment)
                  </label>
                  <span className="text-xs font-bold text-slate-300">
                    {initialFee.toLocaleString()} ₸
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 0.1, 0.2, 0.3].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setInitialFee(Math.round(totalAmount * pct))}
                      className={`py-1.5 rounded-lg border text-xs transition-colors ${
                        initialFee === Math.round(totalAmount * pct)
                          ? 'bg-slate-800 border-cyan-500 text-cyan-300 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {pct * 100}% жарна
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Summary Card & AI Feasibility */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Summary Card */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-cyan-400" />
              Төлем есебінің қорытындысы
            </h3>

            {/* Big monthly payment display */}
            <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 mb-5 text-center">
              <p className="text-xs text-slate-400">
                {paymentType === 'CREDIT_INSTALLMENT' ? 'Ай сайынғы төлем:' : 'Біржолғы төлем:'}
              </p>
              <p className="text-3xl font-black text-white mt-1 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {monthlyPayment.toLocaleString()} ₸
                {paymentType === 'CREDIT_INSTALLMENT' && <span className="text-sm font-normal text-slate-400"> / ай</span>}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Артық төлем: 0 ₸ (0-0-{months} акциясы)
              </div>
            </div>

            {/* Breakdown table */}
            <div className="space-y-2 text-xs border-b border-slate-800 pb-4 mb-4">
              <div className="flex justify-between text-slate-400">
                <span>Тауар бағасы:</span>
                <span className="font-semibold text-slate-200">{totalAmount.toLocaleString()} ₸</span>
              </div>
              {initialFee > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Бастапқы жарна:</span>
                  <span className="font-semibold text-slate-200">{initialFee.toLocaleString()} ₸</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Қаржыландыру сомасы:</span>
                <span className="font-semibold text-slate-200">{financedAmount.toLocaleString()} ₸</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Мерзімі:</span>
                <span className="font-semibold text-slate-200">
                  {paymentType === 'CREDIT_INSTALLMENT' ? `${months} айға бөлінген` : '1 ай'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Жылдық тиімді мөлшерлеме (СЭСВ):</span>
                <span className="font-bold text-emerald-400">0.0%</span>
              </div>
            </div>

            {/* User Check Indicator */}
            <div className="flex items-center justify-between text-xs mb-5 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400">Сіздің кредиттік скорингіңіз:</span>
              <span className="font-bold text-cyan-400 flex items-center gap-1">
                {user?.creditScore || 745} ұпай (Жоғары)
              </span>
            </div>

            {/* Action buttons */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleCreateContract}
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <FileCheck className="w-4 h-4" />
                {isSubmitting ? 'Келісімшарт дайындалуда...' : 'Келісімшарт жасау & SMS OTP қол қою'}
              </button>

              <button
                type="button"
                onClick={handleAiAnalysis}
                disabled={isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700/80 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {isAnalyzing ? 'Gemini 3.8 талдауда...' : 'Gemini AI Сараптама (Мақұлдану ықтималдығы)'}
              </button>
            </div>

          </div>

          {/* AI Analysis Result Card */}
          {aiAnalysis && (
            <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed shadow-lg">
              <div className="flex items-center gap-2 text-cyan-400 font-bold mb-2">
                <Sparkles className="w-4 h-4 animate-spin" />
                Gemini AI Сараптамасы:
              </div>
              <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
          )}

        </div>

      </div>

      {/* SMS OTP Digital Signature Modal */}
      {activeCreatedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Электронды цифрлық қол қою (SMS OTP)
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Келісімшарт No: <span className="font-mono text-cyan-300">{activeCreatedContract.id}</span>
              </p>
            </div>

            {/* Deal preview in modal */}
            <div className="bg-slate-950 rounded-2xl p-4 text-xs space-y-2 mb-5 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Тауар:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{activeCreatedContract.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Жалпы құны:</span>
                <span className="font-bold text-cyan-400">{activeCreatedContract.totalAmount.toLocaleString()} ₸</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Ай сайынғы төлем:</span>
                <span className="font-bold text-white">{activeCreatedContract.monthlyPayment.toLocaleString()} ₸ / ай</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Сатып алушы:</span>
                <span className="text-slate-200">{user?.fullName} (ЖСН: {user?.iin})</span>
              </div>
            </div>

            {/* OTP Section */}
            {signStatus !== 'success' ? (
              <div className="space-y-4">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-cyan-300">
                    Сіздің телефоныңызға ({user?.phone || '+7 775 842 9102'}) 6 таңбалы растау коды жіберілді:
                  </p>
                  <p className="text-xl font-mono font-black text-cyan-400 tracking-widest mt-1">
                    {activeCreatedContract.signatureOtp}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    OTP растау кодын енгізіңіз:
                  </label>
                  <input
                    type="text"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    maxLength={6}
                    placeholder="Мысалы: 123456"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-cyan-400 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {signStatus === 'error' && (
                  <p className="text-xs text-rose-400 text-center font-medium">
                    {signMessage}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCreatedContract(null)}
                    className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Кейін қол қою
                  </button>
                  <button
                    type="button"
                    onClick={handleSignContract}
                    disabled={otpInput.length < 6 || signStatus === 'signing'}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {signStatus === 'signing' ? 'Қол қойылуда...' : 'Қол қою (ЭЦҚ)'}
                  </button>
                </div>
              </div>
            ) : (
              /* Success Signed Stamp */
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">
                    Келісімшартқа сәтті қол қойылды!
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono mt-1">
                    Серт.: {activeCreatedContract.digitalCertificate}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Қазақстан Республикасы заңнамасына сәйкес келісімшарт толық заңды күшіне енді.
                  </p>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => generateContractPDF(activeCreatedContract, user)}
                    className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    PDF Жүктеп алу
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCreatedContract(null)}
                    className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    Жабу
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Live Camera Modal for Scanning Receipt / Product */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleScanImage}
      />

    </div>
  );
};
