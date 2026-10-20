import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, X, Sparkles, RefreshCw, Send } from 'lucide-react';
import { api } from '../services/api';

interface VoiceChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'kk' | 'ru';
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = ({ isOpen, onClose, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [audioEnabled, setAudioEnabled] = useState(true);

  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const transcriptRef = useRef('');

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopAll();
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';

      recognition.onstart = () => {
        setIsListening(true);
        setStatus('listening');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        transcriptRef.current = currentTranscript;
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (status === 'listening') setStatus('idle');
      };

      recognition.onend = () => {
        setIsListening(false);
        const textRecorded = transcriptRef.current.trim();
        if (textRecorded.length > 1) {
          handleSendVoice(textRecorded);
        } else {
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      stopAll();
    };
  }, [isOpen, language]);

  const stopAll = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsListening(false);
    setStatus('idle');
  };

  const toggleListening = () => {
    if (status === 'speaking') {
      stopAudioPlayback();
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      setStatus('idle');
    } else {
      setTranscript('');
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.warn('Recognition start error:', err);
      }
    }
  };

  const stopAudioPlayback = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  };

  const playVoiceResponse = async (text: string) => {
    if (!audioEnabled) {
      setStatus('idle');
      return;
    }

    setStatus('speaking');

    try {
      // Attempt server Gemini TTS first (studio grade WAV audio)
      const data = await api.getVoiceAudio(text, 'Kore');
      if (data?.audioBase64) {
        const audioBlobUrl = `data:audio/wav;base64,${data.audioBase64}`;
        const audio = new Audio(audioBlobUrl);
        audioPlayerRef.current = audio;

        audio.onended = () => {
          setStatus('idle');
        };
        audio.onerror = () => {
          fallbackBrowserSpeech(text);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn('Server TTS failed, using browser speech synthesis fallback');
    }

    // Fallback: Browser Web Speech API
    fallbackBrowserSpeech(text);
  };

  const fallbackBrowserSpeech = (text: string) => {
    if (!window.speechSynthesis) {
      setStatus('idle');
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text.slice(0, 400));
    utterance.lang = language === 'ru' ? 'ru-RU' : 'kk-KZ';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setStatus('idle');
    };
    utterance.onerror = () => {
      setStatus('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handleSendVoice = async (queryText: string) => {
    const textToSend = queryText.trim();
    if (!textToSend) return;

    setStatus('thinking');
    setTranscript(textToSend);

    try {
      const response = await api.sendChatMessage(
        textToSend,
        [],
        'finance',
        language
      );
      setAiResponse(response.text);
      await playVoiceResponse(response.text);
    } catch (err: any) {
      setAiResponse('Кешіріңіз, байланыс қатесі орын алды. Қайталап көріңіз.');
      setStatus('idle');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xl p-4 transition-all">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-white flex flex-col items-center">
        
        {/* Header Controls */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Gemini Live Voice Mode
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={audioEnabled ? 'Дыбысты өшіру' : 'Дыбысты қосу'}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>
            <button
              onClick={() => {
                stopAll();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dynamic Orb / Animated Visualizer */}
        <div className="my-8 relative flex items-center justify-center">
          {/* Animated Glow Rings */}
          <div
            className={`absolute w-44 h-44 rounded-full transition-all duration-700 ${
              status === 'listening'
                ? 'bg-cyan-500/30 scale-125 animate-ping'
                : status === 'speaking'
                ? 'bg-indigo-500/30 scale-110 animate-pulse'
                : status === 'thinking'
                ? 'bg-amber-500/20 scale-105 animate-spin'
                : 'bg-blue-600/10'
            }`}
          />

          <div
            className={`w-36 h-36 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 cursor-pointer ${
              status === 'listening'
                ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-cyan-500/50 scale-105'
                : status === 'speaking'
                ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-purple-500/50 animate-pulse'
                : status === 'thinking'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-600 shadow-orange-500/50'
                : 'bg-gradient-to-tr from-slate-800 to-slate-700 shadow-slate-900/50'
            }`}
            onClick={toggleListening}
          >
            {status === 'thinking' ? (
              <RefreshCw className="w-12 h-12 text-white animate-spin" />
            ) : status === 'speaking' ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : isListening ? (
              <Mic className="w-12 h-12 text-white animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-slate-300" />
            )}
          </div>
        </div>

        {/* Status Indicator Text */}
        <div className="text-center min-h-[3rem] px-4 flex flex-col items-center justify-center mb-4">
          <p className="text-sm font-semibold text-slate-300">
            {status === 'listening' && 'Сізді тыңдап тұрмын... (сөйлей беріңіз)'}
            {status === 'thinking' && 'Gemini 3.8 ойлануда...'}
            {status === 'speaking' && 'Gemini сөйлеп жатыр (тоқтату үшін басыңыз)...'}
            {status === 'idle' && 'Микрофонды басып, сұрағыңызды қойыңыз'}
          </p>
          {transcript && (
            <p className="text-xs text-cyan-300 mt-1 italic max-w-sm line-clamp-2">
              "{transcript}"
            </p>
          )}
        </div>

        {/* AI Response Preview */}
        {aiResponse && (
          <div className="w-full bg-slate-950/70 border border-slate-800 rounded-2xl p-4 max-h-36 overflow-y-auto text-xs text-slate-300 leading-relaxed mb-6 scrollbar-thin">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              Gemini жауабы:
            </div>
            {aiResponse}
          </div>
        )}

        {/* Action Controls */}
        <div className="w-full flex items-center justify-center gap-3">
          <button
            onClick={toggleListening}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg transition-all active:scale-95 cursor-pointer ${
              isListening
                ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/30'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Сөйлеуді аяқтау
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Дауыспен сұрау
              </>
            )}
          </button>

          {status === 'speaking' && (
            <button
              onClick={stopAudioPlayback}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-slate-700 transition-colors"
            >
              Тоқтату
            </button>
          )}
        </div>

        {/* Kazakh Financial Voice Quick Suggestions */}
        <div className="w-full mt-6 pt-4 border-t border-slate-800/80">
          <p className="text-[11px] text-slate-400 mb-2 font-medium text-center">
            Жылдам дауыстық сұрақтар:
          </p>
          <div className="flex flex-wrap gap-1.5 justify-center">
            {[
              'Бөліп төлеу шартын қалай дұрыс жасауға болады?',
              'Кредиттік тарихымды қалай жақсартамын?',
              'ЭЦҚ және SMS OTP кодтың заңды күші бар ма?',
            ].map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSendVoice(preset)}
                className="text-[10px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg border border-slate-700/50 transition-colors text-left"
              >
                "{preset}"
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
