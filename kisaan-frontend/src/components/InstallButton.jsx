import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import useInstallPrompt from '../hooks/useInstallPrompt';

export default function InstallButton({ mode = 'floating' }) {
  const { isInstallable, isIOS, triggerInstall } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    // Only show if not already installed as standalone
    if (!isStandalone) {
      setIsVisible(isInstallable || isIOS);
    } else {
      setIsVisible(false);
    }
  }, [isInstallable, isIOS]);

  if (!isVisible) return null;

  const handleClick = () => {
    if (isIOS) {
      setShowIOSModal(true);
    } else {
      triggerInstall();
    }
  };

  return (
    <>
      {mode === 'menu' ? (
        <button
          onClick={handleClick}
          className="w-full rounded-2xl border border-emerald-300/25 bg-emerald-500/10 px-4 py-3 text-left text-white backdrop-blur-sm transition-colors hover:bg-emerald-500/20"
          title="Install Kisaan Mitra"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-[62%_38%_58%_42%/44%_56%_42%_58%] border border-emerald-300/40 bg-emerald-400/25 text-emerald-100 shadow-[0_0_18px_rgba(52,211,153,0.35)]">
              <Download size={18} />
            </span>
            <span className="text-sm font-semibold">Download App</span>
          </span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-[9999] group inline-flex items-center gap-3 rounded-2xl border border-emerald-300/50 bg-gradient-to-r from-emerald-600 to-lime-500 px-4 py-3 text-white shadow-[0_12px_35px_rgba(5,150,105,0.35)] transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_16px_40px_rgba(5,150,105,0.45)] active:translate-y-0"
          title="Install Kisaan Mitra"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/20 backdrop-blur">
            <Download size={18} />
          </span>
          <span className="leading-tight">
            <span className="block text-[11px] font-medium uppercase tracking-wider text-white/80">
              Offline Ready
            </span>
            <span className="block text-sm font-semibold whitespace-nowrap">
              Install App
            </span>
          </span>
        </button>
      )}

      {showIOSModal && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md rounded-3xl border border-emerald-200/20 bg-[#11161c] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Install Kisaan Konnect</h3>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-sm leading-relaxed text-gray-300">
                Add Kisaan Mitra to your home screen for quick access and a full-screen experience.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/20 text-sky-300">
                    <Share size={20} />
                  </div>
                  <p className="text-sm font-medium text-gray-100">
                    1. Tap the <span className="font-bold text-sky-300">Share</span> button in Safari.
                  </p>
                </div>

                <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                    <PlusSquare size={20} />
                  </div>
                  <p className="text-sm font-medium text-gray-100">
                    2. Scroll down and tap <span className="font-bold text-emerald-300">Add to Home Screen</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-lime-500 py-3.5 font-semibold text-white transition-opacity hover:opacity-95"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
