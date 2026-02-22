
import React from 'react';
import { useApp } from '../../store';
import { Facebook, Instagram, Globe, ArrowUp, Mail, ShieldAlert, Lock, Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Footer: React.FC = () => {
  const { config } = useApp();
  const navigate = useNavigate();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="text-center py-6 border-t border-white/5 bg-black mt-auto">
      <div className="flex flex-col items-center space-y-6 max-w-6xl mx-auto px-4">
        <img 
          src={config.logoUrl} 
          alt="Meat Depot Logo" 
          className="h-20 w-auto object-contain"
        />
        <div className="flex items-center gap-6">
          <a href={config.socialLinks?.facebook || "https://facebook.com/meatdepotgq"} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Facebook">
            <Facebook size={20} />
          </a>
          <a href={config.socialLinks?.instagram || "https://www.instagram.com/meatdepotgq/"} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Instagram">
            <Instagram size={20} />
          </a>
          <a href={config.socialLinks?.website || "https://meatdepot.co.za"} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Website">
            <Globe size={20} />
          </a>
          <a href={`mailto:${config.socialLinks?.email || config.businessDetails?.email || "admin@meatdepot.co.za"}`} className="text-white/40 hover:text-white transition-colors" aria-label="Email Us">
            <Mail size={20} />
          </a>
          <a href={config.socialLinks?.whatsapp || "https://wa.me/844012488038318"} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="WhatsApp">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.068-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.197.198-.33.065-.133.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
            </svg>
          </a>
        </div>
        <div className="space-y-4">
          
          <button 
            onClick={() => navigate('/privacy')} 
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#f4d300] uppercase tracking-widest hover:underline border border-[#f4d300]/20 px-4 py-2 rounded-full mx-auto w-fit"
          >
            <Lock size={12} /> Privacy & Refunds Policy
          </button>

          <button 
            onClick={() => navigate('/disclaimer')} 
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#f4d300] uppercase tracking-widest hover:underline border border-[#f4d300]/20 px-4 py-2 rounded-full mx-auto w-fit"
          >
            <ShieldAlert size={12} /> Disclaimer & Terms
          </button>
          
          <button 
            onClick={() => navigate('/terms')} 
            className="flex items-center justify-center gap-2 text-[10px] font-bold text-[#f4d300] uppercase tracking-widest hover:underline border border-[#f4d300]/20 px-4 py-2 rounded-full mx-auto w-fit"
          >
            <Scale size={12} /> Fair Usage Policy
          </button>
        </div>
        <div className="flex flex-col items-center gap-4">
            <div className="text-[#f4d300] font-bold text-[10px] tracking-widest mt-6">END OF PAGE</div>
            <button 
                onClick={scrollToTop}
                className="text-white/30 hover:text-white text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
                <ArrowUp size={12} />
                Back to Top
            </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
