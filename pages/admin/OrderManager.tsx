
import React, { useState } from 'react';
import { useApp } from '../../store';
import { ShoppingBag, ArrowLeft, MessageSquare, Truck, Package, CheckCircle, Clock, MapPin, Navigation, User as UserIcon, Save, FileText, X, Calculator, Download, Map as MapIcon, Home, LayoutDashboard, Quote, Bell, Paperclip, Check, Loader2, Trash2 } from 'lucide-react';
import { OrderStatus, UnitType, Order, OrderMessage } from '../../types';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../../services/storageService';

const OrderManager: React.FC = () => {
  const { orders, updateOrder, users, config, deleteOrder, syncToSheet } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [trackingLinkInput, setTrackingLinkInput] = useState('');
  const [editingTrackingId, setEditingTrackingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [isUploading, setIsUploading] = useState(false);
  
  const navigate = useNavigate();

  const getStatusMessage = (status: OrderStatus, customerName: string, orderId: string, deliveryType: string) => {
      const firstName = customerName.split(' ')[0];
      const id = orderId.substring(0, 5);
      
      switch (status) {
          case OrderStatus.PENDING:
              return `Hi ${firstName}, thanks for your order #${id} at Meat Depot. We have received it and will confirm shortly.`;
          case OrderStatus.RECEIVED:
              return `Hi ${firstName}, your Meat Depot order #${id} has been confirmed and added to our production queue. 🥩`;
          case OrderStatus.PREPARING:
              return `Hi ${firstName}, our butchers are currently cutting and packing your order #${id}. Freshness guaranteed! 🔪`;
          case OrderStatus.READY_FOR_DELIVERY:
              return deliveryType === 'COLLECTION' 
                ? `Hi ${firstName}, your Meat Depot order #${id} is ready for collection at 63 Clarence Road, Westering. See you soon!`
                : `Hi ${firstName}, your order #${id} is packed and ready. We are looking for a driver now.`;
          case OrderStatus.OUT_FOR_DELIVERY:
              return `Hi ${firstName}, good news! Your Meat Depot order #${id} is on the way to you now. 🚚`;
          case OrderStatus.DELIVERED:
              return `Hi ${firstName}, your order #${id} has been delivered. Enjoy the premium cuts! Please let us know if you need anything else.`;
          case OrderStatus.QUOTE_REQUEST:
              return `Hi ${firstName}, we have received your quote request #${id}. We are calculating the costs and will send you a formal estimate shortly.`;
          default:
              return `Hi ${firstName}, there is an update on your Meat Depot order #${id}: ${status}.`;
      }
  };

  const handleStatusUpdate = (id: string, status: OrderStatus) => {
    updateOrder(id, { status });
    syncToSheet({ orders: orders.map(o => o.id === id ? { ...o, status } : o) });

    const order = orders.find(o => o.id === id);
    if (!order) return;

    const customer = users.find(u => u.id === order.customerId);
    const phoneToUse = customer?.phone || order.contactPhone;
    
    if (phoneToUse) {
        let phone = phoneToUse.replace(/\s+/g, '').replace(/-/g, '');
        if (phone.startsWith('0')) {
            phone = '27' + phone.substring(1);
        }

        const message = getStatusMessage(status, order.customerName, id, order.deliveryType);
        
        if(window.confirm(`Status updated to "${status}".\n\nOpen WhatsApp to notify ${order.customerName}?`)) {
            const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');
        }
    }
  };

  const handleSendMessage = (id: string) => {
    if (!msg) return;
    const order = orders.find(o => o.id === id);
    if (!order) return;
    const newMessage: OrderMessage = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'ADMIN',
      text: msg,
      timestamp: new Date().toISOString()
    };
    const updatedMessages = [...order.messages, newMessage];
    updateOrder(id, { messages: updatedMessages });
    syncToSheet({ orders: orders.map(o => o.id === id ? { ...o, messages: updatedMessages } : o) });
    setMsg('');
  };

  const handleAttachPDF = async (e: React.ChangeEvent<HTMLInputElement>, orderId: string) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsUploading(true);
          try {
              const base64 = await new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.readAsDataURL(file);
                  reader.onload = () => resolve(reader.result as string);
              });
              
              const uploadedUrl = await uploadFile(base64, `doc_${orderId}_${Date.now()}.pdf`, config);
              
              if (uploadedUrl) {
                  const order = orders.find(o => o.id === orderId);
                  if (order) {
                      const newMessage: OrderMessage = {
                          id: Math.random().toString(36).substr(2, 9),
                          sender: 'ADMIN',
                          text: `Attached Document: ${file.name}`,
                          timestamp: new Date().toISOString(),
                          attachmentUrl: uploadedUrl,
                          attachmentName: file.name
                      };
                      const updatedMessages = [...order.messages, newMessage];
                      updateOrder(orderId, { messages: updatedMessages });
                      syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, messages: updatedMessages } : o) });
                      alert("Document sent!");
                  }
              } else {
                  alert("Upload failed. Ensure Cloud Storage is configured.");
              }
          } catch (err) {
              alert("Error processing file.");
          } finally {
              setIsUploading(false);
          }
      }
  };

  const handleResolveQuote = (orderId: string) => {
      if(window.confirm("Mark this conversation as resolved and move to history?")) {
          updateOrder(orderId, { isResolved: true });
          syncToSheet({ orders: orders.map(o => o.id === orderId ? { ...o, isResolved: true } : o) });
          setSelectedId(null);
      }
  };
  
  const handleNotifyCheckApp = (order: Order) => {
      const customer = users.find(u => u.id === order.customerId);
      const phoneToUse = customer?.phone || order.contactPhone;

      if (!phoneToUse) {
          alert("No contact info for this user.");
          return;
      }
      
      let phone = phoneToUse.replace(/\s+/g, '').replace(/-/g, '');
      if (phone.startsWith('0')) phone = '27' + phone.substring(1);
      
      // Use the specific status message instead of the generic update message
      const message = getStatusMessage(order.status, order.customerName, order.id, order.deliveryType);
      
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };
  
  const saveTrackingLink = (id: string) => {
      if (!trackingLinkInput) return;
      updateOrder(id, { trackingUrl: trackingLinkInput });
      syncToSheet({ orders: orders.map(o => o.id === id ? { ...o, trackingUrl: trackingLinkInput } : o) });
      setEditingTrackingId(null);
      setTrackingLinkInput('');
      alert("Live tracking link updated. Customer can now track delivery.");
  };

  const handleFinalize = (orderId: string) => {
      navigate(`/admin/finalize/${orderId}`);
  };

  const handleDeleteOrder = (orderId: string) => {
      if (window.confirm("Are you sure you want to delete this order permanently?")) {
          deleteOrder(orderId);
          syncToSheet({ orders: orders.filter(o => o.id !== orderId) });
      }
  };

  const statuses = Object.values(OrderStatus);

  // Filter Logic
  const displayOrders = orders.filter(o => {
      if (activeTab === 'ACTIVE') return !o.isResolved;
      return o.isResolved;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 pb-20 pt-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
            <p className="text-gray-500 text-sm">Track orders and manage quotes</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button 
                onClick={() => setActiveTab('ACTIVE')}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'ACTIVE' ? 'bg-[#f4d300] text-black shadow-md' : 'text-gray-400 hover:text-black'}`}
            >
                Active
            </button>
            <button 
                onClick={() => setActiveTab('RESOLVED')}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'RESOLVED' ? 'bg-[#f4d300] text-black shadow-md' : 'text-gray-400 hover:text-black'}`}
            >
                Resolved / History
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl text-center space-y-4 border border-dashed border-gray-300">
            <Clock size={48} className="mx-auto text-gray-200" />
            <p className="text-gray-400 font-medium">No orders in this list.</p>
          </div>
        ) : (
          displayOrders.map(order => {
            const customer = users.find(u => u.id === order.customerId);
            const driver = order.driverId ? users.find(u => u.id === order.driverId) : null;
            const isOutForDelivery = order.status === OrderStatus.OUT_FOR_DELIVERY;
            const isQuoteRequest = order.status === OrderStatus.QUOTE_REQUEST;
            
            return (
            <div key={order.id} className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6 ${isQuoteRequest ? 'border-l-4 border-l-[#f4d300]' : ''} group relative`}>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">#{order.id}</span>
                      {order.isManual && <span className="bg-purple-100 text-purple-700 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Manual Sale</span>}
                      {isQuoteRequest && <span className="bg-yellow-100 text-yellow-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1"><Quote size={10}/> Quote Request</span>}
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      {order.customerName}
                      {customer ? (
                        <span title="Registered App User">
                          <UserIcon size={14} className="text-blue-500" />
                        </span>
                      ) : (
                        <span title="Guest User" className="text-[10px] text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">GUEST</span>
                      )}
                  </h3>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <div className="flex items-center gap-2">
                      <p className="text-xl font-bold text-yellow-700">R{order.total.toFixed(2)}</p>
                      <button onClick={() => handleDeleteOrder(order.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Delete Order">
                          <Trash2 size={16} />
                      </button>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${order.deliveryType === 'DELIVERY' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                    {order.deliveryType}
                  </span>
                </div>
              </div>
              
              {/* Text Request Content (from Messages) for Quote Requests */}
              {order.messages.map((m, i) => (
                  <div key={i} className={`p-4 rounded-2xl text-sm max-w-[90%] ${m.sender === 'CUSTOMER' ? 'bg-yellow-50 border border-yellow-100 text-gray-700 italic ml-0 mr-auto' : 'bg-blue-50 border border-blue-100 text-blue-900 ml-auto mr-0'}`}>
                      {m.attachmentUrl ? (
                          <a href={m.attachmentUrl} target="_blank" className="flex items-center gap-2 underline font-bold"><Download size={14}/> {m.attachmentName || 'View Attachment'}</a>
                      ) : (
                          `"${m.text}"`
                      )}
                      <div className="text-[8px] opacity-50 mt-1 uppercase font-bold">{m.sender} - {new Date(m.timestamp).toLocaleTimeString()}</div>
                  </div>
              ))}
              
              {order.deliveryType === 'DELIVERY' && (
                  <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col gap-2">
                      <div className="flex items-start gap-3">
                          <MapPin size={18} className="text-blue-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-blue-800">Delivery Address</p>
                              <p className="text-sm text-gray-700 break-words">{order.deliveryAddress}</p>
                          </div>
                          {order.deliveryCoordinates && (
                              <button 
                                onClick={() => window.open(`https://maps.google.com/?q=${order.deliveryCoordinates?.lat},${order.deliveryCoordinates?.lng}`, '_blank')}
                                className="bg-blue-100 text-blue-600 p-2 rounded-xl hover:bg-blue-200 transition-colors"
                                title="Open GPS Location"
                              >
                                  <MapIcon size={20} />
                              </button>
                          )}
                      </div>
                      {order.distanceKm !== undefined && (
                          <div className="flex items-center gap-3 pt-2 border-t border-blue-100 mt-1">
                              <Navigation size={16} className="text-blue-400 ml-0.5" />
                              <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Distance from Depot (63 Clarence Rd)</p>
                                  <p className="text-xs font-bold text-gray-800">{order.distanceKm.toFixed(1)} km <span className="text-gray-400 font-normal">|</span> Fee: R{order.deliveryFee?.toFixed(2)}</p>
                              </div>
                          </div>
                      )}
                      
                      {driver && (
                          <div className="flex items-center gap-2 pt-2 border-t border-blue-100">
                              <Truck size={16} className="text-blue-500" />
                              <span className="text-xs text-blue-800 font-bold">Driver: {driver.name}</span>
                          </div>
                      )}
                      
                      {/* Tracking Link Management - Always visible for Admin */}
                      <div className="mt-2 pt-2 border-t border-blue-100 animate-in fade-in">
                          {editingTrackingId === order.id || (!order.trackingUrl && editingTrackingId === null) ? (
                              <div className="flex gap-2">
                                  <input 
                                    className="flex-1 text-xs p-2 rounded-lg border border-blue-200 outline-none bg-white text-black"
                                    placeholder="Paste Google Maps Live Location Link"
                                    value={trackingLinkInput}
                                    onFocus={() => setEditingTrackingId(order.id)}
                                    onChange={e => setTrackingLinkInput(e.target.value)}
                                  />
                                  <button onClick={() => saveTrackingLink(order.id)} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"><Save size={14} /></button>
                              </div>
                          ) : (
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-green-600 text-xs font-bold">
                                      <div className={`w-2 h-2 rounded-full ${isOutForDelivery ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                                      Tracking Link Set
                                  </div>
                                  <button onClick={() => { setEditingTrackingId(order.id); setTrackingLinkInput(order.trackingUrl || ''); }} className="text-[10px] text-blue-500 font-bold hover:underline">Edit Link</button>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                {order.items.map((item, idx) => (
                  <div key={idx} className="shrink-0 space-y-1">
                    <div className="relative">
                        <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover" />
                        <span className="absolute -top-1 -right-1 bg-black text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-bold">x{item.quantity}</span>
                    </div>
                    <p className="text-[8px] font-bold text-center text-gray-500 w-12 truncate">{item.product.name}</p>
                    {item.vacuumPacked && <div className="text-[8px] text-blue-500 font-bold text-center flex justify-center"><Package size={8} /> VP</div>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Update Order Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(s => (
                      <button 
                        key={s}
                        onClick={() => handleStatusUpdate(order.id, s)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                          order.status === s ? 'bg-[#f4d300] text-black border-[#f4d300]' : 'bg-white text-gray-500 border-gray-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actions & Communication</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleFinalize(order.id)}
                      className="bg-black text-[#f4d300] p-2 rounded-xl flex items-center gap-2 text-xs font-bold px-4 hover:bg-gray-800 transition-colors"
                    >
                      {isQuoteRequest ? <Quote size={16} /> : <FileText size={16} />} 
                      {isQuoteRequest ? 'Process Quote' : 'Finalize Weight'}
                    </button>
                    <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleNotifyCheckApp(order)} 
                                className="bg-yellow-100 text-yellow-700 p-2 rounded-xl hover:bg-yellow-200 transition-colors"
                                title="Send status update to customer WhatsApp"
                            >
                                <Bell size={18} />
                            </button>
                            <input 
                                className="flex-1 bg-gray-50 text-gray-900 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-[#f4d300]"
                                placeholder="Msg customer..."
                                value={selectedId === order.id ? msg : ''}
                                onFocus={() => setSelectedId(order.id)}
                                onChange={e => setMsg(e.target.value)}
                            />
                            
                            <label className="bg-gray-100 p-2 rounded-xl text-gray-600 hover:text-blue-600 cursor-pointer">
                                {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
                                <input type="file" className="hidden" accept=".pdf,.png,.jpg" onChange={(e) => handleAttachPDF(e, order.id)} disabled={isUploading} />
                            </label>

                            <button 
                                onClick={() => handleSendMessage(order.id)}
                                className="bg-gray-100 p-2 rounded-xl text-gray-600 hover:text-green-700"
                            >
                                <MessageSquare size={18} />
                            </button>
                        </div>
                        {activeTab === 'ACTIVE' && (
                            <button onClick={() => handleResolveQuote(order.id)} className="text-[10px] text-green-600 font-bold uppercase flex items-center gap-1 hover:underline self-end">
                                <CheckCircle size={12} /> Mark as Resolved
                            </button>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  );
};

export default OrderManager;
