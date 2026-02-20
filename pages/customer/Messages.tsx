
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Bell, Package, Tag, Info, Trash2, ArrowLeft, UserPlus, ShieldAlert, FileText, Download, X, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole, AppNotification } from '../../types';

const Messages: React.FC = () => {
  const { notifications, deleteNotification, config, currentUser } = useApp();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER': return <Package className="text-blue-600" size={20} />;
      case 'PROMO': return <Tag className="text-yellow-600" size={20} />;
      case 'ANNOUNCEMENT': return <UserPlus className="text-purple-500" size={20} />;
      case 'DOCUMENT': return <FileText className="text-red-500" size={20} />;
      default: return <Info className="text-gray-600" size={20} />;
    }
  };

  // Filter messages relevant to the current user
  const myNotifications = notifications.filter(n => {
      // 1. If global (no target), everyone sees it
      if (!n.targetUserId) return true;
      // 2. Targeted specifically to this user
      if (n.targetUserId === currentUser?.id) return true;
      // 3. If user is Admin, they should see system/admin alerts even if targeted generically to 'admin' (handled by ID usually, but safe check)
      if (currentUser?.role === UserRole.ADMIN && n.targetUserId === 'admin') return true;
      
      return false;
  });

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-700 bg-black -mx-4 px-6 pt-6 relative">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/account')} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-5xl font-bold italic text-white">Your Inbox</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Promos & Updates</p>
        </div>
        {myNotifications.length > 0 && (
          <div className="bg-[#f4d300] text-black text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-[#f4d300]/20">
            {myNotifications.length} New
          </div>
        )}
      </div>

      {myNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 text-center flex-grow">
          <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
            <Bell size={80} strokeWidth={1} />
          </div>
          <div className="space-y-3">
            <h2 className="brand-font text-4xl font-bold italic text-white">All Caught Up!</h2>
            <p className="text-white/40 font-medium max-w-xs mx-auto">No new messages or promotions at the moment. Check back later.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 pb-20">
          {myNotifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => setSelectedNotification(notif)}
              className="bg-[#121212] rounded-[40px] border border-white/5 overflow-hidden hover:border-[#f4d300]/30 transition-all group shadow-2xl cursor-pointer active:scale-95"
            >
              {notif.imageUrl && (
                <div className="w-full h-48 overflow-hidden relative">
                  <img src={notif.imageUrl} alt={notif.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
                  <div className="absolute bottom-4 right-4 bg-black/60 p-2 rounded-full text-white/70 backdrop-blur-sm">
                      <Maximize2 size={16} />
                  </div>
                </div>
              )}
              <div className="p-6 flex items-start gap-6">
                <div className="bg-black/20 p-4 rounded-2xl h-fit shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="brand-font text-xl font-bold text-white leading-tight line-clamp-1">{notif.title}</h3>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest whitespace-nowrap">
                      {new Date(notif.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-2">{notif.body}</p>
                  
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest hover:underline">Read More</span>
                      
                      {/* Admin Indicator for internal messages */}
                      {currentUser?.role === UserRole.ADMIN && notif.targetUserId && (
                          <span className="inline-flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider">
                              <ShieldAlert size={10} /> Admin Alert
                          </span>
                      )}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="p-3 text-white/20 hover:text-red-500 hover:bg-white/5 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedNotification && (
          <div className="fixed inset-0 bg-black/95 glass z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-[#121212] w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4">
                  {/* Modal Header/Image */}
                  <div className="relative shrink-0">
                      {selectedNotification.imageUrl ? (
                          <div className="w-full h-64 relative">
                              <img src={selectedNotification.imageUrl} className="w-full h-full object-cover" alt="Notification" />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#121212] to-transparent"></div>
                          </div>
                      ) : (
                          <div className="h-24 bg-gradient-to-b from-white/5 to-[#121212]"></div>
                      )}
                      
                      <button 
                          onClick={() => setSelectedNotification(null)}
                          className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-white hover:text-black transition-colors backdrop-blur-md"
                      >
                          <X size={24} />
                      </button>
                  </div>

                  {/* Modal Content */}
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                      <div className="space-y-2">
                          <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-white/50 uppercase tracking-widest border border-white/5">
                                  {selectedNotification.type}
                              </span>
                              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                                  {new Date(selectedNotification.timestamp).toLocaleDateString()} at {new Date(selectedNotification.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </span>
                          </div>
                          <h2 className="brand-font text-3xl font-bold text-white leading-tight">{selectedNotification.title}</h2>
                      </div>

                      <div className="prose prose-invert prose-sm max-w-none">
                          <p className="text-white/80 whitespace-pre-wrap leading-relaxed text-base">{selectedNotification.body}</p>
                      </div>

                      {selectedNotification.actionUrl && (
                          <div className="pt-4 border-t border-white/10">
                              <a 
                                  href={selectedNotification.actionUrl}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-lg shadow-[#f4d300]/20"
                              >
                                  <Download size={18} />
                                  {selectedNotification.actionLabel || 'Download Attachment'}
                              </a>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Messages;
