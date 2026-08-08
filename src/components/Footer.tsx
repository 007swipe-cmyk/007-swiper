import React, { useState, useRef } from 'react';
import { SecretModal } from './SecretModal';

export const Footer: React.FC = () => {
  const [showSecretModal, setShowSecretModal] = useState(false);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleSecretClick = () => {
    clickCountRef.current++;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    if (clickCountRef.current >= 3) {
      setShowSecretModal(true);
      clickCountRef.current = 0;
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 1000);
    }
  };

  return (
    <>
      <footer className="border-t border-white/5 py-8 text-center bg-[#030303]/50 mt-12 relative z-10 font-sans">
        <div className="max-w-6xl mx-auto px-6">
          <p 
            onClick={handleSecretClick}
            className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest select-none cursor-pointer hover:text-zinc-500 transition-colors"
          >
            © 2026 007 SWIPER INTELLIGENCE PLATFORM. <span className="hover:text-zinc-400">TODOS OS DIREITOS RESERVADOS</span>.
          </p>
        </div>
      </footer>
      
      <SecretModal isOpen={showSecretModal} onClose={() => setShowSecretModal(false)} />
    </>
  );
};
