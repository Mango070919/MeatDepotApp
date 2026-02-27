import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { UserRole, User } from '../../types';
import { LogIn, UserPlus, ArrowLeft } from 'lucide-react';

const CustomerAuth: React.FC = () => {
  const { users, login, addUser, updateUser } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Login State
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register State
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBirthdate, setRegBirthdate] = useState('');
  const [regEmail, setRegEmail] = useState('');

  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = users.find(u => u.phone === loginPhone && u.password === loginPassword && u.role === UserRole.CUSTOMER);
    if (user) {
      login(user);
      navigate('/cart');
    } else {
      setError('Invalid phone number or password.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!regName || !regPhone || !regPassword || !regBirthdate) {
      setError('Please fill in all required fields.');
      return;
    }

    if (users.some(u => u.phone === regPhone)) {
      setError('An account with this phone number already exists.');
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: regName,
      phone: regPhone,
      email: regEmail || '',
      birthdate: regBirthdate,
      password: regPassword,
      role: UserRole.CUSTOMER,
      loyaltyPoints: 0,
      wishlist: [],
      lastLogin: new Date().toISOString()
    };

    login(newUser);
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <button onClick={() => navigate(-1)} className="absolute top-6 left-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="w-full max-w-md bg-[#121212] p-8 rounded-[40px] border border-white/10 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="flex bg-white/5 p-1 rounded-full">
            <button 
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isLogin ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isLogin ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/50 hover:text-white'}`}
            >
              Register
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Mobile Number</label>
              <input 
                type="tel" 
                value={loginPhone}
                onChange={e => setLoginPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="e.g. 0821234567"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="w-full bg-[#f4d300] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffe133] transition-colors mt-8">
              <LogIn size={20} /> Login to Checkout
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Name & Surname *</label>
              <input 
                type="text" 
                value={regName}
                onChange={e => setRegName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Mobile Number *</label>
              <input 
                type="tel" 
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="0821234567"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Birthdate *</label>
              <input 
                type="date" 
                value={regBirthdate}
                onChange={e => setRegBirthdate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Email Address (Optional)</label>
              <input 
                type="email" 
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Password *</label>
              <input 
                type="password" 
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:border-[#f4d300] focus:outline-none transition-colors"
                placeholder="Create a password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-[#f4d300] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#ffe133] transition-colors mt-8">
              <UserPlus size={20} /> Create Profile
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerAuth;
