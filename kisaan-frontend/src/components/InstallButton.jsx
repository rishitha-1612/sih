import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare } from 'lucide-react';
import useInstallPrompt from '../hooks/useInstallPrompt';

export default function InstallButton() {
  const { isInstallable, isIOS, triggerInstall } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    console.log('InstallButton: Visibility Check - STANDALONE:', isStandalone, 'INSTALLABLE:', isInstallable, 'isIOS:', isIOS);
    
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
      {/* Floating Bubble Button */}
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-[9999] bg-green-500 hover:bg-green-400 text-white p-4 rounded-full shadow-[0_10px_30px_rgba(34,197,94,0.4)] transition-all transform hover:scale-110 active:scale-95 group flex items-center gap-2"
        title="Install Kisaan Mitra"
      >
        <Download size={24} className="group-hover:animate-bounce" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">
          Install App
        </span>
      </button>

      {/* iOS Manual Instructions Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="bg-[#121418] border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl transform transition-transform animate-in fade-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white">Install Kisaan Konnect</h3>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <p className="text-gray-400 text-sm leading-relaxed">
                Add Kisaan Mitra to your home screen for quick access and a full-screen experience.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                    <Share size={20} />
                  </div>
                  <p className="text-gray-200 text-sm font-medium">
                    1. Tap the <span className="text-blue-400 font-bold">Share</span> button in Safari.
                  </p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
                    <PlusSquare size={20} />
                  </div>
                  <p className="text-gray-200 text-sm font-medium">
                    2. Scroll down and tap <span className="text-green-400 font-bold">Add to Home Screen</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIOSModal(false)}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-green-900/20"
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
