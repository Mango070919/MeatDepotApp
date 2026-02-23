
import React, { useState } from 'react';
import { useApp } from '../../store';
import { ClipboardList, Clock, MapPin, MessageCircle, Package, ArrowRight, X, Store, ArrowLeft, Navigation, Truck, Loader2 } from 'lucide-react';
import { OrderStatus, OrderMessage } from '../../types';
import { useNavigate } from 'react-router-dom';

const Orders: React.FC = () => {
  const { orders, currentUser, updateOrder } = useApp();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const navigate = useNavigate();

  const myOrders = orders.filter(o => o.customerId === currentUser?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
        return { text: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' };
      case OrderStatus.OUT_FOR_DELIVERY:
        return { text: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
      case OrderStatus.READY_FOR_DELIVERY:
        return { text: 'text-[#f4d300]', bg: 'bg-[#f4d300]/10', border: 'border-[#f4d300]/20' };
      case OrderStatus.RECEIVED:
        return { text: 'text-green-200', bg: 'bg-green-900/20', border: 'border-green-800/30' };
      default:
        return { text: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
    }
  };

  const handleSendMessage = (orderId: string) => {
      if (!chatMessage.trim()) return;
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const newMessage: OrderMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'CUSTOMER',
          text: chatMessage,
          timestamp: new Date().toISOString()
      };
      
      updateOrder(orderId, { messages: [...order.messages, newMessage] });
      setChatMessage('');
  };

  if (myOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-8 text-center px-4 bg-black -mx-4 flex-grow">
        <div className="w-40 h-40 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
          <ClipboardList size={80} strokeWidth={1} />
        </div>
        <div className="space-y-3">
          <h2 className="brand-font text-4xl font-bold italic text-white">No Orders Yet</h2>
          <p className="text-white/40 font-medium max-w-xs mx-auto">When you place an order, its journey will be tracked here.</p>
        </div>
        <button 
          onClick={() => navigate('/shop')}
          className="bg-[#f4d300] text-black px-12 py-5 rounded-full font-bold text-xs tracking-widest shadow-2xl shadow-[#f4d300]/20 hover:scale-105 transition-all uppercase"
        >
          START SHOPPING
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in slide-in-from-bottom duration-700 bg-black -mx-4 px-6 pt-6">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/account')} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="brand-font text-5xl font-bold italic text-white">Order History</h1>
          <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Track your premium cuts</p>
        </div>
      </div>

      <div className="space-y-6">
        {myOrders.map(order => {
          const statusInfo = getStatusInfo(order.status);
          const hasTracking = order.status === OrderStatus.OUT_FOR_DELIVERY && order.trackingUrl;
          
          return (
            <div 
              key={order.id} 
              className="bg-[#121212] p-8 rounded-[40px] border border-white/5 space-y-6 group hover:border-[#f4d300]/30 transition-all shadow-2xl"
            >
              <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Order #{order.id}</p>
                  <p className="text-sm font-medium text-white/60">{new Date(order.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className={`px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border ${statusInfo.text} ${statusInfo.bg} ${statusInfo.border}`}>
                  {order.status}
                </div>
              </div>

              <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-2 px-2">
                {order.items.map(item => (
                  <img key={item.productId} src={item.product.image} className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-white/10" alt={item.product.name} />
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-white/10">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/40 text-xs font-bold uppercase">Total:</span>
                  <span className="text-3xl font-bold text-[#f4d300] tracking-tighter">R{order.total}</span>
                </div>
                
                {hasTracking ? (
                    <button 
                      onClick={() => window.open(order.trackingUrl, '_blank')}
                      className="bg-blue-600 text-white px-6 py-4 rounded-2xl flex items-center gap-2 text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-105 transition-all animate-pulse"
                    >
                        <Navigation size={16} /> Live Track
                    </button>
                ) : (
                    <button 
                      onClick={() => setSelectedOrder(order.id)}
                      className="bg-white/5 px-8 py-4 rounded-2xl flex items-center gap-2 text-sm font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      Details <ArrowRight size={16} />
                    </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/95 glass z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-[#121212] w-full max-w-lg rounded-t-[50px] sm:rounded-[50px] border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col">
            {orders.filter(o => o.id === selectedOrder).map(order => {
              // Exclude MANUAL_SALE from the visual timeline for cleanliness
              const allStatuses = Object.values(OrderStatus).filter(s => s !== OrderStatus.MANUAL_SALE);
              const currentStatusIndex = allStatuses.findIndex(s => s === order.status);
              const isOutForDelivery = order.status === OrderStatus.OUT_FOR_DELIVERY;

              return (
                <div key={order.id} className="p-10 space-y-10 flex-1 overflow-y-auto">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="brand-font text-3xl font-bold italic text-white">Tracking Details</h2>
                      <p className="text-white/40 text-[10px] font-bold tracking-[0.4em] uppercase">Order #{order.id}</p>
                    </div>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-white/5 text-white/50 hover:text-white rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Status Timeline</p>
                    <div className="flex flex-col">
                      {allStatuses.map((status, index) => {
                        const isActive = index <= currentStatusIndex;
                        return (
                          <div key={status} className="flex gap-6 items-stretch relative">
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 shrink-0 ${isActive ? 'bg-[#f4d300] text-black' : 'bg-white/10 text-white/30'}`}>
                                <Package size={16} strokeWidth={3} />
                              </div>
                              {index < allStatuses.length - 1 && (
                                <div className={`w-1 h-full ${isActive && index < currentStatusIndex ? 'bg-[#f4d300]' : 'bg-white/10'}`}></div>
                              )}
                            </div>
                            <div className={`pb-8 pt-1 ${isActive ? 'text-white' : 'text-white/40'}`}>
                              <p className="font-bold text-sm uppercase tracking-widest">{status}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                     <div className="flex gap-4">
                      <div className="bg-black/20 p-3 rounded-2xl shrink-0 text-white/50"><Clock size={20} /></div>
                      <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Timeline</p>
                        <p className="text-sm font-medium text-white/80">Placed on {new Date(order.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="bg-black/20 p-3 rounded-2xl shrink-0 text-white/50">{order.deliveryType === 'DELIVERY' ? <MapPin size={20}/> : <Store size={20}/>}</div>
                      <div>
                        <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Type</p>
                        <p className="text-sm font-medium text-white/80">{order.deliveryType === 'DELIVERY' ? `Delivery to: ${order.deliveryAddress}` : 'Collection at Meat Depot'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Live Tracking Button */}
                  {order.status === OrderStatus.OUT_FOR_DELIVERY && order.trackingUrl && (
                      <a 
                        href={order.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-3xl font-bold text-xs tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all uppercase animate-pulse"
                      >
                          <Navigation size={22} />
                          Track Driver Location
                      </a>
                  )}

                  {/* Chat Section */}
                  <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                    <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                        {isOutForDelivery ? <Truck size={16}/> : <MessageCircle size={16}/>}
                        {isOutForDelivery ? 'Driver Chat' : 'Support Messages'}
                    </h4>
                    
                    <div className="space-y-3 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                        {order.messages.length > 0 ? order.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'CUSTOMER' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${msg.sender === 'CUSTOMER' ? 'bg-[#f4d300] text-black rounded-br-none' : 'bg-white/10 text-white rounded-bl-none'}`}>
                                  {msg.sender === 'DRIVER' && <span className="block text-[8px] font-bold opacity-70 mb-1">DRIVER</span>}
                                  {msg.text}
                              </div>
                          </div>
                        )) : (
                          <p className="text-center text-xs text-white/20 italic">No messages yet.</p>
                        )}
                    </div>

                    {isOutForDelivery && (
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:ring-1 focus:ring-[#f4d300]"
                                placeholder="Message driver..."
                                value={chatMessage}
                                onChange={e => setChatMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage(order.id)}
                            />
                            <button onClick={() => handleSendMessage(order.id)} className="bg-[#f4d300] text-black p-3 rounded-xl hover:bg-white transition-colors">
                                <ArrowRight size={18} />
                            </button>
                        </div>
                    )}
                  </div>

                  <button 
                    onClick={() => window.open(`https://wa.me/27632148131?text=Query about order ${order.id}`, '_blank')}
                    className="w-full flex items-center justify-center gap-3 bg-white/10 text-white py-5 rounded-3xl font-bold text-xs tracking-widest hover:bg-white/20 transition-all uppercase"
                  >
                    Chat on WhatsApp
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
