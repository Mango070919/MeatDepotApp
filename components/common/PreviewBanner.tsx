
import React from 'react';
import { useApp } from '../../store';
import { Eye, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PreviewBanner: React.FC = () => {
  const { isPreviewMode, commitPreview, cancelPreview } = useApp();
  const navigate = useNavigate();

  if (!isPreviewMode) return null;

  const handleCommit = () => {
      commitPreview();
      navigate('/admin');
  };

  const handleDiscard = () => {
      cancelPreview();
      navigate('/admin');
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-lg">
      <div className="bg-[#121212] text-white p-4 rounded-3xl shadow-2xl border border-[#f4d300] flex items-center justify-between gap-4 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center gap-3">
            <div className="bg-[#f4d300] text-black p-2 rounded-full animate-pulse">
                <Eye size={20} />
            </div>
            <div>
                <p className="font-bold text-sm">Preview Mode</p>
                <p className="text-[10px] text-white/50 uppercase tracking-wider">Unsaved Changes</p>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleDiscard}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-colors"
                title="Discard & Exit"
            >
                <X size={20} />
            </button>
            <button 
                onClick={handleCommit}
                className="bg-[#f4d300] hover:bg-[#f4d300]/90 text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
                <Save size={16} />
                Commit
            </button>
        </div>
      </div>
    </div>
  );
};

export default PreviewBanner;
