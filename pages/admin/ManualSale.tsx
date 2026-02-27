
import React, { useState } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  ArrowLeft, 
  Search, 
  Trash2, 
  Store, 
  Truck, 
  Calculator, 
  FileText, 
  ChevronRight, 
  User as UserIcon,
  Package,
  ArrowRight,
  ShoppingBag,
  Home,
  LayoutDashboard,
  Loader2,
  Receipt,
  UserPlus,
  X,
  Mail,
  Phone
} from 'lucide-react';
import { Product, User, OrderStatus, UnitType, CartItem, UserRole } from '../../types';
import { generateInvoicePDF } from '../../services/invoiceService';
import { uploadFile } from '../../services/storageService';
import { playSound } from '../../services/soundService';

const ManualSale: React.FC = () => {
  const { products, users, placeOrder, config, addNotification, login, addUser, syncToSheet } = useApp();
  const navigate = useNavigate();
  
  const [transactionType, setTransactionType] = useState<'SALE' | 'QUOTE'>('SALE');
  const [manualCart, setManualCart] = useState<CartItem[]>([]);
  const [customerType, setCustomerType] = useState<'NEW' | 'EXISTING'>('NEW');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newCustomer, setNewCustomer] = useState({ name: 'Walk-in Customer', email: '', phone: '' });
  const [deliveryType, setDeliveryType] = useState<'COLLECTION' | 'DELIVERY' | 'MANUAL'>('MANUAL');
  const [distance, setDistance] = useState(0);
  const [address, setAddress] = useState('');
  const [searchProduct, setSearchProduct] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // New Client Creation State
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [createClientForm, setCreateClientForm] = useState({
      name: '',
      email: '',
      phone: '',
      username: ''
  });

  const handleAddToCart = (product: Product) => {
    const existing = manualCart.find(item => item.productId === product.id);
    if (existing) {
        setManualCart(manualCart.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
        setManualCart([...manualCart, { 
            id: Math.random().toString(36).substr(2, 9), 
            productId: product.id, 
            product, 
            quantity: 1,
            weight: product.unit === UnitType.KG ? 1000 : undefined 
        }]);
    }
  };

  const calculateSubtotal = () => {
      return manualCart.reduce((acc, item) => {
          if(item.product.unit === UnitType.KG && item.weight) {
              return acc + (item.product.price / 1000) * item.weight * item.quantity;
          }
          return acc + item.product.price * item.quantity;
      }, 0);
  };

  const deliveryFee = deliveryType === 'DELIVERY' 
      ? (
          config.deliveryCalculationMethod === 'DISTANCE' 
          ? (distance * (config.deliveryRatePerKm || 10)) 
          : (
              config.deliveryCalculationMethod === 'ZONES' && config.deliveryZones
              ? (config.deliveryZones.find(z => (z.minDistance === undefined || distance >= z.minDistance) && (z.maxDistance === undefined || distance < z.maxDistance))?.fee || config.deliveryFee)
              : config.deliveryFee
          )
      ) 
      : 0;
  const total = calculateSubtotal() + deliveryFee;

  const getOrderObject = () => {
      // Determine status: If SALE, it implies immediate completion/payment.
      const status = transactionType === 'QUOTE' ? OrderStatus.QUOTE_REQUEST : OrderStatus.PAID;
      
      return {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          customerId: customerType === 'EXISTING' && selectedUser ? selectedUser.id : 'manual',
          customerName: customerType === 'EXISTING' && selectedUser ? selectedUser.name : newCustomer.name,
          items: manualCart,
          total: total,
          status: status,
          createdAt: new Date().toISOString(),
          deliveryType: deliveryType === 'MANUAL' ? 'COLLECTION' : deliveryType as any,
          deliveryAddress: deliveryType === 'DELIVERY' ? address : undefined,
          distanceKm: deliveryType === 'DELIVERY' ? distance : undefined,
          deliveryFee: deliveryFee,
          messages: [],
          isManual: true,
          contactEmail: customerType === 'EXISTING' && selectedUser ? selectedUser.email : newCustomer.email,
          contactPhone: customerType === 'EXISTING' && selectedUser ? selectedUser.phone : newCustomer.phone
      };
  };

  const handleCompleteSale = () => {
      if (manualCart.length === 0) {
          alert("Add items to the cart first.");
          return;
      }
      const order = getOrderObject();
      placeOrder(order, 0); // Adds to order list
      playSound('success', config);
      
      // Trigger Email
      if (order.contactEmail) {
          fetch('/api/send-order-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ order, config })
          }).catch(console.error);
      }
      
      // Auto-generate invoice/receipt since it's "Paid"
      if (window.confirm("Sale Completed & Paid. Download Receipt PDF now?")) {
          generateInvoicePDF(order, config, 'INVOICE');
      }
      navigate('/admin');
  };

  const handleCreateClient = async () => {
      if (!createClientForm.name || !createClientForm.email || !createClientForm.username) {
          alert("Name, Email and Username are required.");
          return;
      }
      
      // Check duplicate
      if (users.some(u => u.email === createClientForm.email || u.username === createClientForm.username)) {
          alert("User with this email or username already exists.");
          return;
      }

      const newUser: User = {
          id: 'manual_' + Math.random().toString(36).substr(2, 9),
          username: createClientForm.username,
          name: createClientForm.name,
          email: createClientForm.email,
          phone: createClientForm.phone,
          role: UserRole.CUSTOMER,
          loyaltyPoints: 0,
          password: 'MeatDepot123', // Default
          blocked: false
      };

      // Add to state and sync
      addUser(newUser); // This adds to users list in store
      const updatedUsers = [...users, newUser];
      await syncToSheet({ users: updatedUsers });

      // Auto-select this new user
      setCustomerType('EXISTING');
      setSelectedUser(newUser);
      
      setShowCreateClient(false);
      setCreateClientForm({ name: '', email: '', phone: '', username: '' });
      alert("Client created and selected!");
  };

  const handleDownloadDocs = async (type: 'QUOTE' | 'ESTIMATE') => {
      if (manualCart.length === 0) {
          alert("Add items to the cart first.");
          return;
      }
      
      setIsProcessing(true);
      const order = getOrderObject();
      placeOrder(order, 0);
      
      try {
          // 1. Generate and Download Locally
          const pdfDataUri = await generateInvoicePDF(order, config, type);
          
          // 2. If Existing User, Upload and Send to Inbox
          if (customerType === 'EXISTING' && selectedUser && pdfDataUri) {
              const hasCloud = !!config.firebaseConfig?.apiKey;
              
              if (hasCloud) {
                  const fileName = `${type}_${order.id}_${Date.now()}.pdf`;
                  const uploadedUrl = await uploadFile(pdfDataUri, fileName, config);
                  
                  if (uploadedUrl && uploadedUrl.startsWith('http')) {
                      addNotification({
                          id: Math.random().toString(36).substr(2, 9),
                          title: `New ${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()} Available`,
                          body: `A new ${type.toLowerCase()} (#${order.id}) has been generated for you. Tap below to download.`,
                          type: 'DOCUMENT',
                          timestamp: new Date().toISOString(),
                          targetUserId: selectedUser.id,
                          actionUrl: uploadedUrl,
                          actionLabel: `Download ${type}`
                      });
                      alert(`Document downloaded AND sent to ${selectedUser.name}'s app inbox.`);
                  } else {
                      console.warn("Upload failed or returned non-HTTP string");
                      alert("Document downloaded locally. Could not upload to cloud for user inbox.");
                  }
              } else {
                  alert("Document downloaded locally. Enable Cloud Storage in Settings to automatically send to user inbox.");
              }
          } else {
              alert("Quote Generated and Saved.");
          }
      } catch (e) {
          console.error(e);
          alert("Error generating document.");
      } finally {
          setIsProcessing(false);
          navigate('/admin');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 px-4 pb-20 space-y-8 pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">New Transaction</h1>
            <p className="text-gray-500 text-sm">Create a manual sale or generate a quote</p>
        </div>
        
        {/* Transaction Type Toggle */}
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            <button 
                onClick={() => setTransactionType('SALE')}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${transactionType === 'SALE' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
            >
                <ShoppingBag size={16} /> Sale (Invoice)
            </button>
            <button 
                onClick={() => setTransactionType('QUOTE')}
                className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${transactionType === 'QUOTE' ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
            >
                <FileText size={16} /> Quote
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add Products</h2>
                    <div className="relative w-full max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900" placeholder="Search inventory..." value={searchProduct} onChange={e => setSearchProduct(e.target.value)} />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                    {products.filter(p => p.name.toLowerCase().includes(searchProduct.toLowerCase())).map(p => (
                        <button key={p.id} onClick={() => handleAddToCart(p)} className="p-4 bg-white border border-gray-200 rounded-2xl flex items-center gap-4 hover:border-[#f4d300] transition-colors text-left group">
                            <img src={p.image} className="w-16 h-16 rounded-xl object-cover bg-gray-100" />
                            <div className="flex-1 min-w-0"><p className="font-bold text-sm text-gray-900 truncate">{p.name}</p><p className="text-xs text-gray-500 mt-1">R{p.price} / {p.unit}</p></div>
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#f4d300] group-hover:text-black"><Plus size={20} /></div>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Logistics</h2>
                <div className="flex gap-4">
                    <button onClick={() => setDeliveryType('MANUAL')} className={`flex-1 py-4 text-xs font-bold uppercase rounded-2xl border-2 transition-all ${deliveryType === 'MANUAL' ? 'bg-black text-white border-black' : 'bg-white text-gray-400'}`}>Collect In-Store</button>
                    <button onClick={() => setDeliveryType('DELIVERY')} className={`flex-1 py-4 text-xs font-bold uppercase rounded-2xl border-2 transition-all ${deliveryType === 'DELIVERY' ? 'bg-black text-white border-black' : 'bg-white text-gray-400'}`}>Delivery</button>
                </div>
                {deliveryType === 'DELIVERY' && (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Address</label>
                            <input className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-gray-900" placeholder="Street Address" value={address} onChange={e => setAddress(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Distance (KM)</label>
                            <input type="number" className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-gray-900" placeholder="0" value={distance} onChange={e => setDistance(Number(e.target.value))} />
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Customer Details</h2>
                <div className="flex gap-4">
                    <button onClick={() => setCustomerType('NEW')} className={`flex-1 py-4 text-xs font-bold uppercase rounded-2xl border-2 transition-all ${customerType === 'NEW' ? 'bg-black text-white border-black' : 'bg-white text-gray-400'}`}>Guest</button>
                    <button onClick={() => setCustomerType('EXISTING')} className={`flex-1 py-4 text-xs font-bold uppercase rounded-2xl border-2 transition-all ${customerType === 'EXISTING' ? 'bg-black text-white border-black' : 'bg-white text-gray-400'}`}>Registered</button>
                </div>
                {customerType === 'NEW' ? (
                    <input className="w-full p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-gray-900" placeholder="Name" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                ) : (
                    <div className="flex gap-2">
                        <select className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100 outline-none text-gray-900 font-bold" onChange={e => setSelectedUser(users.find(u => u.id === e.target.value) || null)} value={selectedUser?.id || ''}>
                            <option value="">Select Customer...</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name} (@{u.username})</option>)}
                        </select>
                        <button onClick={() => setShowCreateClient(true)} className="bg-[#f4d300] text-black px-4 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-md" title="Create New Client">
                            <Plus size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 flex flex-col h-fit sticky top-24">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-6 mb-6">
                    <ShoppingBag size={20} className="text-[#f4d300]" />
                    <h2 className="text-xl font-bold text-gray-900">{transactionType === 'QUOTE' ? 'Quote Summary' : 'Sale Summary'}</h2>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto mb-8">
                    {manualCart.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between gap-4">
                            <div className="flex-1 min-w-0"><p className="font-bold text-sm text-gray-900 truncate">{item.product.name}</p></div>
                            <button onClick={() => setManualCart(manualCart.filter((_, i) => i !== idx))} className="text-red-500"><Trash2 size={14} /></button>
                        </div>
                    ))}
                </div>
                
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>R{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    {deliveryFee > 0 && (
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Delivery ({distance}km)</span>
                            <span>R{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end pt-2 border-t border-gray-100 mt-auto"><span className="text-xs font-bold text-gray-400 uppercase tracking-widest">TOTAL</span><span className="text-3xl font-bold text-gray-900">R{total.toFixed(2)}</span></div>
                
                {transactionType === 'QUOTE' ? (
                    <button 
                        onClick={() => handleDownloadDocs('QUOTE')} 
                        disabled={isProcessing}
                        className="w-full py-5 bg-gray-900 text-white rounded-[25px] font-bold text-xs uppercase tracking-widest hover:bg-black flex items-center justify-center gap-2 mt-6 shadow-xl"
                    >
                        {isProcessing ? <Loader2 size={16} className="animate-spin"/> : <FileText size={16} />} 
                        Generate Quote
                    </button>
                ) : (
                    <button 
                        onClick={handleCompleteSale}
                        className="w-full py-5 bg-[#f4d300] text-black rounded-[25px] font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2 mt-6 shadow-xl"
                    >
                        <ShoppingBag size={16} /> Complete Sale (Paid)
                    </button>
                )}
            </div>
        </div>
      </div>

      {/* Create Client Modal */}
      {showCreateClient && (
          <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-300">
                  <button onClick={() => setShowCreateClient(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24}/></button>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><UserPlus size={24} className="text-[#f4d300]"/> Create Client Profile</h2>
                  
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                          <input 
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                              value={createClientForm.name}
                              onChange={e => setCreateClientForm({...createClientForm, name: e.target.value})}
                              placeholder="e.g. Jane Doe"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Username (Unique)</label>
                          <input 
                              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                              value={createClientForm.username}
                              onChange={e => setCreateClientForm({...createClientForm, username: e.target.value.replace(/\s/g, '')})}
                              placeholder="e.g. JaneD"
                          />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                              <input 
                                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                  value={createClientForm.email}
                                  onChange={e => setCreateClientForm({...createClientForm, email: e.target.value})}
                                  placeholder="client@email.com"
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
                          <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
                              <input 
                                  className="w-full pl-10 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                                  value={createClientForm.phone}
                                  onChange={e => setCreateClientForm({...createClientForm, phone: e.target.value})}
                                  placeholder="082 123 4567"
                              />
                          </div>
                      </div>
                      
                      <button onClick={handleCreateClient} className="w-full py-4 bg-black text-white rounded-xl font-bold uppercase tracking-widest text-xs mt-4 hover:bg-gray-800 transition-colors shadow-lg">
                          Create & Select Client
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ManualSale;
