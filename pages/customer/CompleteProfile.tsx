
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../store';
import { User as UserIcon, Mail, Phone, Calendar, UserPlus, ArrowLeft, ShieldCheck, Loader2, AtSign } from 'lucide-react';
import { User, UserRole } from '../../types';

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, users, syncToSheet, addNotification } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  // Redirect to signup if no partial user data is passed in the route state.
  useEffect(() => {
    if (!location.state?.partialUser) {
      navigate('/signup');
    }
  }, [location.state, navigate]);

  const partialUser = location.state?.partialUser || { name: '', email: '' };

  const [formData, setFormData] = useState({
    username: '',
    name: partialUser.name,
    email: partialUser.email,
    phone: '',
    birthdate: '',
    password: Math.random().toString(36), // Dummy password for social login users.
    securityQuestion: 'What was the name of your first pet?',
    securityAnswer: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (!formData.name || !formData.phone || !formData.birthdate || !formData.securityAnswer || !formData.username) {
        setError('Please fill out all required fields.');
        return;
    }

    if (users.some(u => u.username?.toLowerCase() === formData.username.toLowerCase())) {
        setError('Username taken. Please choose another.');
        return;
    }

    setIsProcessing(true);

    const newUser: User = {
      ...formData,
      id: `fb-${Math.random().toString(36).substr(2, 9)}`,
      role: UserRole.CUSTOMER,
      loyaltyPoints: 0
    };

    login(newUser); 
    
    // Notify Admins
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    admins.forEach(admin => {
        addNotification({
            id: Math.random().toString(36).substr(2, 9),
            title: "New Customer (Social)",
            body: `${newUser.name} (@${newUser.username}) has completed their profile setup.`,
            type: 'ANNOUNCEMENT',
            timestamp: new Date().toISOString(),
            targetUserId: admin.id
        });
    });
    
    // Explicitly sync the new user list to ensure cloud is updated immediately
    const updatedUsers = [...users, newUser];
    await syncToSheet({ users: updatedUsers });

    setIsProcessing(false);
    navigate('/');
  };

  return (
    <div className="max-w-md mx-auto space-y-12 pt-10 bg-black min-h-screen">
      <div className="relative text-center">
        <button onClick={() => navigate('/signup')} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="brand-font text-5xl font-bold italic text-white uppercase tracking-tighter">Just One <br/><span className="text-[#f4d300]">More Step</span></h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Complete your profile</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 bg-[#0a0a0a] p-10 rounded-[45px] shadow-2xl border border-white/5">
        {error && <div className="bg-[#f4d300]/10 text-[#f4d300] p-4 rounded-2xl text-[10px] font-bold tracking-widest text-center border border-[#f4d300]/20 uppercase">{error}</div>}
        
        <p className="text-center text-sm text-white/60 pb-4">
            We need a few more details to create your secure Meat Depot account. This info is required for order security and age verification.
        </p>
        
        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Email Address (from Facebook)</label>
          <div className="relative">
            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="email" 
              className="w-full pl-16 pr-6 py-5 bg-black/30 border border-white/5 rounded-3xl text-white/50 font-medium text-sm transition-all"
              value={formData.email}
              disabled
              readOnly
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Username</label>
          <div className="relative">
            <AtSign className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="e.g. BraaiMaster"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s/g, '')})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Full Name</label>
          <div className="relative">
            <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="text" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
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
              placeholder="Required for order updates"
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
          {isProcessing ? 'Creating Profile...' : 'Complete Profile & Start Shopping'}
        </button>
      </form>
    </div>
  );
};

export default CompleteProfile;
