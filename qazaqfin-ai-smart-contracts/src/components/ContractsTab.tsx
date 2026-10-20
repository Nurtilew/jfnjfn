import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  Download, 
  KeyRound, 
  ShieldCheck, 
  Plus, 
  Search, 
  Eye, 
  X,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Contract, UserProfile } from '../types';
import { api } from '../services/api';
import { generateContractPDF } from '../utils/pdfGenerator';

interface ContractsTabProps {
  contracts: Contract[];
  user: UserProfile | null;
  onRefreshContracts: () => void;
  onNavigateToDeals: () => void;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({
  contracts,
  user,
  onRefreshContracts,
  onNavigateToDeals,
}) => {
  const [filter, setFilter] = useState<'all' | 'signed' | 'pending'>('all');
  const [search, setSearch] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Signing state in modal
  const [otpInput, setOtpInput] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');

  const filteredContracts = contracts.filter((c) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'signed'
        ? c.isSigned
        : !c.isSigned;
    const matchesSearch =
      c.productName.toLowerCase().includes(search.toLowerCase()) ||
      c.id.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleOpenSign = (contract: Contract) => {
    setSelectedContract(contract);
    setOtpInput(contract.signatureOtp);
    setSignError('');
  };

  const handleSign = async () => {
    if (!selectedContract || !otpInput) return;
    setSignLoading(true);
    setSignError('');

    try {
      await api.signContract(selectedContract.id, otpInput);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      onRefreshContracts();
      setSelectedContract((prev) => (prev ? { ...prev, isSigned: true, signedAt: new Date().toISOString() } : null));
    } catch (e: any) {
      setSignError(e.message || 'OTP қате енгізілді');
    } finally {
      setSignLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 text-white">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
            Менің келісімшарттарым
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Электронды цифрлық қол қойылған заңды шарттар реестрі
          </p>
        </div>

        <button
          onClick={onNavigateToDeals}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Жаңа келісімшарт жасау
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
        
        {/* Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Барлығы ({contracts.length})
          </button>
          <button
            onClick={() => setFilter('signed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'signed'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Қол қойылған ({contracts.filter((c) => c.isSigned).length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === 'pending'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Қол қою күтілуде ({contracts.filter((c) => !c.isSigned).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Тауар немесе ID бойынша іздеу..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Contracts List Grid */}
      {filteredContracts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            Келісімшарттар табылмады
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5">
            Сізде әлі таңдалған фильтр бойынша келісімшарт жоқ немесе жаңа келісімшарт құрылмаған.
          </p>
          <button
            onClick={onNavigateToDeals}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Бөліп төлеу келісімшартын жасау
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContracts.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status Badge */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono text-slate-400">
                    {c.id}
                  </span>
                  {c.isSigned ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      Қол қойылған
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-semibold">
                      <Clock className="w-3 h-3" />
                      Қол қою күтілуде
                    </span>
                  )}
                </div>

                {/* Product & Price */}
                <h4 className="text-sm font-bold text-white line-clamp-2 mb-2">
                  {c.productName}
                </h4>

                <div className="bg-slate-950 rounded-xl p-3 text-xs space-y-1.5 mb-4 border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Жалпы сома:</span>
                    <span className="font-bold text-cyan-400">{c.totalAmount.toLocaleString()} ₸</span>
                  </div>
                  {c.type === 'CREDIT_INSTALLMENT' ? (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Ай сайын:</span>
                      <span className="font-semibold text-slate-200">
                        {c.monthlyPayment.toLocaleString()} ₸ ({c.months} ай)
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Төлем:</span>
                      <span className="font-semibold text-slate-200">Толық 100%</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Күні:</span>
                    <span className="text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString('kk-KZ')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleOpenSign(c)}
                  className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Қарау
                </button>

                <button
                  onClick={() => generateContractPDF(c, user)}
                  className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold transition-colors cursor-pointer"
                  title="PDF жүктеп алу"
                >
                  <Download className="w-4 h-4" />
                </button>

                {!c.isSigned && (
                  <button
                    onClick={() => handleOpenSign(c)}
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    Қол қою
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Contract Detail & Signature View Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">
                  Электронды келісімшарт No {selectedContract.id}
                </h3>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contract Body */}
            <div className="space-y-4 text-xs text-slate-300">
              
              {/* Status Box */}
              <div className={`p-4 rounded-2xl border ${
                selectedContract.isSigned
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-center justify-between font-bold text-sm mb-1">
                  <span>Статус:</span>
                  <span>{selectedContract.isSigned ? 'ҚОЛ ҚОЙЫЛҒАН (ЗАҢДЫ КҮШІ БАР)' : 'ҚОЛ ҚОЮ КҮТІЛУДЕ'}</span>
                </div>
                {selectedContract.isSigned && (
                  <div className="text-[11px] space-y-0.5 mt-2 opacity-90 font-mono">
                    <p>ЭЦҚ Сертификаты: {selectedContract.digitalCertificate}</p>
                    <p>Қол қойылған уақыты: {new Date(selectedContract.signedAt || '').toLocaleString('kk-KZ')}</p>
                    <p>SMS OTP растамасы: {selectedContract.signatureOtp}</p>
                  </div>
                )}
              </div>

              {/* Parties info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Сатушы:</p>
                  <p className="font-semibold text-white">{selectedContract.sellerName}</p>
                  <p className="text-slate-400 text-[11px]">БИН: {selectedContract.sellerBin}</p>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <p className="font-bold text-slate-400 uppercase text-[10px] mb-1">Сатып алушы:</p>
                  <p className="font-semibold text-white">{user?.fullName || 'Қолданушы'}</p>
                  <p className="text-slate-400 text-[11px]">ЖСН: {user?.iin || 'Көрсетілмеген'}</p>
                  <p className="text-slate-400 text-[11px]">Тел: {user?.phone || 'Көрсетілмеген'}</p>
                </div>
              </div>

              {/* Product and Payment terms */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <p className="font-bold text-white text-sm">{selectedContract.productName}</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800/80">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Жалпы бағасы:</span>
                    <span className="font-bold text-cyan-400 text-sm">{selectedContract.totalAmount.toLocaleString()} ₸</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Төлем түрі:</span>
                    <span className="font-semibold text-white">
                      {selectedContract.type === 'CREDIT_INSTALLMENT' ? 'Бөліп төлеу' : 'Толық төлем'}
                    </span>
                  </div>
                  {selectedContract.type === 'CREDIT_INSTALLMENT' && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">Ай сайын:</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {selectedContract.monthlyPayment.toLocaleString()} ₸ / {selectedContract.months} ай
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Legal terms snippet */}
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                <p className="font-semibold text-slate-300 mb-1">Заңды тармақтар:</p>
                <p>1. Осы шарт ҚР Азаматтық кодексінің 458-бабына сәйкес жасалған электронды құжат болып табылады.</p>
                <p>2. Сатып алушының SMS OTP коды арқылы қойылған қолы қағаз жүзіндегі жеке қолымен теңестіріледі.</p>
              </div>

              {/* If not signed yet, show OTP verification box */}
              {!selectedContract.isSigned && (
                <div className="bg-slate-800/80 border border-cyan-500/30 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <KeyRound className="w-4 h-4" />
                    SMS OTP арқылы цифрлық қол қою
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Растау коды: <span className="font-mono font-bold text-cyan-300">{selectedContract.signatureOtp}</span>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="6 таңбалы код"
                      maxLength={6}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-center font-mono font-bold text-cyan-400 tracking-wider text-sm flex-1 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      onClick={handleSign}
                      disabled={signLoading || otpInput.length < 6}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      {signLoading ? 'Тексерілуде...' : 'Қол қою'}
                    </button>
                  </div>
                  {signError && <p className="text-xs text-rose-400">{signError}</p>}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800 mt-5">
              <button
                onClick={() => generateContractPDF(selectedContract, user)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Ресми PDF Жүктеп алу
              </button>

              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Жабу
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
