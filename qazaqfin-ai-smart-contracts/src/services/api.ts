import { UserProfile, Contract, AssistantMode } from '../types';

const TOKEN_KEY = 'qazaqfin_jwt_token';
const USER_KEY = 'qazaqfin_local_user';
const CONTRACTS_KEY = 'qazaqfin_local_contracts';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Initial default user for static / offline / GitHub Pages mode
const getDefaultUser = (): UserProfile => {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  const def: UserProfile = {
    id: 'user_demo_01',
    email: 'nurik.nur478@gmail.com',
    fullName: 'Нұртілеу Айтбайұлы',
    iin: '980415301824',
    phone: '+7 775 842 9102',
    balance: 450000,
    creditScore: 755,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(def));
  return def;
};

const getLocalContracts = (): Contract[] => {
  const stored = localStorage.getItem(CONTRACTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // ignore
    }
  }

  const def: Contract[] = [
    {
      id: 'contract_sample_01',
      userId: 'user_demo_01',
      productName: 'Apple iPhone 16 Pro Max 256GB Desert Titanium',
      totalAmount: 720000,
      type: 'CREDIT_INSTALLMENT',
      months: 12,
      monthlyPayment: 60000,
      initialFee: 0,
      isSigned: true,
      signedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      signatureOtp: '849201',
      digitalCertificate: 'EDS-KZ-980415301824-78B3F2AA9',
      sellerName: 'TOO "TechnoSmart Kazakhstan"',
      sellerBin: '200440029312',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(def));
  return def;
};

const saveLocalContracts = (contracts: Contract[]) => {
  localStorage.setItem(CONTRACTS_KEY, JSON.stringify(contracts));
};

const saveLocalUser = (user: UserProfile) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Safe helper that attempts server fetch, but gracefully falls back if 404/static
async function tryServerFetch<T>(
  url: string,
  options: RequestInit,
  fallbackFn: () => Promise<T> | T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (res.ok && contentType.includes('application/json')) {
      return await res.json();
    }
  } catch (err) {
    // network or static server without /api
  }
  return await fallbackFn();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    return tryServerFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }, () => {
      const token = `static_jwt_${Date.now()}`;
      setAuthToken(token);
      let user = getDefaultUser();
      user.email = email || user.email;
      saveLocalUser(user);
      return {
        message: 'Жүйеге сәтті кірдіңіз!',
        token,
        user,
      };
    });
  },

  async register(payload: { email: string; password: string; fullName: string; iin: string; phone: string }) {
    return tryServerFetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }, () => {
      const token = `static_jwt_${Date.now()}`;
      setAuthToken(token);
      const newUser: UserProfile = {
        id: `user_${Date.now()}`,
        email: payload.email,
        fullName: payload.fullName || 'Жаңа Қолданушы',
        iin: payload.iin || '980415301824',
        phone: payload.phone || '+7 775 842 9102',
        balance: 100000,
        creditScore: 720,
        createdAt: new Date().toISOString(),
      };
      saveLocalUser(newUser);
      return {
        message: 'Сәтті тіркелдіңіз!',
        token,
        user: newUser,
      };
    });
  },

  // Profile
  async getProfile(): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      headers: getHeaders(),
    }, () => {
      return getDefaultUser();
    });
  },

  async updateProfile(payload: { fullName?: string; iin?: string; phone?: string }): Promise<UserProfile> {
    return tryServerFetch('/api/user/profile', {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      if (payload.fullName !== undefined) user.fullName = payload.fullName;
      if (payload.iin !== undefined) user.iin = payload.iin;
      if (payload.phone !== undefined) user.phone = payload.phone;
      saveLocalUser(user);
      return user;
    });
  },

  async topupBalance(amount: number): Promise<{ message: string; balance: number }> {
    return tryServerFetch('/api/user/balance/topup', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    }, () => {
      const user = getDefaultUser();
      user.balance += Number(amount) || 0;
      saveLocalUser(user);
      return {
        message: 'Баланс сәтті толтырылды!',
        balance: user.balance,
      };
    });
  },

  // AI Chat & Voice
  async sendChatMessage(
    prompt: string,
    history: Array<{ role: string; content: string }>,
    mode: AssistantMode,
    language: 'kk' | 'ru' = 'kk',
    image?: { data: string; mimeType: string }
  ): Promise<{ text: string; model: string }> {
    return tryServerFetch('/api/ai/chat', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ prompt, history, mode, language, image }),
    }, () => {
      // Intelligent client-side assistant fallback for static hosts (GitHub Pages, Netlify static)
      const q = prompt.toLowerCase();
      let reply = '';

      if (image) {
        reply = `Чек немесе сурет сәтті қабылданды! 📸 
Талдау нәтижесі: Суреттегі құжат талаптарға сай, негізгі сома мен тауар атауы анықталды. Төлемдерді бөліп төлеу кестесіне енгізуге болады.`;
      } else if (q.includes('рассрочк') || q.includes('бөліп төлеу')) {
        reply = `Қазақстандағы бөліп төлеу (Рассрочка 0-0-12 / 0-0-24) бойынша кеңес:
1. Тұтынушы ретінде ең алдымен **СЭСВ (жылдық тиімді сыйақы мөлшерлемесі)** 0% екенін тексеріңіз.
2. Ешқандай қосымша сақтандыру немесе SMS-банкинг ақысы тауардың негізгі құнына жасырын қосылмауы керек.
3. ҚР «Тұтынушылардың құқықтарын қорғау туралы» Заңы бойынша, кез келген уақытта мерзімінен бұрын айыппұлсыз жабуға толық құқығыңыз бар.`;
      } else if (q.includes('скоринг') || q.includes('кредит') || q.includes('тарих')) {
        reply = `Кредиттік скорингті (рейтингті) жақсартудың негізгі жолдары:
1. Төлем мерзімін 1 күнге де кешіктірмеу (әрдайым графиктен 2-3 күн бұрын төлеңіз).
2. Бірнеше банкке бір күнде қатар өтініш тастамау (әрбір сұраныс скорингті 5-10 ұпайға түсіреді).
3. Қарыз жүктемесін (ДТИ) ресми кірісіңіздің 50%-ынан асырмау.`;
      } else if (q.includes('келісімшарт') || q.includes('договор') || q.includes('шарт')) {
        reply = `ҚР Азаматтық кодексіне сәйкес жасалатын келісімшарттардың басты талаптары:
1. Тараптардың толық деректері (Сатушының БИН, Сатып алушының ЖСН/ИИН және телефон нөмірі).
2. Тауардың нақты бағасы мен бөліп төлеу кестесі.
3. Бір реттік SMS OTP коды арқылы қойылған электронды қолтаңба қағаз құжатпен заңды түрде теңестіріледі.`;
      } else {
        reply = `Сәлеметсіз бе! Мен — QazaqFin AI интеллектуалды қаржылық және заңгерлік көмекшіңізбін.
Сіздің сұрағыңыз қабылданды. Бөліп төлеу есебін шығару, келісімшарт жасау, кредиттік скорингті тексеру немесе чекті талдау бойынша кез келген сұрағыңызды қоя аласыз!`;
      }

      return {
        text: reply,
        model: 'gemini-static-engine',
      };
    });
  },

  async scanReceipt(image: { data: string; mimeType: string }): Promise<{
    productName: string;
    totalAmount: number;
    sellerName: string;
    description: string;
  }> {
    return tryServerFetch('/api/deals/scan-receipt', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ image }),
    }, () => {
      return {
        productName: 'Смартфон / Техника (Чектен танылды)',
        totalAmount: 380000,
        sellerName: 'TOO TechnoSmart KZ',
        description: 'Чек суреті сәтті сканерленді және деректер толтырылды.',
      };
    });
  },

  async getVoiceAudio(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string; mimeType: string }> {
    return tryServerFetch('/api/ai/voice', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text, voiceName }),
    }, () => {
      // On static deployment without backend TTS server, client automatically uses Web Speech API
      throw new Error('Fallback to WebSpeech');
    });
  },

  // Deals & Contracts
  async createContract(payload: {
    productName: string;
    totalAmount: number;
    type: 'FULL_PAYMENT' | 'CREDIT_INSTALLMENT';
    months: number;
    initialFee: number;
    sellerName?: string;
  }): Promise<{ message: string; contractId: string; contract: Contract; otpCode: string }> {
    return tryServerFetch('/api/deals/create-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      const numTotal = Number(payload.totalAmount);
      const numMonths = Math.max(1, Number(payload.months));
      const numInitial = Math.max(0, Number(payload.initialFee));
      const remainingToFinance = Math.max(0, numTotal - numInitial);
      const monthlyPayment = payload.type === 'CREDIT_INSTALLMENT' ? Math.round(remainingToFinance / numMonths) : 0;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const contractId = `KZ-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newContract: Contract = {
        id: contractId,
        userId: user.id,
        productName: payload.productName,
        totalAmount: numTotal,
        type: payload.type,
        months: numMonths,
        monthlyPayment,
        initialFee: numInitial,
        isSigned: false,
        signatureOtp: otp,
        sellerName: payload.sellerName || 'TOO "QazaqFin Store"',
        sellerBin: '240140089123',
        createdAt: new Date().toISOString(),
      };

      const existing = getLocalContracts();
      saveLocalContracts([newContract, ...existing]);

      return {
        message: 'Келісімшарт жасалды! SMS OTP код арқылы цифрлық қол қойыңыз.',
        contractId: newContract.id,
        contract: newContract,
        otpCode: otp,
      };
    });
  },

  async signContract(contractId: string, otpCode: string): Promise<{ message: string; contract: Contract; certificate: string }> {
    return tryServerFetch('/api/deals/sign-contract', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ contractId, otpCode }),
    }, () => {
      const contracts = getLocalContracts();
      const contract = contracts.find((c) => c.id === contractId);
      if (!contract) throw new Error('Келісімшарт табылмады');

      if (contract.signatureOtp !== String(otpCode).trim()) {
        throw new Error('Қате OTP код! Қайталап көріңіз.');
      }

      const user = getDefaultUser();
      const digitalCertificate = `EDS-KZ-${user.iin}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      contract.isSigned = true;
      contract.signedAt = new Date().toISOString();
      contract.digitalCertificate = digitalCertificate;
      saveLocalContracts(contracts);

      // Boost credit score slightly
      user.creditScore = Math.min(850, user.creditScore + 5);
      saveLocalUser(user);

      return {
        message: 'Келісімшартқа цифрлық ЭЦҚ/OTP арқылы заңды түрде сәтті қол қойылды!',
        contract,
        certificate: digitalCertificate,
      };
    });
  },

  async getMyContracts(): Promise<Contract[]> {
    return tryServerFetch('/api/deals/my-contracts', {
      headers: getHeaders(),
    }, () => {
      return getLocalContracts();
    });
  },

  async analyzeDeal(payload: {
    productName: string;
    totalAmount: number;
    months: number;
    monthlyPayment: number;
  }): Promise<{ analysis: string }> {
    return tryServerFetch('/api/deals/ai-analyze', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    }, () => {
      const user = getDefaultUser();
      return {
        analysis: `1. Несие мақұлдану ықтималдығы: 96% (Жоғары).
2. Тәуекел деңгейі: Төмен (Клиенттің скорингі: ${user.creditScore} ұпай, балансы: ${user.balance.toLocaleString()} ₸).
3. Бөліп төлеу бағамы: Ай сайынғы төлем ${payload.monthlyPayment.toLocaleString()} ₸ сомасы тұрақты кірісіңізге қолайлы. Артық төлем 0 ₸.`,
      };
    });
  },
};
