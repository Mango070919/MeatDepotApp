
import React from 'react';
import { Home, ShoppingBag, ClipboardList, User, LogIn, UserPlus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../store';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useApp();

  const isActive = (path: string) => location.pathname === path;

  const navItems = currentUser ? [
    { label: 'HOME', icon: Home, path: '/' },
    { label: 'SHOP', icon: ShoppingBag, path: '/shop' },
    { label: 'ORDERS', icon: ClipboardList, path: '/orders' },
    { label: 'ME', icon: User, path: '/account' },
  ] : [
    { label: 'HOME', icon: Home, path: '/' },
    { label: 'SHOP', icon: ShoppingBag, path: '/shop' },
    { label: 'SIGN IN', icon: LogIn, path: '/login' },
    { label: 'JOIN', icon: UserPlus, path: '/signup' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/95 glass border-t border-white/5 flex justify-around items-center pt-2 pb-6 px-4 z-50 md:hidden shadow-[0_-10px_30px_rgb(0,0,0,0.5)]">
      {navItems.map((item) => (
        <button
          key={item.path}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1.5 transition-all duration-300 w-16 ${
            isActive(item.path) ? 'text-[#f4d300]' : 'text-white/40'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${isActive(item.path) ? 'bg-[#f4d300]/10' : ''}`}>
            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 1.5} />
          </div>
          <span className={`text-[9px] font-bold tracking-widest ${isActive(item.path) ? 'opacity-100' : 'opacity-70'}`}>
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
