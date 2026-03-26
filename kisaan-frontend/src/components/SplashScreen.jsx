import { motion, AnimatePresence } from 'framer-motion';
import { Leaf } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 3 second timer
    const duration = 3000;
    const interval = 30; // update every 30ms
    const step = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onFinish, 500); // Wait for fade out
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#0a0c0a]"
    >
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.15)_0%,transparent_70%)] pointer-events-none"></div>

      <div className="text-center relative">
        {/* Animated Logo Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.5, rotate: -20 }}
           animate={{ opacity: 1, scale: 1, rotate: 0 }}
           transition={{ duration: 1, ease: "easeOut" }}
           className="mb-8 relative inline-block"
        >
          <div className="w-32 h-32 md:w-40 md:h-40 bg-green-500/10 rounded-[2.5rem] border border-green-500/20 flex items-center justify-center p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(22,163,74,0.3)]">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Subtle logo pulse */}
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-green-500/20 rounded-[2.5rem] blur-2xl -z-10"
          />
        </motion.div>

        {/* Text Container */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2">
              Kisaan <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">Konnect</span>
            </h1>
            <p className="text-gray-400 font-medium tracking-widest uppercase text-xs">
              Smart Agriculture. Better Future.
            </p>
          </motion.div>

          {/* Progress Bar Container */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="w-64 mx-auto mt-12 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5"
          >
            <motion.div 
              className="bg-gradient-to-r from-green-600 to-emerald-400 h-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </motion.div>
        </div>
      </div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0.5] }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 text-gray-600 text-[10px] font-black uppercase tracking-[0.2em]"
      >
        © 2026 Kisaan Konnect. All Rights Reserved.
      </motion.div>
    </motion.div>
  );
}
