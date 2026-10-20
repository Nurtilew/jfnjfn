import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Copy, 
  Check, 
  Bot, 
  User as UserIcon, 
  Trash2, 
  Scale, 
  Coins, 
  TrendingUp, 
  Camera, 
  Image as ImageIcon, 
  X,
  FileCheck
} from 'lucide-react';
import { ChatMessage, AssistantMode } from '../types';
import { api } from '../services/api';
import { CameraModal } from './CameraModal';

interface ChatTabProps {
  language: 'kk' | 'ru';
  setLanguage: (lang: 'kk' | 'ru') => void;
  onOpenVoiceModal: () => void;
}

export const ChatTab: React.FC<ChatTabProps> = ({ language, setLanguage, onOpenVoiceModal }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome_1',
        role: 'assistant',
        content: `Сәлеметсіз бе! Мен — **QazaqFin AI** интеллектуалды қаржылық, заңгерлік және визуалды көмекшіңізбін (Gemini 3.5 негізінде).

Маған келесідей сұрақтар мен тапсырмалар бере аласыз:
- **Фото талдау (Камера & Галерея)**: Чекті, келісімшартты немесе тауардың ценнигін суретке түсіріп жіберіңіз — AI бағасын, қауіпті тұстарын және мазмұнын бірден талдап береді!
- **Бөліп төлеу (Рассрочка) және Кредит**: Ай сайынғы төлемді, артық төлемсіз шарттарды есептеу
- **Заңды келісімшарттар**: Сатып алу-сату, жалға беру, қызмет көрсету шарттарын тексеру
- **Кредиттік скоринг**: Скоринг ұпайын (300-850) көтеру құпиялары

Төмендегі **Камера** 📷 немесе **Галерея** 🖼️ батырмаларын басып, фото жіберіңіз немесе дауыспен сұраңыз!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<AssistantMode>('finance');
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);

  // Attached Image state
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, attachedImage]);

  // Setup Speech-to-Text for the prompt input bar
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${text}` : text));
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleMic = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.warn('Speech recognition start failed', e);
      }
    }
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setAttachedImage({
          data: dataUrl,
          mimeType: file.type || 'image/jpeg',
        });
      }
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = '';
  };

  const handleCameraCapture = (dataUrl: string) => {
    setAttachedImage({
      data: dataUrl,
      mimeType: 'image/jpeg',
    });
  };

  const handleSend = async (customPrompt?: string) => {
    const query = (customPrompt || input).trim();
    if ((!query && !attachedImage) || isLoading) return;

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
      setPlayingMessageId(null);
    }

    const currentImage = attachedImage;
    const finalPrompt = query || (currentImage ? 'Бұл суретті (чек, келісімшарт немесе тауарды) толық талдап беріңіз.' : '');

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: finalPrompt,
      imageUrl: currentImage?.data,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    try {
      // Exclude initial welcome model turn if present to maintain proper multi-turn order
      const historyPayload = messages
        .filter((m, idx) => !(idx === 0 && m.role === 'assistant'))
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await api.sendChatMessage(
        finalPrompt,
        historyPayload,
        mode,
        language,
        currentImage || undefined
      );

      const aiMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `msg_err_${Date.now()}`,
        role: 'assistant',
        content: `Жүйе жауабы: ${err?.message || 'Сұрағыңыз қабылданды'}. Қосымша сұрағыңызды қойыңыз!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = async (msg: ChatMessage) => {
    if (playingMessageId === msg.id) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setPlayingMessageId(null);
      return;
    }

    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPlayingMessageId(msg.id);

    try {
      const data = await api.getVoiceAudio(msg.content, 'Kore');
      if (data?.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        currentAudioRef.current = audio;

        audio.onended = () => {
          setPlayingMessageId(null);
        };
        audio.onerror = () => {
          fallbackSpeech(msg.content);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      // fallback
    }

    fallbackSpeech(msg.content);
  };

  const fallbackSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setPlayingMessageId(null);
      return;
    }
    const clean = text.replace(/[*#_`]/g, '').slice(0, 450);
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';
    utterance.rate = 1.05;

    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (confirm('Чат тарихын тазартуды қалайсыз ба?')) {
      setMessages([
        {
          id: `welcome_${Date.now()}`,
          role: 'assistant',
          content: 'Чат тазартылды. Жаңа сұрағыңызды қойыңыз немесе фото жіберіңіз!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const quickPrompts = [
    {
      label: 'Чекті фотомен тексеру',
      prompt: 'Маған мына чектегі немесе келісімшарттағы сома мен тауарларды талдап, артық төлемдер бар-жоғын тексеріп берші.',
      icon: FileCheck,
    },
    {
      label: 'Бөліп төлеу есебі',
      prompt: 'Маған 500,000 теңге тұратын телефонды 12 айға бөліп төлеу графигі мен ай сайынғы төлемін есептеп бер.',
      icon: Coins,
    },
    {
      label: 'Келісімшартты тексеру',
      prompt: 'Сатып алу-сату шартында қандай жасырын комиссиялар немесе қауіпті пункттер болуы мүмкін?',
      icon: Scale,
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-5xl mx-auto w-full px-2 sm:px-4">
      
      {/* Top Bar: Mode Selector & Tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-slate-800 bg-slate-900/40 px-3 rounded-2xl mb-3 backdrop-blur-sm">
        
        {/* Modes */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          <button
            onClick={() => setMode('finance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'finance'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Қаржы кеңесшісі
          </button>

          <button
            onClick={() => setMode('legal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'legal'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            Заңгер & Келісімшарт
          </button>

          <button
            onClick={() => setMode('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              mode === 'general'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Vision & Чат
          </button>
        </div>

        {/* Right tools: Language & Voice trigger */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800/80 rounded-xl p-0.5 border border-slate-700/60 text-xs">
            <button
              onClick={() => setLanguage('kk')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                language === 'kk' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              ҚАЗ
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                language === 'ru' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              РУС
            </button>
          </div>

          <button
            onClick={onOpenVoiceModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 text-xs font-semibold transition-all"
            title="Толық экранды дауыстық режим"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden sm:inline">Live дауыс</span>
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            title="Чатты тазарту"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 sm:pr-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isPlaying = playingMessageId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white shadow-blue-600/30'
                    : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white shadow-cyan-500/30'
                }`}
              >
                {isUser ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-md ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {/* Uploaded Image Preview if user message had image */}
                {msg.imageUrl && (
                  <div className="mb-2.5 rounded-xl overflow-hidden border border-white/20 max-w-xs shadow-md">
                    <img
                      src={msg.imageUrl}
                      alt="Uploaded"
                      className="w-full max-h-56 object-cover hover:scale-105 transition-transform cursor-pointer"
                      onClick={() => window.open(msg.imageUrl, '_blank')}
                    />
                  </div>
                )}

                {/* Text Content */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* Bubble Footer: Timestamp & Audio controls for Assistant */}
                <div className="flex items-center justify-between gap-3 mt-2 pt-1 border-t border-white/10 text-[11px] text-slate-400">
                  <span>{msg.timestamp}</span>

                  {!isUser && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSpeakMessage(msg)}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] transition-colors cursor-pointer ${
                          isPlaying
                            ? 'bg-cyan-500 text-slate-950 font-bold'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                        title={isPlaying ? 'Тоқтату' : 'Дауыстап оқу (Gemini TTS)'}
                      >
                        {isPlaying ? (
                          <>
                            <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping"></span>
                            <span>Оқылуда...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Дауыстау</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="hover:text-white transition-colors"
                        title="Көшіріп алу"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none px-4 py-3 text-slate-400 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
              <span>Gemini Vision талдауда...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      {messages.length <= 2 && (
        <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {quickPrompts.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(item.prompt)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 text-xs shrink-0 transition-all cursor-pointer"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Input Form Bar */}
      <div className="pt-2 pb-1">
        
        {/* Attached Image Preview Thumbnail Pill */}
        {attachedImage && (
          <div className="mb-2 inline-flex items-center gap-2 bg-slate-900 border border-cyan-500/40 rounded-xl p-1.5 pr-3 shadow-lg">
            <img
              src={attachedImage.data}
              alt="Attachment"
              className="w-10 h-10 rounded-lg object-cover border border-slate-700"
            />
            <div className="text-left">
              <p className="text-[11px] font-bold text-cyan-300">Фото қосылды 📸</p>
              <p className="text-[10px] text-slate-400">Сұрағыңызды қосып жіберіңіз</p>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-2"
              title="Суретті өшіру"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-2xl p-1.5 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500 transition-all shadow-xl gap-1"
        >
          {/* Camera Button */}
          <button
            type="button"
            onClick={() => setIsCameraOpen(true)}
            className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Фотоға түсіру (Камера)"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Gallery Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer"
            title="Галереядан сурет таңдау"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Hidden File Input for Gallery */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleGallerySelect}
            className="hidden"
          />

          {/* Microphone toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40'
                : 'text-slate-400 hover:text-cyan-400 hover:bg-slate-800'
            }`}
            title={isRecording ? 'Жазуды тоқтату' : 'Микрофонмен сөйлеу'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isRecording
                ? 'Сөйлеңіз, сөздер мәтінге айналуда...'
                : attachedImage
                ? 'Суретке қатысты сұрағыңызды жазыңыз (немесе бірден жіберіңіз)...'
                : 'Сұрақ жазыңыз, фото/чек салыңыз немесе дауыспен сұраңыз...'
            }
            className="flex-1 bg-transparent px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
            disabled={isLoading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={(!input.trim() && !attachedImage) || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 disabled:hover:from-cyan-500 disabled:hover:to-blue-600 transition-all cursor-pointer shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[10px] text-slate-500">
          <span>📷 Камера арқылы фотоға түсіру • 🖼️ Галерея • 🎙️ Дауыспен сұрау</span>
          <span>Gemini Vision</span>
        </div>
      </div>

      {/* Live Camera Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

    </div>
  );
};
