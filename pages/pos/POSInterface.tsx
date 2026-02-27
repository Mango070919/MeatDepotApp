
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  Scan, 
  Search, 
  Trash2, 
  CreditCard, 
  Banknote, 
  LogOut, 
  Weight, 
  Printer, 
  Plus, 
  Minus,
  X,
  QrCode,
  History,
  Edit2,
  Check,
  Loader2,
  FileText,
  Usb
} from 'lucide-react';
import { Product, CartItem, OrderStatus, UnitType } from '../../types';
import ReceiptTemplate from './ReceiptTemplate';
import { generateInvoicePDF } from '../../services/invoiceService';
import { uploadFile } from '../../services/storageService';
import { ThermalPrinterService } from '../../services/thermalPrinterService';
import QRCode from 'qrcode';

const POSInterface: React.FC = () => {
  const { products, placeOrder, currentUser, logout, orders, config } = useApp();
  const navigate = useNavigate();
  
  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [amountTendered, setAmountTendered] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'EFT'>('CARD');
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Hardware State
  const [scaleConnected, setScaleConnected] = useState(false);
  const [printerConnected, setPrinterConnected] = useState(false);
  const [liveWeight, setLiveWeight] = useState(0); // in grams
  const [scaleReader, setScaleReader] = useState<ReadableStreamDefaultReader | null>(null);
  
  // Refs for Services
  const printerService = useRef(new ThermalPrinterService());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Editing State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editWeightValue, setEditWeightValue] = useState<string>('');

  // Invoice QR State
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string>('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  // --- Hardware Logic ---

  // Barcode Scanner Driver (Keyboard Wedge Mode)
  useEffect(() => {
    let barcodeBuffer = '';
    let barcodeTimer: any;

    const handleKeyDown = (e: KeyboardEvent) => {
        // Bypass if user is manually editing a weight field
        if (editingItemId) return;

        // If focus is on a text input other than main search, assume manual typing
        const activeTag = document.activeElement?.tagName;
        if (activeTag === 'INPUT' && document.activeElement !== searchInputRef.current) {
            // Optional: allow scanner to override if buffer fills rapidly? 
            // For now, respect focus to allow manual entry in other fields if needed.
        }

        // Scanner usually sends 'Enter' at the end of the sequence
        if (e.key === 'Enter') {
            if (barcodeBuffer.length > 3) {
                // It's likely a barcode
                e.preventDefault(); // Prevent form submission or newline
                handleBarcodeScan(barcodeBuffer);
            }
            barcodeBuffer = '';
        } else {
            // Accumulate characters
            if (e.key.length === 1) {
                barcodeBuffer += e.key;
            }
            // Reset buffer if keystrokes are too slow (human typing speed vs scanner speed)
            clearTimeout(barcodeTimer);
            barcodeTimer = setTimeout(() => { barcodeBuffer = ''; }, 50); // 50ms timeout for scanner speed
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products, posCart, editingItemId]);

  const handleBarcodeScan = (code: string) => {
      const product = products.find(p => p.id === code || p.barcode === code);
      if (product) {
          addToPosCart(product);
          // Success Beep
          const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3');
          audio.play().catch(() => {});
      } else {
          // Error Beep
          const audio = new Audio('https://codeskulptor-demos.commondatastorage.googleapis.com/assets/Epoq-Lepidoptera.ogg'); // Placeholder error sound
          // Only alert if we're not manually typing
          if (document.activeElement !== searchInputRef.current) {
             console.warn(`Product not found: ${code}`);
          }
      }
  };

  // Web Serial Scale Driver
  const connectScale = async () => {
      const nav = navigator as any; 
      if (!nav.serial) {
          alert("Web Serial API not supported. Use Chrome/Edge.");
          return;
      }
      try {
          const port = await nav.serial.requestPort();
          await port.open({ baudRate: 9600 });
          setScaleConnected(true);
          
          const textDecoder = new TextDecoderStream();
          port.readable!.pipeTo(textDecoder.writable);
          const reader = textDecoder.readable.getReader();
          setScaleReader(reader);

          while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) {
                  // Regex to find standard scale weight format (e.g. "  0.500kg")
                  const weightMatch = value.match(/([\d\.]+)/);
                  if (weightMatch) {
                      const kgs = parseFloat(weightMatch[1]);
                      // Basic stability filter: only update if realistic
                      if (kgs < 100) setLiveWeight(kgs * 1000); 
                  }
              }
          }
      } catch (err) {
          console.error("Scale error:", err);
          alert("Failed to connect to scale.");
          setScaleConnected(false);
      }
  };

  // Web Serial Printer Driver
  const connectPrinter = async () => {
      try {
          const success = await printerService.current.connect();
          if (success) {
              setPrinterConnected(true);
          } else {
              alert("Could not connect to printer. Check cable/permissions.");
          }
      } catch (e: any) {
          alert("Printer Connection Failed: " + e.message);
      }
  };

  // --- Cart Logic ---

  const addToPosCart = (product: Product) => {
      setPosCart(prev => {
          const existing = prev.find(item => item.productId === product.id);
          // If KG item, adding duplicates creates separate line items for different weights (if scale active)
          if (product.unit === UnitType.KG) {
              const weight = liveWeight > 0 ? liveWeight : 1000; // Default 1kg if no scale
              return [...prev, {
                  id: Math.random().toString(36).substr(2, 9),
                  productId: product.id,
                  product,
                  quantity: 1,
                  weight
              }];
          }
          // If Unit item, increment qty
          if (existing) {
              return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, {
              id: Math.random().toString(36).substr(2, 9),
              productId: product.id,
              product,
              quantity: 1
          }];
      });
      setSearchQuery('');
      if (!editingItemId) searchInputRef.current?.focus();
  };

  const updateItemQty = (id: string, delta: number) => {
      setPosCart(prev => prev.map(item => {
          if (item.id === id) {
              return { ...item, quantity: Math.max(1, item.quantity + delta) };
          }
          return item;
      }));
  };

  const updateItemWeight = (id: string, newWeight: number) => {
      if (newWeight <= 0) return;
      setPosCart(prev => prev.map(item => {
          if (item.id === id) {
              return { ...item, weight: newWeight };
          }
          return item;
      }));
      setEditingItemId(null);
  };

  const removeItem = (id: string) => {
      setPosCart(prev => prev.filter(i => i.id !== id));
  };

  const calculateTotal = () => {
      return posCart.reduce((acc, item) => {
          if (item.product.unit === UnitType.KG && item.weight) {
              return acc + (item.product.price / 1000) * item.weight * item.quantity;
          }
          return acc + item.product.price * item.quantity;
      }, 0);
  };

  const total = calculateTotal();
  const changeDue = amountTendered ? parseFloat(amountTendered) - total : 0;

  // --- Transaction Logic ---

  const completeTransaction = async () => {
      if (posCart.length === 0) return;
      
      const newOrder = {
          id: Math.random().toString(36).substr(2, 9).toUpperCase(),
          customerId: 'manual',
          customerName: 'Walk-in Customer',
          items: posCart,
          total: total,
          status: OrderStatus.MANUAL_SALE,
          createdAt: new Date().toISOString(),
          deliveryType: 'COLLECTION' as any,
          isManual: true,
          messages: []
      };

      placeOrder(newOrder, 0);
      setLastOrder(newOrder);
      setPosCart([]);
      setAmountTendered('');
      setQrCodeUrl(null);
      setQrImage('');

      // Auto-Print if Driver is connected
      if (printerConnected) {
          const success = await printerService.current.printOrder(newOrder, config);
          if (!success) {
              alert("Auto-print failed. Opening manual receipt.");
              setShowReceipt(true); // Fallback
          } else {
              // Optional: Show a quick toast instead of full modal if print was successful
              // For now, we show modal to allow Digital Invoice generation if needed
              setShowReceipt(true);
          }
      } else {
          setShowReceipt(true);
      }
  };

  const handleGenerateDigitalInvoice = async () => {
      if (!lastOrder) return;
      setIsGeneratingInvoice(true);
      try {
          const pdfDataUri = await generateInvoicePDF(lastOrder, config, 'INVOICE');
          const fileName = `invoice_${lastOrder.id}.pdf`;
          
          if (config.firebaseConfig?.apiKey) {
              const url = await uploadFile(pdfDataUri, fileName, config);
              if (url && url.startsWith('http')) {
                  setQrCodeUrl(url);
              } else {
                  alert("Could not upload invoice to cloud. Please check settings.");
              }
          } else {
              alert("Cloud storage not configured. Cannot generate shareable QR code.");
          }
      } catch (e) {
          console.error(e);
          alert("Error generating invoice.");
      } finally {
          setIsGeneratingInvoice(false);
      }
  };

  useEffect(() => {
      if (qrCodeUrl) {
          QRCode.toDataURL(qrCodeUrl, { width: 300, margin: 1 })
            .then(url => setQrImage(url))
            .catch(err => console.error(err));
      }
  }, [qrCodeUrl]);

  // --- Render ---

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
      
      {/* Left Panel: Cart & Checkout */}
      <div className="w-2/5 flex flex-col border-r border-gray-300 bg-white shadow-xl z-10">
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold text-[#f4d300] tracking-widest">POS TERMINAL</h1>
                <p className="text-xs text-gray-400 font-mono">Operator: {currentUser?.name}</p>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setShowHistory(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700" title="History"><History size={20}/></button>
                <button 
                    onClick={connectPrinter} 
                    className={`p-2 rounded ${printerConnected ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`} 
                    title={printerConnected ? "Printer Connected" : "Connect Receipt Printer"}
                >
                    <Printer size={20}/>
                </button>
                <button 
                    onClick={connectScale} 
                    className={`p-2 rounded ${scaleConnected ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`} 
                    title={scaleConnected ? "Scale Connected" : "Connect Scale"}
                >
                    <Weight size={20}/>
                </button>
                <button onClick={() => { logout(); navigate('/admin-login'); }} className="p-2 bg-gray-800 rounded hover:bg-red-600 transition-colors" title="Logout">
                    <LogOut size={20}/>
                </button>
            </div>
        </div>

        {/* Live Scale Readout / Manual Input */}
        <div className="bg-gray-100 p-3 border-b border-gray-300 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-gray-500">Live Scale</span>
                {!scaleConnected && <span className="text-[9px] bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold uppercase">Manual Mode</span>}
                {printerConnected && <span className="text-[9px] bg-green-100 text-green-600 px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Usb size={10}/> Printer Ready</span>}
            </div>
            <div className="flex items-center gap-2">
                <input 
                    type="number"
                    value={liveWeight > 0 ? (liveWeight / 1000).toString() : ''}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setLiveWeight(val * 1000);
                        else setLiveWeight(0);
                    }}
                    placeholder="0.000"
                    className="font-mono text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg w-24 text-right px-2 py-1 outline-none focus:border-[#f4d300] focus:ring-1 focus:ring-[#f4d300]"
                    step="0.005"
                />
                <span className="text-sm font-bold text-gray-500">kg</span>
            </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {posCart.map((item, idx) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                    <div className="flex-1">
                        <p className="font-bold text-gray-900">{item.product.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                            {item.product.unit === UnitType.KG ? (
                                editingItemId === item.id ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number"
                                            value={editWeightValue}
                                            onChange={(e) => setEditWeightValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    updateItemWeight(item.id, parseFloat(editWeightValue));
                                                }
                                            }}
                                            autoFocus
                                            className="w-20 px-2 py-1 text-sm border border-[#f4d300] rounded focus:outline-none text-black bg-white"
                                        />
                                        <button 
                                            onClick={() => updateItemWeight(item.id, parseFloat(editWeightValue))}
                                            className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                                        >
                                            <Check size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => {
                                            setEditingItemId(item.id);
                                            setEditWeightValue(item.weight?.toString() || '');
                                        }}
                                        className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100 flex items-center gap-1 border border-blue-100"
                                    >
                                        {item.weight}g <Edit2 size={10} />
                                    </button>
                                )
                            ) : (
                                <span className="text-xs text-gray-500">R{item.product.price} each</span>
                            )}
                            {item.product.unit === UnitType.KG && <span className="text-xs text-gray-400">@ R{item.product.price}/kg</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center bg-white border border-gray-300 rounded">
                            <button onClick={() => updateItemQty(item.id, -1)} className="p-1 hover:bg-gray-100 text-black"><Minus size={14}/></button>
                            <span className="w-8 text-center font-bold text-sm text-black">{item.quantity}</span>
                            <button onClick={() => updateItemQty(item.id, 1)} className="p-1 hover:bg-gray-100 text-black"><Plus size={14}/></button>
                        </div>
                        <p className="font-bold w-16 text-right text-black">
                            R{((item.product.unit === UnitType.KG 
                                ? (item.product.price/1000) * (item.weight||0) 
                                : item.product.price) * item.quantity).toFixed(0)}
                        </p>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                    </div>
                </div>
            ))}
            {posCart.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <Scan size={48} />
                    <p className="mt-2 text-sm font-bold uppercase">Ready to Scan</p>
                </div>
            )}
        </div>

        {/* Totals & Payment */}
        <div className="p-6 bg-gray-50 border-t border-gray-300 space-y-4">
            <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-gray-500 uppercase">Total Due</span>
                <span className="text-4xl font-bold text-gray-900">R{total.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-2">
                <button onClick={() => setPaymentMethod('CASH')} className={`py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${paymentMethod === 'CASH' ? 'bg-green-600 text-white shadow-inner' : 'bg-white border border-gray-300 text-gray-700'}`}>
                    <Banknote size={18}/> CASH
                </button>
                <button onClick={() => setPaymentMethod('CARD')} className={`py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${paymentMethod === 'CARD' ? 'bg-blue-600 text-white shadow-inner' : 'bg-white border border-gray-300 text-gray-700'}`}>
                    <CreditCard size={18}/> CARD
                </button>
                <button onClick={() => setPaymentMethod('EFT')} className={`py-3 rounded font-bold text-sm flex flex-col items-center gap-1 ${paymentMethod === 'EFT' ? 'bg-purple-600 text-white shadow-inner' : 'bg-white border border-gray-300 text-gray-700'}`}>
                    <QrCode size={18}/> EFT/QR
                </button>
            </div>

            {paymentMethod === 'CASH' && (
                <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">R</span>
                        <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded font-bold text-lg outline-none focus:border-green-500 text-black bg-white"
                            placeholder="Amount Tendered"
                            value={amountTendered}
                            onChange={e => setAmountTendered(e.target.value)}
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-bold text-gray-500 uppercase">Change</p>
                        <p className={`text-xl font-bold ${changeDue < 0 ? 'text-red-500' : 'text-green-600'}`}>R{changeDue.toFixed(2)}</p>
                    </div>
                </div>
            )}

            <button 
                onClick={completeTransaction}
                disabled={posCart.length === 0 || (paymentMethod === 'CASH' && changeDue < 0)}
                className="w-full py-5 bg-[#f4d300] text-black font-bold text-xl rounded-lg shadow-lg hover:bg-yellow-400 active:scale-95 transition-all uppercase disabled:opacity-50 disabled:scale-100"
            >
                {printerConnected ? 'Print & Complete' : 'Complete Sale'}
            </button>
        </div>
      </div>

      {/* Right Panel: Product Browser */}
      <div className="flex-1 flex flex-col bg-gray-100">
          <div className="p-4 bg-white border-b border-gray-200 flex gap-4">
              <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input 
                    ref={searchInputRef}
                    className="w-full pl-12 pr-4 py-3 bg-gray-100 border-none rounded-xl text-lg outline-none focus:ring-2 focus:ring-[#f4d300] text-black placeholder-gray-400"
                    placeholder="Search product or enter PLU..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    autoFocus
                  />
              </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode && p.barcode.includes(searchQuery))).map(product => (
                      <button 
                        key={product.id} 
                        onClick={() => addToPosCart(product)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-[#f4d300] hover:shadow-md transition-all text-left flex flex-col h-40 justify-between group active:scale-95"
                      >
                          <span className="font-bold text-sm text-gray-800 line-clamp-2 leading-tight group-hover:text-[#f4d300]">{product.name}</span>
                          <div>
                              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">{product.unit}</span>
                              <span className="text-lg font-bold text-gray-900">R{product.price}</span>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
          <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-8 max-w-sm w-full space-y-6 text-center text-gray-900">
                  
                  {!qrImage ? (
                      <>
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                            <Printer size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Sale Complete</h2>
                            <p className="text-gray-500">Transaction #{lastOrder.id}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <button onClick={() => { window.print(); setShowReceipt(false); }} className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase hover:bg-gray-800 flex items-center justify-center gap-2">
                                <Printer size={18} /> Print Slip
                            </button>
                            
                            <button 
                                onClick={handleGenerateDigitalInvoice} 
                                disabled={isGeneratingInvoice}
                                className="w-full bg-blue-50 text-blue-600 border border-blue-100 py-4 rounded-xl font-bold uppercase hover:bg-blue-100 flex items-center justify-center gap-2"
                            >
                                {isGeneratingInvoice ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                                {isGeneratingInvoice ? 'Generating...' : 'QR Invoice'}
                            </button>

                            <button onClick={() => setShowReceipt(false)} className="w-full text-gray-400 font-bold uppercase text-xs hover:text-gray-600 py-2">
                                Skip / New Sale
                            </button>
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-gray-900">Scan for Invoice</h2>
                            <p className="text-gray-500 text-sm">PDF Invoice Generated</p>
                        </div>
                        <div className="flex justify-center p-4 bg-white">
                            <img src={qrImage} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <button onClick={() => setShowReceipt(false)} className="w-full bg-gray-200 text-gray-800 py-3 rounded font-bold uppercase hover:bg-gray-300">
                            Done
                        </button>
                      </>
                  )}
                  
                  {/* Hidden Print Area */}
                  <ReceiptTemplate order={lastOrder} />
              </div>
          </div>
      )}

      {/* History Modal */}
      {showHistory && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
              <div className="w-96 bg-white h-full p-6 shadow-2xl flex flex-col text-gray-900">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold">Transaction History</h2>
                      <button onClick={() => setShowHistory(false)}><X size={24}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-4">
                      {orders.filter(o => o.isManual).slice(0, 20).map(o => (
                          <div key={o.id} className="p-4 bg-gray-50 rounded border border-gray-200">
                              <div className="flex justify-between mb-1">
                                  <span className="font-bold">#{o.id}</span>
                                  <span className="text-green-600 font-bold">R{o.total.toFixed(2)}</span>
                              </div>
                              <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()}</p>
                              <button onClick={() => { setLastOrder(o); setShowReceipt(true); }} className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"><Printer size={12}/> Reprint Slip</button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default POSInterface;
