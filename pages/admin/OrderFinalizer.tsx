
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { 
  ArrowLeft, 
  Calculator, 
  Save, 
  Download, 
  Package, 
  User as UserIcon, 
  Clock, 
  CheckCircle, 
  Truck, 
  MapPin, 
  ChevronRight, 
  Home, 
  LayoutDashboard, 
  Search, 
  Plus, 
  Trash2, 
  Receipt, 
  FileText,
  Send,
  Loader2,
  MessageSquare,
  FileSignature
} from 'lucide-react';
import { Order, CartItem, UnitType, Product } from '../../types';
import { generateInvoicePDF } from '../../services/invoiceService';
import { uploadFile } from '../../services/storageService';

const OrderFinalizer: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { orders, updateOrder, config, products, syncToSheet, addNotification } = useApp();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState<Order | null>(null);
  const [editedItems, setEditedItems] = useState<CartItem[]>([]);
  
  // Search State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Send State
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const foundOrder = orders.find(o => o.id === orderId);
    if (foundOrder) {
      setOrder(foundOrder);
      // Deep copy to allow editing nested product properties (like price) for this specific order context
      setEditedItems(JSON.parse(JSON.stringify(foundOrder.items)));
    } else {
      navigate('/admin/orders');
    }
  }, [orderId, orders, navigate]);

  if (!order) return null;

  const handleItemChange = (index: number, field: 'weight' | 'quantity', value: number) => {
    const newItems = [...editedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditedItems(newItems);
  };

  const handlePriceChange = (index: number, value: number) => {
      const newItems = [...editedItems];
      // Modify the local snapshot of the product for this order only
      newItems[index].product.price = value;
      setEditedItems(newItems);
  };

  const handleAddItem = (product: Product) => {
      const newItem: CartItem = {
          id: Math.random().toString(36).substr(2, 9),
          productId: product.id,
          product: JSON.parse(JSON.stringify(product)), // Clone to allow price editing
          quantity: 1,
          weight: product.unit === UnitType.KG ? 1000 : undefined
      };
      setEditedItems([...editedItems, newItem]);
      setIsAddingItem(false);
      setSearchQuery('');
  };

  const handleRemoveItem = (index: number) => {
      const newItems = editedItems.filter((_, i) => i !== index);
      setEditedItems(newItems);
  };

  const calculateNewTotal = () => {
    const subtotal = editedItems.reduce((acc, item) => {
      if (item.product.unit === UnitType.KG && item.weight) {
        return acc + (item.product.price / 1000) * item.weight * item.quantity;
      }
      return acc + item.product.price * item.quantity;
    }, 0);
    const discount = order.discountUsed || 0;
    const delivery = order.deliveryFee || 0;
    return Math.max(0, subtotal + delivery - discount);
  };

  const currentTotal = calculateNewTotal();

  const handleSave = () => {
    updateOrder(order.id, { items: editedItems, total: currentTotal });
    syncToSheet({ orders: orders.map(o => o.id === order.id ? { ...o, items: editedItems, total: currentTotal } : o) });
    alert("Order/Quote updated successfully.");
  };

  const handleDownloadReceipt = () => {
    generateInvoicePDF({ ...order, items: editedItems, total: currentTotal }, config, 'INVOICE');
  };

  const handleDownloadQuote = () => {
    generateInvoicePDF({ ...order, items: editedItems, total: currentTotal }, config, 'QUOTE');
  };

  const handleDownloadAgreement = () => {
    generateInvoicePDF({ ...order, items: editedItems, total: currentTotal }, config, 'ORDER_AGREEMENT');
  };

  const handleSendDocumentToApp = async (docType: 'QUOTE' | 'INVOICE' | 'ESTIMATE' | 'ORDER_AGREEMENT') => {
      if (!order.customerId || order.customerId === 'manual') {
          alert("This is a manual/guest order. Cannot send in-app messages.");
          return;
      }

      setIsSending(true);
      try {
          // 1. Generate PDF
          const tempOrder = { ...order, items: editedItems, total: currentTotal };
          const pdfBase64 = await generateInvoicePDF(tempOrder, config, docType);
          
          // 2. Upload PDF
          const hasCloud = !!config.firebaseConfig?.apiKey;
          if (!hasCloud) {
              alert("Cloud storage is not configured. Cannot upload document to send.");
              setIsSending(false);
              return;
          }

          const fileName = `${docType}_${order.id}_${Date.now()}.pdf`;
          const uploadUrl = await uploadFile(pdfBase64, fileName, config);

          if (!uploadUrl || !uploadUrl.startsWith('http')) {
              throw new Error("Upload failed or returned invalid URL.");
          }

          // 3. Create Notification
          const notificationId = Math.random().toString(36).substr(2, 9);
          const prettyDocName = docType === 'ORDER_AGREEMENT' ? 'Order Agreement' : docType === 'QUOTE' ? 'Quote' : 'Invoice';
          
          const notification = {
              id: notificationId,
              title: `New ${prettyDocName} Ready`,
              body: `We have prepared your ${prettyDocName.toLowerCase()} for Order #${order.id}. Tap to view or download.`,
              type: 'DOCUMENT' as const,
              timestamp: new Date().toISOString(),
              targetUserId: order.customerId,
              actionUrl: uploadUrl,
              actionLabel: `Download ${prettyDocName}`
          };

          // 4. Update State & Sync
          addNotification(notification);
          
          // Update order status if it was a quote request
          if (order.status === 'Quote Requested' && docType === 'QUOTE') {
              updateOrder(order.id, { status: 'Order pending' as any }); 
          }

          alert(`Document sent to ${order.customerName}'s app inbox!`);

      } catch (error) {
          console.error(error);
          alert("Failed to send document. Please check internet and cloud settings.");
      } finally {
          setIsSending(false);
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 px-4 pb-20 space-y-8 pt-8">
      <div className="flex justify-between items-center px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Order / Quote</h1>
            <p className="text-gray-500 text-sm">Adjust items, weights, and prices</p>
        </div>
        <button onClick={() => navigate('/admin/orders')} className="bg-white border border-gray-300 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-50">
            Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex gap-4">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 h-fit"><UserIcon size={32} /></div>
                    <div><h3 className="text-xl font-bold text-gray-900">{order.customerName}</h3><p className="text-sm text-gray-500 mt-1">ID: #{order.id}</p></div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsAddingItem(true)}
                        className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-md"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                </div>
            </div>

            {/* Product Search Modal/Area */}
            {isAddingItem && (
                <div className="bg-white p-6 rounded-[25px] shadow-lg border border-[#f4d300] animate-in slide-in-from-top-2">
                    <div className="flex gap-2 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                autoFocus
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-[#f4d300]"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button onClick={() => setIsAddingItem(false)} className="px-4 py-2 bg-gray-100 rounded-xl text-gray-600 hover:bg-gray-200">Cancel</button>
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                        {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(product => (
                            <button 
                                key={product.id} 
                                onClick={() => handleAddItem(product)}
                                className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl text-left transition-colors border border-transparent hover:border-gray-100"
                            >
                                <img src={product.image} className="w-10 h-10 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <p className="font-bold text-sm text-gray-900">{product.name}</p>
                                    <p className="text-xs text-gray-500">R{product.price} / {product.unit}</p>
                                </div>
                                <Plus size={16} className="text-[#f4d300]" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                {editedItems.length === 0 && <p className="text-center text-gray-400 py-10">No items in this quote yet.</p>}
                {editedItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-[25px] group hover:border-gray-200 border border-transparent transition-all">
                        <img src={item.product.image} className="w-16 h-16 rounded-2xl object-cover" />
                        
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 truncate">{item.product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Unit Price: R</span>
                                <input 
                                    type="number" 
                                    className="w-20 p-1 bg-white border border-gray-200 rounded text-xs font-bold text-gray-700 focus:border-[#f4d300] outline-none"
                                    value={item.product.price} 
                                    onChange={(e) => handlePriceChange(idx, Number(e.target.value))} 
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {item.product.unit === UnitType.KG ? (
                                <div className="flex flex-col items-end">
                                    <label className="text-[9px] font-bold text-gray-400 uppercase">Weight (g)</label>
                                    <input 
                                        type="number" 
                                        className="w-24 p-2 bg-white border border-gray-200 rounded-xl text-center text-gray-900 font-bold outline-none focus:border-[#f4d300]" 
                                        value={item.weight} 
                                        onChange={(e) => handleItemChange(idx, 'weight', Number(e.target.value))} 
                                    />
                                </div>
                            ) : null}
                            
                            <div className="flex flex-col items-end">
                                <label className="text-[9px] font-bold text-gray-400 uppercase">Qty</label>
                                <input 
                                    type="number" 
                                    className="w-16 p-2 bg-white border border-gray-200 rounded-xl text-center text-gray-900 font-bold outline-none focus:border-[#f4d300]" 
                                    value={item.quantity} 
                                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))} 
                                />
                            </div>

                            <button onClick={() => handleRemoveItem(idx)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl ml-2">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 space-y-8 sticky top-24">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>R{calculateNewTotal().toFixed(2)}</span></div>
                    {order.deliveryFee ? <div className="flex justify-between text-sm text-gray-500"><span>Delivery</span><span>R{order.deliveryFee}</span></div> : null}
                    {order.discountUsed ? <div className="flex justify-between text-sm text-green-600"><span>Discount</span><span>-R{order.discountUsed}</span></div> : null}
                    <div className="flex justify-between items-end pt-4 border-t border-gray-100"><span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FINAL TOTAL</span><span className="text-4xl font-bold text-gray-900">R{currentTotal.toFixed(2)}</span></div>
                </div>
                
                <div className="space-y-3 pt-4">
                    <button onClick={handleSave} className="w-full bg-black text-white py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 flex items-center justify-center gap-2">
                        <Save size={16} /> Save Changes
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleDownloadQuote} className="bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 flex flex-col items-center gap-1">
                            <FileText size={18} /> Download Quote
                        </button>
                        <button onClick={handleDownloadReceipt} className="bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:brightness-110 flex flex-col items-center gap-1 shadow-lg">
                            <Receipt size={18} /> Download Invoice
                        </button>
                    </div>
                    
                    <button onClick={handleDownloadAgreement} className="w-full bg-white border border-gray-200 text-gray-700 py-3 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2">
                        <FileSignature size={16} /> Download Agreement
                    </button>

                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2 text-center">Send to Customer App</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={() => handleSendDocumentToApp('QUOTE')}
                                disabled={isSending}
                                className="bg-blue-50 text-blue-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 disabled:opacity-50"
                            >
                                Send Quote
                            </button>
                            <button 
                                onClick={() => handleSendDocumentToApp('ORDER_AGREEMENT')}
                                disabled={isSending}
                                className="bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50"
                            >
                                Send Agreement
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFinalizer;
