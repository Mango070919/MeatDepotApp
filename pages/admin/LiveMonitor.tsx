
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Activity, Smartphone, Monitor, MapPin, Clock, ArrowLeft, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '../../types';

const LiveMonitor: React.FC = () => {
  const { users, activityLogs } = useApp();
  const navigate = useNavigate();
  const [activeUsers, setActiveUsers] = useState<any[]>([]);

  useEffect(() => {
    const updateActiveUsers = () => {
        const now = Date.now();
        const fifteenMinutes = 15 * 60 * 1000;
        
        const active = users.filter(u => {
            if (!u.lastActive) return false;
            const lastActiveTime = new Date(u.lastActive).getTime();
            return (now - lastActiveTime) < fifteenMinutes;
        }).map(u => {
            // Find latest activity
            const latestLog = activityLogs.find(log => log.userId === u.id);
            return {
                ...u,
                latestAction: latestLog ? `${latestLog.action}: ${latestLog.details}` : 'Browsing...',
                timeSinceActive: Math.floor((now - new Date(u.lastActive!).getTime()) / 1000 / 60) // minutes
            };
        }).sort((a, b) => new Date(b.lastActive!).getTime() - new Date(a.lastActive!).getTime());

        setActiveUsers(active);
    };

    updateActiveUsers();
    const interval = setInterval(updateActiveUsers, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [users, activityLogs]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-6">
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between border-b border-green-500/30 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin')} className="text-green-500 hover:text-white transition-colors"><ArrowLeft size={24}/></button>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="animate-pulse" /> SYSTEM MONITOR // LIVE SESSIONS</h1>
                </div>
                <div className="text-xs opacity-70">
                    STATUS: ONLINE | ACTIVE NODES: {activeUsers.length}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeUsers.length === 0 ? (
                    <div className="col-span-full text-center py-20 opacity-50 border border-dashed border-green-900 rounded-lg">
                        NO ACTIVE SIGNALS DETECTED
                    </div>
                ) : (
                    activeUsers.map(user => (
                        <div key={user.id} className="bg-green-900/10 border border-green-500/30 p-6 rounded-lg relative overflow-hidden group hover:bg-green-900/20 transition-all">
                            <div className="absolute top-0 right-0 p-2 opacity-50">
                                {user.deviceInfo?.toLowerCase().includes('mobile') ? <Smartphone size={40} /> : <Monitor size={40} />}
                            </div>
                            
                            <div className="space-y-4 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full border-2 border-green-500 flex items-center justify-center bg-black">
                                        {user.role === UserRole.ADMIN ? <Shield size={20} /> : <User size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{user.name}</h3>
                                        <span className="text-xs bg-green-500 text-black px-2 py-0.5 rounded font-bold uppercase">{user.role}</span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-xs opacity-80">
                                    <p className="flex items-center gap-2"><MapPin size={12}/> {user.lastIp || 'Unknown IP'}</p>
                                    <p className="flex items-center gap-2"><Clock size={12}/> Active {user.timeSinceActive}m ago</p>
                                    {user.lastLocation && (
                                        <a 
                                            href={`https://maps.google.com/?q=${user.lastLocation.lat},${user.lastLocation.lng}`} 
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-green-400 hover:text-white underline mt-1"
                                        >
                                            <MapPin size={12}/> View Live Location
                                        </a>
                                    )}
                                </div>

                                <div className="border-t border-green-500/20 pt-3 mt-2">
                                    <p className="text-[10px] uppercase tracking-widest text-green-400 opacity-60 mb-1">Latest Activity</p>
                                    <p className="text-sm text-white truncate">{user.latestAction}</p>
                                </div>
                            </div>
                            
                            {/* Scanning line effect */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-[scan_2s_linear_infinite] pointer-events-none opacity-0 group-hover:opacity-100"></div>
                        </div>
                    ))
                )}
            </div>
        </div>
        <style>{`
            @keyframes scan {
                0% { top: 0%; }
                100% { top: 100%; }
            }
        `}</style>
    </div>
  );
};

export default LiveMonitor;
