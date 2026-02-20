
import { ShoppingCart, User, MessageSquare, Menu, X, Home, ShoppingBag, ClipboardList, LogIn, UserPlus, LogOut, ArrowRight, Globe, Settings, Cloud, RefreshCw, Heart, ArrowUp, ArrowDown, Shield, LayoutDashboard, ExternalLink, FileText, HelpCircle, Package, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UserRole, AppConfig, User as UserType } from '../../types';

const MENU_ITEMS_MAP: Record<string, { path: string; icon: React.ElementType; label: string; badge?: boolean; roles?: UserRole[] }> = {
    admin: { path: '/admin', icon: Settings, label: 'Edit App', roles: [UserRole.ADMIN] },
    home: { path: '/', icon: Home, label: 'Home' },
    shop: { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    quote: { path: '/request-quote', icon: FileText, label: 'Request Quote' },
    orders: { path: '/orders', icon: ClipboardList, label: 'My Orders' },
    messages: { path: '/messages', icon: MessageSquare, label: 'Messages' },
    account: { path: '/account', icon: User, label: 'My Account' },
    cart: { path: '/cart', icon: ShoppingCart, label: 'Basket', badge: true },
    wishlist: { path: '/shop?category=Favorites', icon: Heart, label: 'My Wishlist' },
    tutorial: { path: '/tutorial', icon: HelpCircle, label: 'Help & Guide' }
};

interface MenuLinkItemProps {
    itemKey: string;
    index: number;
    total: number;
    currentUser: UserType | null;
    cartItemCount: number;
    onClose: () => void;
    onMoveItem: (index: number, direction: 'up' | 'down') => void;
}

const MenuLinkItem: React.FC<MenuLinkItemProps> = ({ itemKey, index, total, currentUser, cartItemCount, onClose, onMoveItem }) => {
    const item = MENU_ITEMS_MAP[itemKey];
    if (!item) return null;
    if (item.roles && (!currentUser || !item.roles.includes(currentUser.role))) return null;

    const badgeCount = item.badge ? cartItemCount : 0;
    const isAdmin = currentUser?.role === UserRole.ADMIN;

    return (
      <div className="flex items-center gap-2 group">
        {isAdmin && (
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onMoveItem(index, 'up')} disabled={index === 0} className="text-[#f4d300] hover:text-white disabled:opacity-20"><ArrowUp size={14}/></button>
                <button onClick={() => onMoveItem(index, 'down')} disabled={index === total - 1} className="text-[#f4d300] hover:text-white disabled:opacity-20"><ArrowDown size={14}/></button>
            </div>
        )}
        <Link 
          to={item.path} 
          onClick={onClose}
          className="flex items-center justify-between w-full text-left text-white/70 hover:text-white hover:bg-white/5 p-5 rounded-2xl transition-all duration-300"
        >
          <div className="flex items-center gap-5">
            <item.icon size={22} strokeWidth={1.5} className="text-[#f4d300]"/>
            <span className="font-bold text-xl tracking-wider uppercase">{item.label}</span>
          </div>
          <div className="flex items-center gap-4">
            {badgeCount > 0 && (
                <span className="bg-[#f4d300] text-black text-[10px] font-bold px-2 py-1 rounded-full">{badgeCount}</span>
            )}
            <ArrowRight size={20} className="text-white/20 group-hover:text-[#f4d300] transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>
    );
};

const Navbar: React.FC = () => {
  const { currentUser, cart, config, logout, isCloudSyncing, updateConfig, syncToSheet } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
    navigate('/login');
  };

  const handleSync = async () => {
      try {
          await syncToSheet();
          alert("System State Redeployed successfully.");
      } catch (e) {
          alert("Redeploy failed: " + e);
      }
  };

  useEffect(() => {
    if (isAdminRoute) return;

    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
            setIsVisible(false);
        } else {
            setIsVisible(true);
        }
        setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, location.pathname, isAdminRoute]);

  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const activeMenuOrder = config.menuOrder || ['admin', 'home', 'shop', 'quote', 'orders', 'messages', 'account', 'cart', 'wishlist'];

  // Ensure 'quote' and 'tutorial' are in the menu order if missing (migration)
  if (!activeMenuOrder.includes('quote')) {
      activeMenuOrder.splice(2, 0, 'quote');
  }
  if (!activeMenuOrder.includes('tutorial')) {
      activeMenuOrder.push('tutorial');
  }

  const moveItem = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...activeMenuOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newOrder.length) {
          [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
          updateConfig({ ...config, menuOrder: newOrder });
      }
  };

  // Specialized Admin Navbar View
  if (isAdminRoute) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const currentPageName = pathParts[pathParts.length - 1] || 'Dashboard';
    
    const adminTabs = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dash' },
        { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },
        { path: '/admin/products', icon: Package, label: 'Items' },
        { path: '/admin/customers', icon: Users, label: 'Users' }
    ];

    return (
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-[100] px-4 py-3 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-6">
          <div 
            className="flex items-center cursor-pointer hover:opacity-70 transition-opacity" 
            onClick={() => navigate('/')}
          >
            <img src={config.logoUrl} alt="Meat Depot" className="h-14 w-auto object-contain" />
          </div>
          <div className="hidden md:flex items-center gap-2">
              <div className="w-[1px] h-6 bg-gray-200 mr-2"></div>
              {adminTabs.map(tab => (
                  <button
                    key={tab.path}
                    onClick={() => navigate(tab.path)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${location.pathname === tab.path ? 'bg-gray-100 text-black' : 'text-gray-400 hover:text-black hover:bg-gray-50'}`}
                  >
                      <tab.icon size={14} />
                      {tab.label}
                  </button>
              ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
            {/* Mobile Admin Menu Trigger (could elaborate later, for now sticking to desktop focused admin) */}
            
            <button 
                onClick={handleSync}
                disabled={isCloudSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-green-600/20 disabled:opacity-50 transition-all"
            >
                {isCloudSyncing ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                <span className="hidden sm:inline">Redeploy</span>
            </button>

            <div className="w-[1px] h-8 bg-gray-100 mx-1"></div>

            <button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
            >
                <Home size={14} />
                <span className="hidden sm:inline">Exit</span>
            </button>

            <button 
                onClick={handleLogout}
                className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors"
                title="Sign Out"
            >
                <LogOut size={20} />
            </button>
        </div>
      </nav>
    );
  }

  // Standard Customer Navbar View
  return (
    <>
      <nav 
        className={`bg-black sticky top-0 z-[60] px-4 py-2 flex items-center justify-between border-b border-white/5 shadow-2xl transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div 
          className="flex items-center cursor-pointer transition-all active:scale-95 group" 
          onClick={() => navigate('/')}
        >
          <img 
            src={config.logoUrl} 
            alt="Meat Depot Logo" 
            className="h-24 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {config.googleDrive?.accessToken && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${isCloudSyncing ? 'bg-[#f4d300]/10 border-[#f4d300]/30 text-[#f4d300]' : 'bg-white/5 border-white/10 text-white/20'}`} title={isCloudSyncing ? "Syncing..." : "Cloud Connected"}>
                {isCloudSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Cloud size={12} />}
                <span className="text-[8px] font-bold uppercase tracking-widest hidden sm:inline">
                    {isCloudSyncing ? 'Syncing' : 'Cloud'}
                </span>
            </div>
          )}

          <button 
            onClick={() => navigate('/cart')}
            className="relative w-9 h-9 bg-[#f4d300] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#f4d300]/20"
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-black text-[#f4d300] text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#f4d300] animate-in zoom-in duration-300">
                {itemCount}
              </span>
            )}
          </button>

          <a 
            href="https://wa.me/844012488038318" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-9 h-9 bg-[#f4d300] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#f4d300]/20"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.634 1.437h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </a>

          <a 
            href="https://meatdepot.co.za" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-9 h-9 bg-[#f4d300] text-black rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg shadow-[#f4d300]/20"
          >
            <Globe size={18} strokeWidth={2.5} />
          </a>

          <button 
            onClick={() => navigate(currentUser ? '/account' : '/login')}
            className={`w-9 h-9 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg ${
                currentUser 
                ? 'bg-white text-black shadow-white/20' 
                : 'bg-[#f4d300] text-black shadow-[#f4d300]/20'
            }`}
          >
            <User size={18} strokeWidth={2.5} />
          </button>

          <button 
            onClick={() => setIsMenuOpen(true)} 
            className="p-3 text-white/50 hover:text-[#f4d300] transition-colors rounded-full hover:bg-white/5"
          >
            <Menu size={24} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 bg-black/95 glass z-[110] p-6 flex flex-col animate-in fade-in duration-500">
          <div className="flex items-center justify-between pb-6">
            <div onClick={() => { setIsMenuOpen(false); navigate('/'); }} className="cursor-pointer active:scale-95 transition-transform">
                <img src={config.logoUrl} alt="Meat Depot Logo" className="h-20 w-auto object-contain" />
            </div>
            <button onClick={() => setIsMenuOpen(false)} className="p-3 text-white/50 hover:text-[#f4d300] transition-colors rounded-full hover:bg-white/5">
              <X size={24} strokeWidth={2.5} />
            </button>
          </div>
          
          <nav className="flex-1 flex flex-col justify-between overflow-y-auto no-scrollbar">
            <div className="space-y-3">
              {currentUser ? (
                <>
                  {activeMenuOrder.map((key, index) => (
                      <MenuLinkItem 
                        key={key} 
                        itemKey={key} 
                        index={index} 
                        total={activeMenuOrder.length} 
                        currentUser={currentUser}
                        cartItemCount={itemCount}
                        onClose={() => setIsMenuOpen(false)}
                        onMoveItem={moveItem}
                      />
                  ))}
                </>
              ) : (
                <>
                  <MenuLinkItem itemKey="home" index={0} total={3} currentUser={null} cartItemCount={0} onClose={() => setIsMenuOpen(false)} onMoveItem={() => {}} />
                  <MenuLinkItem itemKey="shop" index={1} total={3} currentUser={null} cartItemCount={0} onClose={() => setIsMenuOpen(false)} onMoveItem={() => {}} />
                  <Link 
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between w-full text-left text-white/70 hover:text-white hover:bg-white/5 p-5 rounded-2xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-5">
                        <LogIn size={22} strokeWidth={1.5} className="text-[#f4d300]"/>
                        <span className="font-bold text-xl tracking-wider uppercase">Sign In</span>
                    </div>
                    <ArrowRight size={20} className="text-white/20 group-hover:text-[#f4d300] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link 
                    to="/signup"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between w-full text-left text-white/70 hover:text-white hover:bg-white/5 p-5 rounded-2xl transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-5">
                        <UserPlus size={22} strokeWidth={1.5} className="text-[#f4d300]"/>
                        <span className="font-bold text-xl tracking-wider uppercase">Create Account</span>
                    </div>
                    <ArrowRight size={20} className="text-white/20 group-hover:text-[#f4d300] transition-transform group-hover:translate-x-1" />
                  </Link>
                </>
              )}
            </div>
            {currentUser && (
              <button 
                onClick={handleLogout}
                className="w-full bg-white/5 text-white/50 py-5 rounded-2xl font-bold text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 hover:text-white transition-colors uppercase mt-6"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  );
};

export default Navbar;
