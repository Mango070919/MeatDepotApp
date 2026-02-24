
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../store';
import { User, Mail, Phone, Calendar, Lock, UserPlus, ArrowLeft, ShieldCheck, Loader2, AtSign } from 'lucide-react';
import { UserRole } from '../../types';

const CompleteProfile: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { users, login, syncToSheet, addNotification } = useApp();
  const partialUser = location.state?.partialUser;

  const [formData, setFormData] = useState({
    username: '',
    name: partialUser?.name || '',
    email: partialUser?.email || '',
    phone: '',
    birthdate: '',
    password: Math.random().toString(36).substr(2, 12), // Random password for OAuth users
    securityQuestion: 'What was the name of your first pet?',
    securityAnswer: '',
    facebookId: partialUser?.id || '',
    avatar: partialUser?.picture || ''
  });

  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!partialUser) {
      navigate('/signup');
    }
  }, [partialUser, navigate]);

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (!formData.securityAnswer) {
      setError('Please provide an answer for the security question');
      return;
    }

    if (users.some(u => u.username?.toLowerCase() === formData.username.toLowerCase())) {
      setError('Username already taken. Please choose another.');
      return;
    }

    setIsProcessing(true);

    const newUser = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      role: UserRole.CUSTOMER,
      loyaltyPoints: 0,
      lastLogin: new Date().toISOString(),
      lastActive: new Date().toISOString(),
    };

    login(newUser);
    
    // Notify Admins
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    admins.forEach(admin => {
        addNotification({
            id: Math.random().toString(36).substr(2, 9),
            title: "New Facebook User Registered",
            body: `${newUser.name} (@${newUser.username}) has joined via Facebook.`,
            type: 'ANNOUNCEMENT',
            timestamp: new Date().toISOString(),
            targetUserId: admin.id
        });
    });
    
    await syncToSheet({ users: [...users, newUser] });

    setIsProcessing(false);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pt-10 bg-black min-h-screen">
      <div className="relative text-center">
        <button onClick={() => navigate('/signup')} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="brand-font text-5xl font-bold italic text-white uppercase tracking-tighter">Almost <br/><span className="text-[#f4d300]">There</span></h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Complete your profile to continue</p>
        </div>
      </div>

      <form onSubmit={handleComplete} className="space-y-5 bg-[#0a0a0a] p-10 rounded-[45px] shadow-2xl border border-white/5">
        {error && <div className="bg-[#f4d300]/10 text-[#f4d300] p-4 rounded-2xl text-[10px] font-bold tracking-widest text-center border border-[#f4d300]/20 uppercase">{error}</div>}
        
        <div className="flex justify-center mb-6">
            {formData.avatar ? (
                <img src={formData.avatar} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-[#f4d300] shadow-lg shadow-[#f4d300]/20" />
            ) : (
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10">
                    <User size={32} className="text-white/20" />
                </div>
            )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Username (Unique)</label>
          <div className="relative">
            <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="e.g. BraaiMaster99"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s/g, '')})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Full Name</label>
          <div className="relative">
            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="email" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl outline-none text-white/40 font-medium text-sm transition-all cursor-not-allowed"
              value={formData.email}
              readOnly
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Cell Number</label>
          <div className="relative">
            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="tel" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="063 214 8131"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Birthdate</label>
          <div className="relative">
            <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="date" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              value={formData.birthdate}
              onChange={(e) => setFormData({...formData, birthdate: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Security Question</label>
          <div className="relative">
            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <select 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all appearance-none"
              value={formData.securityQuestion}
              onChange={(e) => setFormData({...formData, securityQuestion: e.target.value})}
            >
                <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
                <option value="What city were you born in?">What city were you born in?</option>
                <option value="What is your favorite food?">What is your favorite food?</option>
                <option value="What was the name of your first school?">What was the name of your first school?</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Security Answer</label>
          <div className="relative">
            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="Your answer..."
              value={formData.securityAnswer}
              onChange={(e) => setFormData({...formData, securityAnswer: e.target.value})}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isProcessing}
          className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/10 hover:scale-105 transition-all uppercase mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
          {isProcessing ? 'Finalizing Profile...' : 'Complete Registration'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
