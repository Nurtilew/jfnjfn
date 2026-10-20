import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, Check, AlertCircle, FlipHorizontal } from 'lucide-react';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Бұл құрылғыда камера мүмкіндігі қолжетімсіз');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsInitializing(false);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Камераға рұқсат берілмеді. Браузер баптауынан рұқсат беріңіз немесе галереядан таңдаңыз.'
          : 'Камераны іске қосу мүмкін болмады.'
      );
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60 z-10">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              {capturedImage ? 'Түсірілген фотоны тексеру' : 'Фотоға түсіру'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder or Captured Preview */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          ) : cameraError ? (
            <div className="p-6 text-center max-w-xs space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Targeting Overlays */}
              <div className="absolute inset-8 border-2 border-cyan-400/50 rounded-2xl pointer-events-none flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-t-2 border-l-2 border-cyan-400"></span>
                  <span className="w-4 h-4 border-t-2 border-r-2 border-cyan-400"></span>
                </div>
                <div className="text-center text-[11px] text-cyan-300 font-medium bg-slate-950/60 px-3 py-1 rounded-full self-center backdrop-blur-sm border border-cyan-500/20">
                  Чекті немесе тауарды ортаға қойыңыз
                </div>
                <div className="flex justify-between">
                  <span className="w-4 h-4 border-b-2 border-l-2 border-cyan-400"></span>
                  <span className="w-4 h-4 border-b-2 border-r-2 border-cyan-400"></span>
                </div>
              </div>

              {isInitializing && (
                <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center">
                  <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="p-5 bg-slate-950 flex items-center justify-between gap-3 border-t border-slate-800">
          {capturedImage ? (
            <>
              <button
                onClick={handleRetake}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Қайта түсіру
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Осы фотоны қолдану
              </button>
            </>
          ) : (
            <>
              {/* Flip camera */}
              <button
                onClick={toggleFacingMode}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                title="Камераны ауыстыру"
              >
                <FlipHorizontal className="w-5 h-5" />
              </button>

              {/* Big Shutter button */}
              <button
                onClick={handleCapture}
                disabled={Boolean(cameraError) || isInitializing}
                className="w-16 h-16 rounded-full bg-white hover:bg-slate-200 p-1.5 shadow-xl transition-transform active:scale-90 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <div className="w-full h-full rounded-full border-2 border-slate-900 bg-white flex items-center justify-center">
                  <div className="w-11 h-11 rounded-full bg-cyan-500"></div>
                </div>
              </button>

              <div className="w-11" />
            </>
          )}
        </div>

      </div>
    </div>
  );
};
