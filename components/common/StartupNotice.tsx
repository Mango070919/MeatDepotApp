
import React, { useState, useEffect } from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { playSound } from '../../services/soundService';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';

const StartupNotice: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Only show if active in config AND not dismissed in session
    const hasBeenDismissed = sessionStorage.getItem('startupNoticeDismissed');
    if (!hasBeenDismissed && config.startupPopup?.isActive) {
      setIsOpen(true);
    }
  }, [config.startupPopup]);

  const handleDismiss = () => {
    sessionStorage.setItem('startupNoticeDismissed', 'true');
    setIsOpen(false);
    playSound('startup', config);
    // Ensure we start on the home page when the user acknowledges the notice
    navigate('/');
  };

  const handleViewDisclaimer = () => {
      // Allow viewing disclaimer without dismissing the "Heads Up" permanently if preferred, 
      // or dismiss it so they can read. Let's dismiss it so they can read the page.
      sessionStorage.setItem('startupNoticeDismissed', 'true');
      setIsOpen(false);
      navigate('/disclaimer');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/90 glass z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#121212] max-w-lg w-full rounded-[50px] border border-white/10 shadow-2xl p-10 space-y-8 text-center">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-[#f4d300]/10 border-2 border-[#f4d300]/20 rounded-3xl flex items-center justify-center text-[#f4d300]">
            <AlertTriangle size={40} strokeWidth={2.5} />
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="brand-font text-3xl font-bold italic text-white">{config.startupPopup?.title || "Heads Up!"}</h2>
          <p className="text-white/60 font-medium text-lg leading-relaxed max-w-md mx-auto whitespace-pre-wrap">
            {config.startupPopup?.message || "Meat Depot is not yet trading. This is a preview of our ordering platform."}
          </p>
        </div>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button 
            onClick={handleDismiss} 
            className="w-full sm:w-auto bg-[#f4d300] text-black px-10 py-4 rounded-3xl font-bold text-xs tracking-widest uppercase shadow-lg shadow-[#f4d300]/20 hover:scale-105 transition-transform"
          >
            I Understand
          </button>
          
          <button 
            onClick={handleViewDisclaimer}
            className="w-full sm:w-auto text-white/50 hover:text-white px-6 py-4 rounded-3xl font-bold text-[10px] tracking-widest uppercase border border-white/10 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
              <FileText size={14} /> View Disclaimer
          </button>
        </div>
      </div>
    </div>
  );
};

export default StartupNotice;
