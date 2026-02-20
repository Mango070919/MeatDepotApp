
import React, { useState } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Trash2, 
  Send, 
  FileText, 
  ShoppingCart, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { Product, CartItem, OrderStatus, UnitType, UserRole } from '../../types';

const RequestQuote: React.FC = () => {
  const { products, currentUser, placeOrder, users, addNotification } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'TEXT' | 'LIST'>('LIST');
  const [textRequest, setTextRequest] = useState('');
  
  // List Builder State
  const [quoteItems, setQuoteItems] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tempQty, setTempQty] = useState(1);
  const [tempWeight, setTempWeight] = useState(1000); // Default 1kg
  const [manualWeight, setManualWeight] = useState(false);

  // Group products by category for better navigation
  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleAddItem = () => {
    if (!selectedProduct) return;
    
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      product: selectedProduct,
      quantity: tempQty,
      weight: manualWeight ? tempWeight : (selectedProduct.unit === UnitType.KG ? tempWeight : undefined),
    };

    setQuoteItems([...quoteItems, newItem]);
    setSelectedProduct(null);
    setTempQty(1);
    setTempWeight(1000);
    setManualWeight(false);
  };

  const handleRemoveItem = (id: string) => {
    setQuoteItems(quoteItems.filter(i => i.id !== id));
  };

  const handleSubmit = () => {
    if (!currentUser) {
        alert("Please login to request a quote.");
        navigate('/login');
        return;
    }

    if (mode === 'TEXT' && !textRequest.trim()) {
        alert("Please describe what you are looking for.");
        return;
    }

    if (mode === 'LIST' && quoteItems.length === 0) {
        alert("Please add items to your quote list.");
        return;
    }

    // Construct "Custom Product" for text request if needed
    const finalItems = mode === 'LIST' ? quoteItems : [];
    
    // Create the order object
    const quoteOrder = {
        id: Math.random().toString(36).substr(2, 9).toUpperCase(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        items: finalItems,
        total: 0, // Quote request starts with 0 total, admin sets it later
        status: OrderStatus.QUOTE_REQUEST,
        createdAt: new Date().toISOString(),
        deliveryType: 'COLLECTION' as any, // Default, can be discussed
        messages: mode === 'TEXT' ? [{
            id: Math.random().toString(36).substr(2, 9),
            sender: 'CUSTOMER' as any,
            text: textRequest,
            timestamp: new Date().toISOString()
        }] : []
    };

    // Place Order (store in global state)
    placeOrder(quoteOrder, 0);

    // Notify Admins
    const admins = users.filter(u => u.role === UserRole.ADMIN);
    admins.forEach(admin => {
        addNotification({
            id: Math.random().toString(36).substr(2, 9),
            title: "New Quote Request",
            body: `${currentUser.name} has requested a quote (#${quoteOrder.id}).`,
            type: 'ORDER',
            targetUserId: admin.id,
            timestamp: new Date().toISOString()
        });
    });

    alert("Quote request sent! We will review and get back to you shortly.");
    navigate('/orders');
  };

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-4xl font-bold italic text-white">Request Quote</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">Custom Orders & Bulk</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/5 p-1 rounded-2xl flex border border-white/10">
          <button 
            onClick={() => setMode('LIST')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'LIST' ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
              Build List
          </button>
          <button 
            onClick={() => setMode('TEXT')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${mode === 'TEXT' ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
          >
              Type Request
          </button>
      </div>

      {mode === 'TEXT' ? (
          <div className="space-y-6">
              <div className="bg-[#121212] p-6 rounded-[32px] border border-white/10 shadow-2xl">
                  <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-4 block">Describe your requirements</label>
                  <textarea 
                    className="w-full h-64 bg-black/50 border border-white/10 rounded-2xl p-4 text-white text-sm leading-relaxed outline-none focus:border-[#f4d300] resize-none placeholder-white/20"
                    placeholder="e.g., I'm looking for a whole lamb for a spit braai next Saturday. Can you also supply spices and marinade? Roughly 15kg..."
                    value={textRequest}
                    onChange={(e) => setTextRequest(e.target.value)}
                  />
                  <p className="text-white/30 text-xs mt-4 flex items-center gap-2"><AlertCircle size={14} /> Admin will reply with an estimate.</p>
              </div>
          </div>
      ) : (
          <div className="space-y-6">
              {/* Product Catalog Display */}
              <div className="space-y-4">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2">Select Products</h3>
                  <div className="h-[400px] overflow-y-auto no-scrollbar bg-[#121212] rounded-[32px] border border-white/10 p-4 space-y-6">
                      {categories.map(category => {
                          const catProducts = products.filter(p => p.category === category);
                          if(catProducts.length === 0) return null;
                          return (
                              <div key={category} className="space-y-3">
                                  <h4 className="text-[#f4d300] text-[10px] font-bold uppercase tracking-[0.2em] sticky top-0 bg-[#121212] py-2 z-10">{category}</h4>
                                  <div className="grid grid-cols-1 gap-3">
                                      {catProducts.map(p => (
                                          <button 
                                            key={p.id}
                                            onClick={() => setSelectedProduct(p)}
                                            className="w-full p-3 flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all text-left group"
                                          >
                                              <img src={p.image} className="w-12 h-12 rounded-xl object-cover bg-black" />
                                              <div className="flex-1 min-w-0">
                                                  <p className="text-white font-bold text-xs truncate group-hover:text-[#f4d300] transition-colors">{p.name}</p>
                                                  <p className="text-white/40 text-[10px]">{p.unit}</p>
                                              </div>
                                              <div className="w-8 h-8 rounded-full bg-[#f4d300] text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Plus size={14} />
                                              </div>
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>

              {/* Selection Modal (Inline) */}
              {selectedProduct && (
                  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
                      <div className="bg-[#1a1a1a] p-6 rounded-[32px] border border-[#f4d300] shadow-2xl w-full max-w-sm">
                          <div className="flex items-center justify-between mb-6">
                              <div>
                                  <h3 className="text-white font-bold text-lg">{selectedProduct.name}</h3>
                                  <p className="text-white/40 text-xs">{selectedProduct.category}</p>
                              </div>
                              <button onClick={() => setSelectedProduct(null)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20"><Check size={16} className="rotate-45"/></button>
                          </div>
                          
                          <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Quantity</label>
                                      <input type="number" className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-[#f4d300]" value={tempQty} onChange={e => setTempQty(Number(e.target.value))} />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Weight (Grams)</label>
                                      <input 
                                        type="number" 
                                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white font-bold outline-none focus:border-[#f4d300]" 
                                        value={tempWeight} 
                                        onChange={e => { setTempWeight(Number(e.target.value)); setManualWeight(true); }}
                                        placeholder={selectedProduct.unit === UnitType.KG ? "1000" : "N/A"}
                                      />
                                  </div>
                              </div>
                              
                              <button onClick={handleAddItem} className="w-full bg-[#f4d300] text-black py-4 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform">
                                  <Plus size={16} /> Add to Quote
                              </button>
                          </div>
                      </div>
                  </div>
              )}

              {/* Item List */}
              <div className="space-y-3">
                  <h3 className="text-white font-bold text-sm uppercase tracking-widest px-2">Your List</h3>
                  {quoteItems.length === 0 ? (
                      <div className="text-center py-10 text-white/20 border-2 border-dashed border-white/5 rounded-3xl">
                          <ShoppingCart size={32} className="mx-auto mb-2" />
                          <p className="text-xs font-bold uppercase tracking-widest">List is empty</p>
                      </div>
                  ) : (
                      quoteItems.map(item => (
                          <div key={item.id} className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                  <img src={item.product.image} className="w-12 h-12 rounded-xl object-cover" />
                                  <div>
                                      <p className="text-white font-bold text-sm">{item.product.name}</p>
                                      <p className="text-white/40 text-xs">
                                          {item.quantity} x {item.weight ? `${item.weight}g` : item.product.unit}
                                      </p>
                                  </div>
                              </div>
                              <button onClick={() => handleRemoveItem(item.id)} className="text-white/20 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      <button 
        onClick={handleSubmit}
        className="w-full bg-[#f4d300] text-black py-5 rounded-[25px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#f4d300]/20 flex items-center justify-center gap-3 hover:scale-105 transition-transform"
      >
          <Send size={18} /> Submit Quote Request
      </button>

    </div>
  );
};

export default RequestQuote;
