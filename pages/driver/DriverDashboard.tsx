
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import { OrderStatus, Order, OrderMessage } from '../../types';
import { Truck, MapPin, CheckCircle, Navigation, MessageCircle, LogOut, RefreshCw, X, Send, Phone, Package, Undo2, Radar, Link as LinkIcon, Save, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DriverDashboard: React.FC = () => {
  const { orders, updateOrder, users, logout, currentUser, syncToSheet } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'AVAILABLE' | 'MY_ACTIVE' | 'HISTORY'>('AVAILABLE');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  
  // Tracking State
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null);
  const trackingInterval = useRef<number | null>(null);
  const [isSyncingLocation, setIsSyncingLocation] = useState(false);
  const [editTrackingId, setEditTrackingId] = useState<string | null>(null);
  const [manualLinkInput, setManualLinkInput] = useState('');

  // 1. Available Orders (Pool)
  const availableOrders = orders.filter(o => 
    o.deliveryType === 'DELIVERY' && 
    o.status === OrderStatus.READY_FOR_DELIVERY
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // 2. My Active Orders
  const myActiveOrders = orders.filter(o => 
    o.deliveryType === 'DELIVERY' && 
    o.status === OrderStatus.OUT_FOR_DELIVERY &&
    (o.driverId === currentUser?.id)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 3. My History
  const myHistoryOrders = orders.filter(o => 
    o.deliveryType === 'DELIVERY' && 
    o.status === OrderStatus.DELIVERED &&
    (o.driverId === currentUser?.id)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Cleanup tracking on unmount
  useEffect(() => {
      return () => {
          if (trackingInterval.current) window.clearInterval(trackingInterval.current);
      };
  }, []);

  const getStatusMessage = (status: OrderStatus, customerName: string, orderId: string) => {
      const firstName = customerName.split(' ')[0];
      const id = orderId.substring(0, 5);
      
      switch (status) {
          case OrderStatus.OUT_FOR_DELIVERY:
              return `Hi ${firstName}, good news! Your Meat Depot order #${id} is on the way to you now. 🚚`;
          case OrderStatus.DELIVERED:
              return `Hi ${firstName}, your order #${id} has been delivered. Enjoy the premium cuts! Please let us know if you need anything else.`;
          default:
              return `Hi ${firstName}, there is an update on your Meat Depot order #${id}: ${status}.`;
      }
  };

  const notifyCustomerWhatsApp = (order: Order, status: OrderStatus) => {
      const customer = users.find(u => u.id === order.customerId);
      if (customer && customer.phone) {
          let phone = customer.phone.replace(/\s+/g, '').replace(/-/g, '');
          if (phone.startsWith('0')) phone = '27' + phone.substring(1);
          
          const message = getStatusMessage(status, order.customerName, order.id);
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      }
  };

  const handleShareTracking = (order: Order) => {
      if (!order.trackingUrl) {
          alert("No tracking link set yet. Start tracking or add a link manually first.");
          return;
      }
      const customer = users.find(u => u.id === order.customerId);
      if (customer && customer.phone) {
          let phone = customer.phone.replace(/\s+/g, '').replace(/-/g, '');
          if (phone.startsWith('0')) phone = '27' + phone.substring(1);
          
          const message = `Hi ${order.customerName.split(' ')[0]}, track your order live here: ${order.trackingUrl}`;
          const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          window.open(url, '_blank');
      } else {
          alert("Customer phone number not found.");
      }
  };

  const handleClaimOrder = (orderId: string) => {
      if (!currentUser) return;
      const order = orders.find(o => o.id === orderId);
      if (order) {
          updateOrder(orderId, { 
              status: OrderStatus.OUT_FOR_DELIVERY,
              driverId: currentUser.id 
          });
          syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.OUT_FOR_DELIVERY, driverId: currentUser.id } : o) });
          
          if (window.confirm("Notify customer via WhatsApp?")) {
              notifyCustomerWhatsApp(order, OrderStatus.OUT_FOR_DELIVERY);
          }
      }
      setActiveTab('MY_ACTIVE');
  };

  const handleCompleteDelivery = (orderId: string) => {
      // Stop tracking if active on this order
      if (trackingOrderId === orderId) handleToggleTracking(orderId);

      updateOrder(orderId, { status: OrderStatus.DELIVERED });
      syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.DELIVERED } : o) });

      const order = orders.find(o => o.id === orderId);
      if (order && window.confirm("Notify customer via WhatsApp?")) {
          notifyCustomerWhatsApp(order, OrderStatus.DELIVERED);
      }
      if (selectedOrder?.id === orderId) setSelectedOrder(null);
  };

  const handleReturnToDepot = (orderId: string) => {
      if (trackingOrderId === orderId) handleToggleTracking(orderId);
      
      if(window.confirm("Return this order to the depot queue?")) {
          updateOrder(orderId, { 
              status: OrderStatus.READY_FOR_DELIVERY,
              driverId: undefined 
          });
          syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, status: OrderStatus.READY_FOR_DELIVERY, driverId: undefined } : o) });
          if (selectedOrder?.id === orderId) setSelectedOrder(null);
      }
  };

  const handleToggleTracking = (orderId: string) => {
      // Stop Tracking
      if (trackingOrderId === orderId) {
          if (trackingInterval.current) window.clearInterval(trackingInterval.current);
          trackingInterval.current = null;
          setTrackingOrderId(null);
          setIsSyncingLocation(false);
          return;
      }

      // Start Tracking
      if (!navigator.geolocation) {
          alert("Geolocation is not supported by your browser.");
          return;
      }

      // If tracking another order, stop it first
      if (trackingOrderId) {
          if (trackingInterval.current) window.clearInterval(trackingInterval.current);
      }

      setTrackingOrderId(orderId);
      alert("Live Tracking Started. Location will update every 60 seconds.");

      const pushLocation = () => {
          setIsSyncingLocation(true);
          navigator.geolocation.getCurrentPosition(
              (pos) => {
                  const { latitude, longitude } = pos.coords;
                  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
                  
                  // Optimistically update local state
                  updateOrder(orderId, { trackingUrl: url });
                  
                  // Fire-and-forget sync to cloud (so customer sees it)
                  const updatedOrders = orders.map(o => o.id === orderId ? { ...o, trackingUrl: url } : o);
                  syncToSheet({ orders: updatedOrders }).finally(() => setIsSyncingLocation(false));
              },
              (err) => {
                  console.error("GPS Error", err);
                  setIsSyncingLocation(false);
              },
              { enableHighAccuracy: true }
          );
      };

      pushLocation(); // Immediate update
      trackingInterval.current = window.setInterval(pushLocation, 60000); // Update every 60s
  };

  const saveManualLink = (orderId: string) => {
      if (!manualLinkInput) return;
      updateOrder(orderId, { trackingUrl: manualLinkInput });
      syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, trackingUrl: manualLinkInput } : o) });
      setEditTrackingId(null);
      setManualLinkInput('');
  };

  const handleSendMessage = () => {
      if (!chatMessage.trim() || !selectedOrder) return;
      const newMessage: OrderMessage = {
          id: Math.random().toString(36).substr(2, 9),
          sender: 'DRIVER',
          text: chatMessage,
          timestamp: new Date().toISOString()
      };
      const updatedMsgs = [...selectedOrder.messages, newMessage];
      updateOrder(selectedOrder.id, { messages: updatedMsgs });
      syncToSheet({ orders: orders.map(o => o.id === selectedOrder.id ? { ...o, messages: updatedMsgs } : o) });
      
      setChatMessage('');
      setSelectedOrder({ ...selectedOrder, messages: updatedMsgs });
  };

  const handleLogout = () => {
      logout();
      navigate('/login');
  };

  const renderOrderList = (ordersToRender: Order[], type: 'AVAILABLE' | 'MY_ACTIVE' | 'HISTORY') => {
      if (ordersToRender.length === 0) {
          return (
              <div className="text-center py-20 text-gray-400 flex flex-col items-center">
                  <Truck size={48} className="mb-4 opacity-20" />
                  <p>No orders in this list.</p>
              </div>
          );
      }

      return ordersToRender.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4 relative overflow-hidden transition-all hover:shadow-md">
              {type === 'MY_ACTIVE' && (
                  <div className={`absolute top-0 left-0 w-1 h-full ${trackingOrderId === order.id ? 'bg-green-500 animate-pulse' : 'bg-[#f4d300]'}`}></div>
              )}
              <div className="flex justify-between items-start">
                  <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{order.id}</span>
                      <h3 className="font-bold text-gray-900 text-lg">{order.customerName}</h3>
                      <p className="text-xs text-gray-500 max-w-[200px]">{order.deliveryAddress}</p>
                  </div>
                  <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          order.status === OrderStatus.OUT_FOR_DELIVERY ? 'bg-blue-100 text-blue-700' : 
                          order.status === OrderStatus.READY_FOR_DELIVERY ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                          {order.status.replace(/_/g, ' ')}
                      </span>
                      {order.distanceKm && <p className="text-[10px] text-gray-400 mt-1 font-bold">{order.distanceKm.toFixed(1)} km</p>}
                  </div>
              </div>

              {/* Items Summary */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {order.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shrink-0">
                          <span className="text-[10px] font-bold text-gray-600">
                              {item.quantity}x {item.product.name}
                          </span>
                      </div>
                  ))}
              </div>

              {/* Actions based on Tab */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                  {type === 'AVAILABLE' && (
                      <button 
                        onClick={() => handleClaimOrder(order.id)}
                        className="col-span-2 bg-[#f4d300] text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg"
                      >
                          <Truck size={16} /> Accept Delivery
                      </button>
                  )}
                  
                  {type === 'MY_ACTIVE' && (
                      <>
                        <div className="col-span-2 flex gap-2">
                            {editTrackingId === order.id ? (
                                <div className="flex-1 flex gap-2 animate-in fade-in">
                                    <input 
                                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 text-xs outline-none focus:border-[#f4d300]"
                                        placeholder="Paste Link (WhatsApp Location...)"
                                        value={manualLinkInput}
                                        onChange={e => setManualLinkInput(e.target.value)}
                                    />
                                    <button onClick={() => saveManualLink(order.id)} className="bg-green-600 text-white p-2 rounded-xl"><Save size={16}/></button>
                                    <button onClick={() => setEditTrackingId(null)} className="bg-gray-200 text-gray-600 p-2 rounded-xl"><X size={16}/></button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => handleToggleTracking(order.id)}
                                    className={`flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                        trackingOrderId === order.id 
                                        ? 'bg-green-600 text-white shadow-lg animate-pulse' 
                                        : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-green-500 hover:text-green-600'
                                    }`}
                                >
                                    {isSyncingLocation ? <RefreshCw size={16} className="animate-spin"/> : <Radar size={16} />}
                                    {trackingOrderId === order.id ? 'Tracking ON' : 'Start Tracking'}
                                </button>
                            )}
                            
                            {!editTrackingId && (
                                <button onClick={() => { setEditTrackingId(order.id); setManualLinkInput(order.trackingUrl || ''); }} className="bg-gray-100 text-gray-500 p-3 rounded-xl hover:bg-gray-200" title="Edit Link Manually">
                                    <LinkIcon size={16}/>
                                </button>
                            )}
                        </div>
                        
                        {/* New: Share Tracking Link Button */}
                        <button 
                            onClick={() => handleShareTracking(order)}
                            className="col-span-2 bg-[#f4d300] text-black py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                        >
                            <Share2 size={16} /> Share Link
                        </button>

                        <button 
                            onClick={() => setSelectedOrder(order)}
                            className="bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={16} /> Chat
                        </button>
                        <button 
                            onClick={() => {
                                if (order.deliveryCoordinates) {
                                    window.open(`https://maps.google.com/?q=${order.deliveryCoordinates.lat},${order.deliveryCoordinates.lng}`, '_blank');
                                } else {
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress || '')}`, '_blank');
                                }
                            }}
                            className="bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                            <Navigation size={16} /> Map
                        </button>
                        <button 
                            onClick={() => handleReturnToDepot(order.id)}
                            className="text-red-400 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
                        >
                            <Undo2 size={14} /> Return
                        </button>
                        <button 
                            onClick={() => handleCompleteDelivery(order.id)}
                            className="bg-green-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:bg-green-700"
                        >
                            <CheckCircle size={16} /> Delivered
                        </button>
                      </>
                  )}

                  {type === 'HISTORY' && (
                      <div className="col-span-2 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 py-2 rounded-lg">
                          Completed {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                  )}
              </div>
          </div>
      ));
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Truck className="text-[#f4d300]" />
                Driver Portal
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{currentUser?.name}</p>
        </div>
        <button onClick={handleLogout} className="p-3 bg-gray-50 rounded-full hover:bg-red-50 hover:text-red-600 transition-colors">
            <LogOut size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-white rounded-2xl border border-gray-100">
          <button 
            onClick={() => setActiveTab('AVAILABLE')}
            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'AVAILABLE' ? 'bg-[#f4d300] text-black shadow-sm' : 'text-gray-400'}`}
          >
              Pool ({availableOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('MY_ACTIVE')}
            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'MY_ACTIVE' ? 'bg-[#f4d300] text-black shadow-sm' : 'text-gray-400'}`}
          >
              Active ({myActiveOrders.length})
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-[#f4d300] text-black shadow-sm' : 'text-gray-400'}`}
          >
              History
          </button>
      </div>

      {/* Order List Container */}
      <div className="space-y-4">
          {renderOrderList(
              activeTab === 'AVAILABLE' ? availableOrders : 
              activeTab === 'MY_ACTIVE' ? myActiveOrders : myHistoryOrders, 
              activeTab
          )}
      </div>

      {/* Driver Chat Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 bg-black/80 z-[200] flex flex-col animate-in slide-in-from-bottom">
              <div className="bg-white flex-1 mt-20 rounded-t-[40px] flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <div>
                          <h3 className="font-bold text-lg">{selectedOrder.customerName}</h3>
                          <p className="text-xs text-gray-500">Order #{selectedOrder.id}</p>
                      </div>
                      <button onClick={() => setSelectedOrder(null)} className="p-2 bg-gray-200 rounded-full text-gray-500">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50">
                      {selectedOrder.messages.length === 0 && (
                          <div className="text-center text-gray-400 text-xs py-10">Start chatting with the customer...</div>
                      )}
                      {selectedOrder.messages.map(msg => (
                          <div key={msg.id} className={`flex ${msg.sender === 'DRIVER' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${msg.sender === 'DRIVER' ? 'bg-[#f4d300] text-black rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}`}>
                                  {msg.text}
                                  <p className="text-[9px] opacity-50 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="p-4 bg-white border-t border-gray-100">
                      <div className="flex gap-2">
                          <input 
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900"
                            placeholder="Message customer..."
                            value={chatMessage}
                            onChange={e => setChatMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          />
                          <button onClick={handleSendMessage} className="bg-black text-[#f4d300] p-3 rounded-xl">
                              <Send size={20} />
                          </button>
                      </div>
                      <div className="flex gap-2 mt-2 justify-center">
                          <button 
                            onClick={() => setChatMessage("I'm outside!")}
                            className="text-[10px] font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                          >
                              "I'm outside!"
                          </button>
                          <button 
                            onClick={() => setChatMessage("5 minutes away.")}
                            className="text-[10px] font-bold bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200"
                          >
                              "5 mins away"
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DriverDashboard;
