
import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../../store';
import { User } from '../../types';
import { Mail, HelpCircle, Lock, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: email, 2: question, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const { users, updateUserPassword } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
      const emailParam = searchParams.get('email');
      if (emailParam) {
          setEmail(emailParam);
      }
  }, [searchParams]);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && (u.role === 'CUSTOMER' || u.role === 'DRIVER'));
    if (user) {
      setFoundUser(user);
      setStep(2);
      setError('');
    } else {
      setError('No account found with this email address.');
    }
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundUser) return;

    const correctAnswer = foundUser.securityAnswer || foundUser.birthdate; // Fallback to birthdate for legacy
    
    if (correctAnswer && securityAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      setStep(3);
      setError('');
    } else {
      setError('Incorrect answer. Please try again.');
    }
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (foundUser) {
      updateUserPassword(foundUser.email, newPassword);
      setError('');
      setStep(4);
      setTimeout(() => navigate('/login'), 3000);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
                  placeholder="Enter your account email"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/10 hover:scale-105 transition-all uppercase flex items-center justify-center gap-2">
                Find Account <ArrowRight size={16} />
            </button>
          </form>
        );
      case 2:
        return (
          <form onSubmit={handleSecuritySubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Security Question</label>
              <p className="text-white/80 p-4 bg-white/5 rounded-2xl text-center font-medium">
                  {foundUser?.securityQuestion || "What is your date of birth? (YYYY-MM-DD)"}
              </p>
              <div className="relative">
                <HelpCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="text" 
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
                  placeholder="Your answer..."
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/10 hover:scale-105 transition-all uppercase">
              Verify Identity
            </button>
          </form>
        );
      case 3:
        return (
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
                  placeholder="Enter new password"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-white/30 uppercase tracking-[0.4em] px-2">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-16 pr-6 py-5 bg-white/5 border border-white/5 rounded-3xl focus:bg-white/10 focus:ring-2 focus:ring-[#f4d300]/50 outline-none text-white font-medium text-sm transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#f4d300] text-black py-5 rounded-3xl font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/10 hover:scale-105 transition-all uppercase">
              Reset Password
            </button>
          </form>
        );
        case 4:
            return (
                <div className="text-center space-y-6 animate-in fade-in duration-500">
                    <div className="flex justify-center">
                        <div className="w-24 h-24 bg-green-500/10 border-2 border-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            <CheckCircle size={50} strokeWidth={2.5}/>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="brand-font text-2xl font-bold text-white">Password Reset!</h2>
                        <p className="text-white/60 font-medium">Your password has been updated successfully. Redirecting you to the login page...</p>
                    </div>
                </div>
            );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-12 pt-10 bg-black min-h-screen">
      <div className="relative text-center">
        <button onClick={() => navigate('/login')} className="absolute left-0 top-1/2 -translate-y-1/2 p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
        </button>
        <div>
            <h1 className="brand-font text-5xl font-bold italic text-white uppercase tracking-tighter">Account <br/><span className="text-[#f4d300]">Recovery</span></h1>
            <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Step {step} of 3: Secure your account</p>
        </div>
      </div>

      <div className="bg-[#121212] p-10 rounded-[45px] shadow-2xl border border-white/5">
        {error && <div className="mb-6 bg-[#f4d300]/10 text-[#f4d300] p-4 rounded-2xl text-[10px] font-bold tracking-widest text-center border border-[#f4d300]/20 uppercase">{error}</div>}
        {renderStep()}
      </div>
      
      <div className="text-center">
          <Link to="/login" className="text-xs text-white/40 font-medium hover:text-[#f4d300] hover:underline uppercase">
            Back to Login
          </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
