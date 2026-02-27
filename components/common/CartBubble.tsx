
import React from 'react';
import { useApp } from '../../store';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { UnitType } from '../../types';

const CartBubble: React.FC = () => {
  const { cart } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show if empty, on cart page, or in admin/driver/pos areas
  if (cart.length === 0) return null;
  if (location.pathname === '/cart') return null;
  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname.startsWith('/driver')) return null;
  if (location.pathname.startsWith('/pos')) return null;

  // Calculate totals
  const itemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const calculateItemPrice = (item: any) => {
    if (item.product.unit === UnitType.KG && item.weight) {
      return (item.product.price / 1000) * item.weight * item.quantity;
    }
    return item.product.price * item.quantity;
  };

  const totalPrice = cart.reduce((acc, item) => acc + calculateItemPrice(item), 0);

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:bottom-8 sm:right-8 z-[150] animate-in slide-in-from-bottom-10 fade-in">
      <button
        onClick={() => navigate('/cart')}
        className="w-full sm:w-auto bg-[#f4d300] text-black pl-5 pr-6 py-4 rounded-full shadow-[0_0_30px_rgba(244,211,0,0.5)] active:scale-95 transition-all duration-300 flex items-center justify-between sm:justify-start gap-4 group border-2 border-black"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShoppingCart size={24} strokeWidth={2.5} />
            <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-[#f4d300] animate-bounce">
              {itemCount}
            </span>
          </div>
          
          <div className="flex flex-col items-start leading-none">
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Total</span>
            <span className="text-sm font-bold tracking-tight">R{totalPrice.toFixed(0)}</span>
          </div>
        </div>

        <div className="w-8 h-8 bg-black/10 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-[#f4d300] transition-colors ml-1">
          <ArrowRight size={14} strokeWidth={3} />
        </div>
      </button>
    </div>
  );
};

export default CartBubble;
