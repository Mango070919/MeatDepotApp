
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../store';
import { User, Mail, Phone, Calendar, Lock, UserPlus, ArrowLeft, Facebook, ShieldCheck, Loader2, AtSign } from 'lucide-react';
import { UserRole } from '../../types';

const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    password: '',
    securityQuestion: 'What was the name of your first pet?',
    securityAnswer: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { users, login, syncToSheet, addNotification } = useApp();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!formData.securityAnswer) {
      setError('Please provide an answer for the security question');
      return;
    }

    if (users.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
      setError('User already exists with this email');
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
      loyaltyPoints: 0
    };

    login(newUser);
    
    // Notify Admins
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    admins.forEach(admin => {
        addNotification({
            id: Math.random().toString(36).substr(2, 9),
            title: "New Customer Registered",
            body: `${newUser.name} (@${newUser.username}) has created a new account.`,
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
  
  const handleFacebookSignup = () => {
    // Simulate getting partial data from Facebook.
    const partialFacebookUser = {
      name: 'User From Facebook', // Pre-filled name, but user can change it.
      email: `facebook_${Date.now()}@meatdepot.app`, // A unique email from the provider.
    };
    
    // Navigate to a new page to collect required information.
    navigate('/complete-profile', { state: { partialUser: partialFacebookUser } });
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pt-10 bg-black min-h-screen">
      <div className="relative text-center">
        <button onClick={() => navigate('/')} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="brand-font text-5xl font-bold italic text-white uppercase tracking-tighter">Create <br/><span className="text-[#f4d300]">Account</span></h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Start your premium journey</p>
        </div>
      </div>
      
      <div className="px-10">
        <button
          onClick={handleFacebookSignup}
          className="w-full bg-[#1877F2] text-white py-4 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all uppercase flex items-center justify-center gap-3"
        >
          <Facebook size={20} />
          Continue with Facebook
        </button>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-white/30 text-xs font-bold uppercase">OR</span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>
      </div>

      <form onSubmit={handleSignup} className="space-y-5 bg-[#0a0a0a] p-10 rounded-[45px] shadow-2xl border border-white/5 -mt-2">
        {error && <div className="bg-[#f4d300]/10 text-[#f4d300] p-4 rounded-2xl text-[10px] font-bold tracking-widest text-center border border-[#f4d300]/20 uppercase">{error}</div>}
        
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
              placeholder="e.g. John Doe"
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
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="john@example.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
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

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Secret Password</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="password" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Confirm Password</label>
          <div className="relative">
            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
            <input 
              type="password" 
              className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isProcessing ? 'Creating Profile...' : 'Join The Depot'}
        </button>

        <div className="pt-6 text-center">
          <p className="text-xs text-white/40 font-medium">
            Member already? <Link to="/login" className="text-[#f4d300] font-bold hover:underline ml-1 uppercase">Sign In</Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
