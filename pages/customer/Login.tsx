
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store';
import { Mail, Lock, LogIn, ChevronRight, ArrowLeft, Shield, Loader2, User, Facebook } from 'lucide-react';
import { ADMIN_CREDENTIALS } from '../../constants';
import { UserRole } from '../../types';

const Login: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { users, login, config } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === 'FACEBOOK_AUTH_CODE') {
        const { code } = event.data;
        handleFacebookExchange(code);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [config]);

  const handleFacebookExchange = async (code: string) => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/facebook/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          appId: config.facebookAppId,
          appSecret: config.facebookAppSecret,
          redirectUri: `${window.location.origin}/auth/facebook/callback`
        })
      });

      const data = await response.json();
      if (data.success) {
        const fbUser = data.user;
        // Check if user exists
        const existingUser = users.find(u => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        
        if (existingUser) {
          login(existingUser);
          navigate('/');
        } else {
          // New user from Facebook - redirect to complete profile
          navigate('/complete-profile', { 
            state: { 
              partialUser: {
                name: fbUser.name,
                email: fbUser.email,
                id: fbUser.id,
                picture: fbUser.picture?.data?.url
              } 
            } 
          });
        }
      } else {
        setError('Facebook authentication failed');
      }
    } catch (err) {
      console.error(err);
      setError('Facebook login error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFacebookLogin = async () => {
    if (!config.facebookAppId) {
      alert('Facebook Login is not configured. Please contact administrator.');
      return;
    }

    try {
      const response = await fetch('/api/auth/facebook/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: config.facebookAppId,
          redirectUri: `${window.location.origin}/auth/facebook/callback`
        })
      });

      const { url } = await response.json();
      window.open(url, 'facebook_login', 'width=600,height=700');
    } catch (err) {
      console.error(err);
      setError('Failed to start Facebook login');
    }
  };

  const getDeviceInfo = () => {
      const ua = navigator.userAgent;
      if (/mobile/i.test(ua)) return 'Mobile Device';
      if (/iPad|Android|Touch/i.test(ua)) return 'Tablet';
      return 'Desktop PC';
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    const inputUser = loginId.trim();
    const inputPass = password; // Do not trim password

    // Legacy check for admin in customer form (optional, can keep for convenience)
    if (inputUser.toLowerCase() === ADMIN_CREDENTIALS.username.toLowerCase() && inputPass === ADMIN_CREDENTIALS.password) {
      // Simulating IP fetch for Admin too
      let ip = 'Unknown';
      try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip;
      } catch (err) { console.error('IP fetch failed'); }

      login({
        id: 'admin',
        username: ADMIN_CREDENTIALS.username,
        name: 'MeatAdmin98',
        email: 'admin@meatdepot.co.za',
        phone: '0000000000',
        role: 'ADMIN' as any,
        loyaltyPoints: 0,
        lastLogin: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        lastIp: ip,
        deviceInfo: getDeviceInfo(),
        permissions: ['orders', 'products', 'content']
      });
      navigate('/admin');
      setIsLoggingIn(false);
      return;
    }

    // Check for Driver or Customer by email, username, or name
    const user = users.find(u => 
      (u.email.toLowerCase() === inputUser.toLowerCase() || 
       (u.username && u.username.toLowerCase() === inputUser.toLowerCase()) || 
       u.name.toLowerCase() === inputUser.toLowerCase()) && 
      u.password === inputPass
    );
    
    if (user) {
      if (user.blocked) {
        setError('Account disabled. Contact support.');
        setIsLoggingIn(false);
        return;
      }
      
      // Fetch Metadata
      let ip = 'Unknown';
      try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip;
      } catch (err) { console.error('IP fetch failed'); }

      // Enrich User Session Data
      const updatedUser = {
          ...user,
          lastLogin: new Date().toISOString(),
          lastActive: new Date().toISOString(),
          lastIp: ip,
          deviceInfo: getDeviceInfo()
      };

      login(updatedUser);
      
      if (user.role === UserRole.DRIVER) {
          navigate('/driver');
      } else if (user.role === UserRole.ADMIN) {
          navigate('/admin');
      } else {
          navigate('/');
      }
    } else {
      setError('Invalid credentials');
    }
    setIsLoggingIn(false);
  };

  return (
    <div className="max-w-md mx-auto space-y-12 pt-10 bg-black min-h-screen">
      <div className="relative text-center">
        <button onClick={() => navigate('/')} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="brand-font text-5xl font-bold italic text-white uppercase tracking-tighter">Welcome <br/><span className="text-[#f4d300]">Back</span></h1>
          <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Enter your credentials</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="space-y-6 bg-[#121212] p-10 rounded-[45px] shadow-2xl border border-white/5">
        {error && <div className="bg-[#f4d300]/10 text-[#f4d300] p-4 rounded-2xl text-[10px] font-bold tracking-widest text-center border border-[#f4d300]/20 uppercase">{error}</div>}
        
        <div className="space-y-2">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Username or Email</label>
          <div className="relative">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="e.g. JohnDoe or email@site.com"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Password</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="text-right px-2 pt-1">
            <Link to="/forgot-password" className="text-xs text-white/40 font-medium hover:text-[#f4d300] hover:underline">
                Forgot Password?
            </Link>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoggingIn}
          className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/10 hover:scale-105 transition-all uppercase mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {isLoggingIn && <Loader2 size={16} className="animate-spin" />}
          AUTHENTICATE
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-white/30 text-[9px] font-bold uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button 
          type="button"
          onClick={handleFacebookLogin}
          disabled={isLoggingIn}
          className="w-full bg-[#1877F2] text-white py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-blue-500/10 hover:scale-105 transition-all uppercase flex items-center justify-center gap-3 disabled:opacity-70"
        >
          <Facebook size={20} />
          Continue with Facebook
        </button>

        <div className="pt-6 text-center">
          <p className="text-xs text-white/40 font-medium">
            New here? <Link to="/signup" className="text-[#f4d300] font-bold hover:underline ml-1">CREATE ACCOUNT</Link>
          </p>
        </div>
      </form>

      <div className="flex justify-center pb-8">
        <button 
          onClick={() => navigate('/admin-login')} 
          className="text-white/30 text-[9px] font-bold hover:text-[#f4d300] transition-colors flex items-center gap-2 tracking-[0.2em] uppercase border border-white/10 px-6 py-3 rounded-full hover:bg-white/5 hover:border-[#f4d300]"
        >
          <Shield size={12} />
          ADMIN / DRIVER ACCESS
        </button>
      </div>
    </div>
  );
};

export default Login;
