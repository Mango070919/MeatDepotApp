
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { Lock, User, LogIn, Shield, Truck, Loader2, Monitor, ArrowLeft } from 'lucide-react';
import { ADMIN_CREDENTIALS, DEFAULT_ADMIN_IMAGE } from '../../constants';
import { UserRole } from '../../types';

const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { login, users, currentUser, config } = useApp();
  const navigate = useNavigate();

  // Reactive Navigation: Automatically redirect when currentUser is set
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.ADMIN) navigate('/admin', { replace: true });
      else if (currentUser.role === UserRole.DRIVER) navigate('/driver', { replace: true });
      else if (currentUser.role === UserRole.CASHIER) navigate('/pos', { replace: true });
      // If customer somehow logs in here, send them home
      else if (currentUser.role === UserRole.CUSTOMER) navigate('/', { replace: true });
    }
  }, [currentUser, navigate]);

  const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'Mobile Device';
      if (/iPad|Android|Touch/i.test(ua)) return 'Tablet';
      return 'Desktop PC';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setError('');
    setIsLoggingIn(true);

    // Artificial delay to show loading state and prevent spamming
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
        const inputUser = username.trim();
        const inputPass = password; // Do not trim password to support spaces if needed
        let targetUser: any = null;

        const configAdminUser = (config.adminCredentials?.username || ADMIN_CREDENTIALS.username || 'admin').trim();
        const configAdminPass = config.adminCredentials?.password || ADMIN_CREDENTIALS.password || 'admin';

        console.log("Login attempt:", { inputUser, configAdminUser });

        // --- CHECK 1: MASTER KEY (Config or Constants) ---
        const isConfigAdmin = (inputUser.toLowerCase() === configAdminUser.toLowerCase() && inputPass === configAdminPass) ||
                             (inputUser.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() && inputPass === ADMIN_CREDENTIALS.password);

        if (isConfigAdmin) {
            console.log("Master Key Match");
            const existingAdmin = users.find(u => u.id === 'admin' || u.username === configAdminUser || u.username === ADMIN_CREDENTIALS.username);
            targetUser = {
                id: 'admin',
                name: config.businessDetails?.companyName || 'Meat Depot Admin',
                email: config.businessDetails?.email || 'admin@meatdepot.co.za',
                phone: config.businessDetails?.contactNumber || '',
                role: UserRole.ADMIN,
                loyaltyPoints: 0,
                profilePicture: existingAdmin?.profilePicture || DEFAULT_ADMIN_IMAGE,
                lastLogin: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                lastIp: 'Unknown',
                deviceInfo: getDeviceInfo(),
                permissions: ['orders', 'products', 'content']
            };
        } 
        // --- CHECK 2: DATABASE STAFF (Admin/Driver/Cashier) ---
        else {
            // Find in current users state
            let staffUser = users.find(u => 
                (u.email.toLowerCase() === inputUser.toLowerCase() || u.name.toLowerCase() === inputUser.toLowerCase() || u.username?.toLowerCase() === inputUser.toLowerCase()) && 
                u.password === inputPass
            );

            // Fallback to INITIAL_USERS if not found in state (safety net)
            if (!staffUser) {
                const initialStaff = [
                    { username: 'MeatAdmin98', password: 'Mango070919-', role: UserRole.ADMIN },
                    { username: 'driver', password: 'driver', role: UserRole.DRIVER },
                    { username: 'pos', password: 'pos', role: UserRole.CASHIER }
                ];
                const foundInitial = initialStaff.find(s => s.username.toLowerCase() === inputUser.toLowerCase() && s.password === inputPass);
                if (foundInitial) {
                    staffUser = {
                        id: foundInitial.username,
                        name: foundInitial.username.toUpperCase(),
                        email: `${foundInitial.username}@meatdepot.co.za`,
                        phone: '',
                        role: foundInitial.role,
                        loyaltyPoints: 0,
                        password: foundInitial.password,
                        permissions: ['orders', 'products', 'content']
                    };
                }
            }

            if (staffUser) {
                if (staffUser.blocked) throw new Error('Account is blocked.');
                
                // Validate Role
                if (![UserRole.ADMIN, UserRole.DRIVER, UserRole.CASHIER].includes(staffUser.role)) {
                    throw new Error('Insufficient permissions.');
                }
                
                targetUser = {
                    ...staffUser,
                    lastLogin: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    lastIp: 'Unknown',
                    deviceInfo: getDeviceInfo()
                };
            }
        }

        if (targetUser) {
            // Update Context
            login(targetUser);
            return;
        }
        
        throw new Error('Invalid credentials.');

    } catch (err: any) {
        console.error("Login Error:", err);
        setError(err.message || 'An unexpected error occurred.');
        setIsLoggingIn(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] overflow-y-auto flex flex-col items-center justify-center">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-900 via-black to-black opacity-50 z-0 pointer-events-none"></div>

      <div className="max-w-md w-full mx-auto px-6 relative z-10">
        <div className="text-center space-y-4 mb-10">
          <div className="inline-flex p-5 bg-[#f4d300] text-black rounded-full shadow-[0_0_30px_rgba(244,211,0,0.3)] mb-2">
            <Shield size={40} />
          </div>
          <div>
            <h1 className="brand-font text-4xl font-bold text-white tracking-wide">STAFF PORTAL</h1>
            <p className="text-white/40 font-bold text-xs tracking-[0.3em] uppercase mt-2">Restricted Access Area</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#121212] p-8 rounded-[40px] shadow-2xl border border-white/10 space-y-6">
          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-2xl text-xs font-bold text-center border border-red-500/20 animate-in fade-in slide-in-from-top-2 flex items-center justify-center gap-2">
                <Shield size={14} /> {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] px-2">Staff ID / Username</label>
            <div className="relative group">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#f4d300] transition-colors" size={18} />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 focus:border-[#f4d300] outline-none text-white font-medium transition-all placeholder:text-white/10"
                placeholder="Enter ID"
                required
                autoCapitalize="none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-bold text-white/40 uppercase tracking-[0.2em] px-2">Access Code</label>
            <div className="relative group">
              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-[#f4d300] transition-colors" size={18} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 focus:border-[#f4d300] outline-none text-white font-medium transition-all placeholder:text-white/10"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoggingIn}
            className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-[#f4d300]/20 hover:scale-[1.02] active:scale-95 transition-all uppercase text-xs tracking-[0.2em] disabled:opacity-70 disabled:scale-100"
          >
            {isLoggingIn ? <Loader2 size={18} className="animate-spin"/> : <LogIn size={18} />}
            {isLoggingIn ? 'Accessing System...' : 'Enter Portal'}
          </button>
        </form>
        
        <div className="flex justify-center gap-8 mt-10 opacity-20 text-white select-none pointer-events-none">
            <div className="flex flex-col items-center gap-2">
                <Shield size={20} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Admin</span>
            </div>
            <div className="h-8 w-[1px] bg-white/50"></div>
            <div className="flex flex-col items-center gap-2">
                <Truck size={20} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Driver</span>
            </div>
            <div className="h-8 w-[1px] bg-white/50"></div>
            <div className="flex flex-col items-center gap-2">
                <Monitor size={20} />
                <span className="text-[8px] font-bold uppercase tracking-widest">POS</span>
            </div>
        </div>
        
        {/* Navigation Home */}
        <div className="text-center mt-12">
            <button 
                onClick={() => navigate('/')} 
                className="text-white/30 text-[10px] hover:text-white transition-colors flex items-center justify-center gap-2 mx-auto hover:bg-white/5 px-4 py-2 rounded-full"
            >
                <ArrowLeft size={12} />
                Return to Shop
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
