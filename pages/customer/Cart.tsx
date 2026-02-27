
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Trash2, ShoppingBag, MapPin, Truck, MessageCircle, Store, ArrowLeft, Coins, Loader2, CheckCircle, Navigation, Ticket, CreditCard, X, Phone, Mail, User, Package, Search, Check, Plus, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderStatus, CartItem, UnitType, PromoCode, Order } from '../../types';
import { validateAddress } from '../../services/geminiService';
import { playSound } from '../../services/soundService';

const Cart: React.FC = () => {
  const { cart, removeFromCart, updateCartItemQuantity, placeOrder, config, products, addToCart, promoCodes, clearCart, currentUser } = useApp();
  const navigate = useNavigate();
  const [deliveryType, setDeliveryType] = useState<'DELIVERY' | 'COLLECTION'>('COLLECTION');
  const [address, setAddress] = useState('');
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [requestedDate, setRequestedDate] = useState('');
  
  // Promo Code State
  const [promoInput, setPromoInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState('');
  
  // Address Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isAddressVerified, setIsAddressVerified] = useState(false);
  const [addressError, setAddressError] = useState('');
  
  // Dynamic Delivery Fee
  const [distanceKm, setDistanceKm] = useState(0);
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState(0);
  const [deliveryCoordinates, setDeliveryCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined);

  // Checkout Form State
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmPhone, setConfirmPhone] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const calculateItemPrice = (item: CartItem): number => {
    if (item.product.unit === UnitType.KG && item.weight) {
      const pricePerGram = item.product.price / 1000;
      return pricePerGram * item.weight * item.quantity;
    }
    return item.product.price * item.quantity;
  };

  const subtotal = cart.reduce((acc, item) => acc + calculateItemPrice(item), 0);
  
  // Apply Promo Logic
  let discountAmount = 0;
  
  // Delivery Fee Calculation
  let finalDeliveryFee = 0;
  if (deliveryType === 'DELIVERY') {
      if (config.deliveryCalculationMethod === 'DISTANCE' && distanceKm > 0) {
          // If distance based, use the greater of (Distance * Rate) or Base Fee
          finalDeliveryFee = Math.max(calculatedDeliveryFee, config.deliveryFee);
      } else if (config.deliveryCalculationMethod === 'ZONES' && config.deliveryZones && distanceKm > 0) {
          // Zone based calculation
          const zone = config.deliveryZones.find(z => 
              (z.minDistance === undefined || distanceKm >= z.minDistance) && 
              (z.maxDistance === undefined || distanceKm < z.maxDistance)
          );
          finalDeliveryFee = zone ? zone.fee : config.deliveryFee;
      } else {
          // Fixed Fee or fallback
          finalDeliveryFee = config.deliveryFee;
      }
  }

  if (appliedCode) {
      if (appliedCode.type === 'PERCENTAGE_OFF') {
          discountAmount += subtotal * (appliedCode.value / 100);
      } else if (appliedCode.type === 'FLAT_DISCOUNT') {
          discountAmount += appliedCode.value;
      } else if (appliedCode.type === 'FREE_DELIVERY') {
          finalDeliveryFee = 0;
      }
  }

  // Loyalty Logic (Stacked with Promo)
  const pointValue = 5; // R5 per point
  const loyaltyDiscount = pointsToRedeem * pointValue;
  const totalDiscount = discountAmount + loyaltyDiscount;
  
  const total = Math.max(0, subtotal - totalDiscount + finalDeliveryFee);
  
  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value) || 0;
      if (val < 0 || (val * pointValue) > (subtotal - discountAmount)) return; 
      setPointsToRedeem(val);
  };

  const handleApplyPromo = () => {
      if (!promoInput) return;
      
      const code = promoCodes.find(c => c.code.toUpperCase() === promoInput.toUpperCase());
      
      if (!code) {
          setPromoError('Invalid code.');
          setAppliedCode(null);
          return;
      }
      
      if (!code.active) {
          setPromoError('This code is no longer active.');
          setAppliedCode(null);
          return;
      }
      
      setAppliedCode(code);
      setPromoError('');
  };

  const handleAddressSearch = async () => {
      if (!searchQuery) return;
      setIsSearchingAddress(true);
      setAddressError('');
      setIsAddressVerified(false);

      const result = await validateAddress(searchQuery, config.deliveryAreas, config);
      
      if (result.error) {
          setAddressError(result.error);
      } else if (result.isValidLocation) {
          setAddress(result.address);
          setIsAddressVerified(true);
          if (result.distanceKm) {
              setDistanceKm(result.distanceKm);
              if (config.deliveryCalculationMethod === 'DISTANCE') {
                  const rate = config.deliveryRatePerKm || 10;
                  setCalculatedDeliveryFee(result.distanceKm * rate);
              } else if (config.deliveryCalculationMethod === 'ZONES' && config.deliveryZones) {
                  const zone = config.deliveryZones.find(z => 
                      (z.minDistance === undefined || result.distanceKm! >= z.minDistance) && 
                      (z.maxDistance === undefined || result.distanceKm! < z.maxDistance)
                  );
                  setCalculatedDeliveryFee(zone ? zone.fee : config.deliveryFee);
              }
          }
          if (result.coordinates) {
              setDeliveryCoordinates(result.coordinates);
          }
      } else {
          setAddressError("Location appears to be outside our delivery zones.");
          setAddress(result.address);
      }
      setIsSearchingAddress(false);
  };

  const handleUseCurrentLocation = () => {
      if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser');
          return;
      }
      setIsSearchingAddress(true);
      setAddressError('');
      navigator.geolocation.getCurrentPosition(
          async (position) => {
              const result = await validateAddress('', config.deliveryAreas, config, {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
              });
              if (result.error) {
                  setAddressError(result.error);
              } else if (result.isValidLocation) {
                  setAddress(result.address);
                  setIsAddressVerified(true);
                  setSearchQuery('');
                  if (result.distanceKm) {
                      setDistanceKm(result.distanceKm);
                      if (config.deliveryCalculationMethod === 'DISTANCE') {
                          const rate = config.deliveryRatePerKm || 10;
                          setCalculatedDeliveryFee(result.distanceKm * rate);
                      } else if (config.deliveryCalculationMethod === 'ZONES' && config.deliveryZones) {
                          const zone = config.deliveryZones.find(z => 
                              (z.minDistance === undefined || result.distanceKm! >= z.minDistance) && 
                              (z.maxDistance === undefined || result.distanceKm! < z.maxDistance)
                          );
                          setCalculatedDeliveryFee(zone ? zone.fee : config.deliveryFee);
                      }
                  }
                  if (result.coordinates) {
                      setDeliveryCoordinates(result.coordinates);
                  }
              } else {
                  setAddressError("You appear to be outside our delivery zones.");
                  setAddress(result.address);
              }
              setIsSearchingAddress(false);
          },
          (error) => {
              setAddressError("Could not get your location.");
              setIsSearchingAddress(false);
          }
      );
  };

  const handleInitialCheckout = () => {
    if (!currentUser) {
        navigate('/auth');
        return;
    }

    if (deliveryType === 'DELIVERY' && !address) {
        alert("Please provide a delivery address.");
        return;
    }

    // Pre-fill user details
    setConfirmName(currentUser.name || '');
    setConfirmPhone(currentUser.phone || '');
    setConfirmEmail(currentUser.email || '');

    setShowCheckoutForm(true);
  };

  const processOrder = () => {
    if (!confirmName) {
        alert("Please enter your name and surname.");
        return;
    }

    if (!requestedDate || !deliveryTime) {
        alert("Please select a date and time for " + (deliveryType === 'DELIVERY' ? 'delivery' : 'collection') + ".");
        return;
    }

    const orderId = `MD-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newOrder: Order = {
        id: orderId,
        customerId: currentUser?.id || 'anonymous',
        customerName: confirmName,
        contactPhone: confirmPhone,
        contactEmail: confirmEmail,
        items: [...cart],
        total: total,
        status: OrderStatus.PENDING,
        createdAt: new Date().toISOString(),
        deliveryType: deliveryType,
        deliveryAddress: deliveryType === 'DELIVERY' ? address : undefined,
        deliveryFee: finalDeliveryFee,
        messages: [],
        promoCodeApplied: appliedCode?.id
    };

    const itemLines = cart.map(item => {
      let desc = `- ${item.quantity} x `;
      if (item.product.unit === UnitType.KG && item.weight) {
        desc += `${item.weight}g ${item.product.name}`;
      } else {
        desc += item.product.name;
      }
      if (item.selectedOptions && item.selectedOptions.length > 0) {
          desc += ` [${item.selectedOptions.join(', ')}]`;
      }
      if (item.vacuumPacked) desc += ` (Vacuum Packed)`;
      return desc;
    }).join('\n');

    const totalLine = `Total: R${total.toFixed(2)}`;
    const deliveryLine = deliveryType === 'DELIVERY' ? `Delivery Fee: R${finalDeliveryFee.toFixed(2)}` : 'Collection';
    const addressLine = deliveryType === 'DELIVERY' ? `Address: ${address}` : '';
    const detailsLine = `Order #: ${orderId}\nName: ${confirmName}\nEmail: ${confirmEmail || 'N/A'}\nPhone: ${confirmPhone || 'N/A'}\nRequested ${deliveryType === 'DELIVERY' ? 'Delivery' : 'Collection'}: ${requestedDate} at ${deliveryTime}`;

    const message = `*NEW ORDER FROM MEAT DEPOT*\n\n${detailsLine}\n\n*Items:*\n${itemLines}\n\n${deliveryLine}\n${addressLine}\n*${totalLine}*\n\n_Please note: For items sold by weight (e.g., steaks, biltong), the price is an estimation. The final weight and price may vary slightly._`;
    
    const phone = '27632148131'; 
    
    // Save to store
    placeOrder(newOrder, appliedCode?.id);
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <button onClick={() => navigate('/shop')} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
                <h1 className="brand-font text-4xl font-bold italic text-white">Your Basket</h1>
                <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">{cart.length} Premium Items</p>
            </div>
        </div>
        {cart.length > 0 && (
            <button 
                onClick={() => {
                    if (window.confirm('Are you sure you want to clear your cart?')) {
                        clearCart();
                    }
                }} 
                className="text-white/40 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear Cart</span>
            </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center">
            <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-white/10 border border-white/5">
                <ShoppingBag size={64} strokeWidth={1} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Your basket is empty</h2>
                <p className="text-white/40 text-sm">Looks like you haven't made your choice yet.</p>
            </div>
            <button 
                onClick={() => navigate('/shop')}
                className="bg-[#f4d300] text-black px-10 py-4 rounded-3xl font-bold text-xs tracking-widest uppercase shadow-lg shadow-[#f4d300]/20 hover:scale-105 transition-transform"
            >
                Start Shopping
            </button>
        </div>
      ) : (
        <div className="space-y-8">
            <div className="space-y-4">
                {cart.map(item => {
                    const price = calculateItemPrice(item);
                    return (
                        <div key={item.id} className="bg-[#121212] p-4 rounded-[25px] border border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4 group">
                            <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                                <div className="w-20 h-20 bg-gray-800 rounded-2xl overflow-hidden shrink-0">
                                    <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-main font-bold text-white text-sm truncate">{item.product.name}</h3>
                                    <div className="flex items-baseline gap-2 mt-1">
                                        <p className="text-[#f4d300] text-sm font-bold">R{price.toFixed(2)}</p>
                                        {item.product.unit === UnitType.KG && (
                                            <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">(Est.)</span>
                                        )}
                                    </div>
                                    <div className="text-white/40 text-[10px] mt-1 space-y-0.5">
                                        {item.product.unit === UnitType.KG && item.weight ? (
                                            <p>{item.weight}g @ R{item.product.price}/kg</p>
                                        ) : (
                                            <p>Unit</p>
                                        )}
                                        {item.selectedOptions && item.selectedOptions.length > 0 && <p>• {item.selectedOptions.join(', ')}</p>}
                                        {item.vacuumPacked && <p className="text-blue-400 font-bold flex items-center gap-1"><Package size={10}/> Vacuum Packed</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                                <div className="flex items-center bg-white/5 rounded-2xl p-1.5 border border-white/10">
                                    <button 
                                        onClick={() => {
                                            if (item.quantity === 1) {
                                                if (window.confirm('Remove this item from your cart?')) {
                                                    updateCartItemQuantity(item.id, 0);
                                                }
                                            } else {
                                                updateCartItemQuantity(item.id, item.quantity - 1);
                                            }
                                        }}
                                        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-black hover:bg-[#f4d300] rounded-xl transition-colors"
                                    >
                                        <Minus size={20} strokeWidth={3} />
                                    </button>
                                    <input 
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val > 0) {
                                                updateCartItemQuantity(item.id, val);
                                            } else if (e.target.value === '') {
                                                // Allow temporary empty state while typing
                                            }
                                        }}
                                        onBlur={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (isNaN(val) || val <= 0) {
                                                updateCartItemQuantity(item.id, 1);
                                            }
                                        }}
                                        className="w-12 text-center text-lg font-bold text-white bg-transparent outline-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button 
                                        onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                                        className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-black hover:bg-[#f4d300] rounded-xl transition-colors"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                                <button 
                                    onClick={() => {
                                        if (window.confirm('Remove this item from your cart?')) {
                                            removeFromCart(item.id);
                                        }
                                    }} 
                                    className="p-4 text-white/20 hover:text-red-500 transition-colors bg-white/5 hover:bg-red-500/10 rounded-2xl"
                                    title="Remove item"
                                >
                                    <Trash2 size={24} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Delivery/Collection */}
            <div className="bg-[#121212] p-6 rounded-[32px] border border-white/5 space-y-6">
                <h3 className="text-white font-bold text-sm uppercase tracking-widest flex items-center gap-2">
                    <Truck size={16} className="text-[#f4d300]"/> Delivery Options
                </h3>
                
                <div className="flex flex-col sm:flex-row gap-3">
                    <button 
                        onClick={() => setDeliveryType('COLLECTION')}
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${deliveryType === 'COLLECTION' ? 'bg-[#f4d300] border-[#f4d300] text-black shadow-lg transform -skew-x-6' : 'bg-black/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                    >
                        <span className={deliveryType === 'COLLECTION' ? 'transform skew-x-6 block' : ''}>Collection</span>
                    </button>
                    <button 
                        onClick={() => setDeliveryType('DELIVERY')}
                        className={`flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${deliveryType === 'DELIVERY' ? 'bg-[#f4d300] border-[#f4d300] text-black shadow-lg transform -skew-x-6' : 'bg-black/50 border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
                    >
                        <span className={deliveryType === 'DELIVERY' ? 'transform skew-x-6 block' : ''}>Delivery</span>
                    </button>
                </div>

                {deliveryType === 'COLLECTION' ? (
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center space-y-3">
                        <Store size={32} className="mx-auto text-[#f4d300]" />
                        <p className="text-white font-bold text-base">Collection at Meat Depot</p>
                        <p className="text-white/50 text-sm">{config.businessDetails?.addressLine1 || "63 Clarence Road, Westering"}</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Delivery Address</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                                    <input 
                                        className="w-full pl-12 pr-4 py-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white text-base outline-none focus:border-[#f4d300] transition-colors"
                                        placeholder="Search address (Area, Street)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={handleUseCurrentLocation} className="flex-1 sm:flex-none bg-white/10 text-white p-4 rounded-2xl hover:bg-white/20 transition-colors flex items-center justify-center border-2 border-transparent hover:border-white/30">
                                        <Navigation size={20} />
                                    </button>
                                    <button onClick={handleAddressSearch} className="flex-1 sm:flex-none bg-[#f4d300] text-black p-4 rounded-2xl hover:bg-yellow-400 transition-colors flex items-center justify-center border-2 border-[#f4d300]" disabled={isSearchingAddress}>
                                        {isSearchingAddress ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                                    </button>
                                </div>
                            </div>
                            {addressError && <p className="text-red-500 text-xs font-bold mt-2">{addressError}</p>}
                            {isAddressVerified && (
                                <div className="bg-green-500/10 border-2 border-green-500/30 p-4 rounded-2xl flex items-start gap-4 mt-4">
                                    <CheckCircle size={20} className="text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-500 text-sm font-black uppercase tracking-widest">Location Verified</p>
                                        <p className="text-white/80 text-sm mt-1">{address}</p>
                                        <div className="flex gap-4 mt-2">
                                            <p className="text-white/50 text-xs font-bold bg-black/50 px-2 py-1 rounded-md">Distance: {distanceKm.toFixed(1)}km</p>
                                            <p className="text-[#f4d300] text-xs font-bold bg-black/50 px-2 py-1 rounded-md">Fee: R{finalDeliveryFee.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Preferred Date</label>
                    <input 
                        type="date" 
                        className="w-full p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white text-base outline-none focus:border-[#f4d300] transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                        value={requestedDate}
                        onChange={(e) => setRequestedDate(e.target.value)}
                    />
                </div>
            </div>

            {/* Promo & Loyalty */}
            <div className="bg-[#121212] p-6 rounded-[32px] border border-white/5 space-y-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Promo Code</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
                            <input 
                                className="w-full pl-12 pr-4 py-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white text-base outline-none focus:border-[#f4d300] uppercase transition-colors"
                                placeholder="Enter Code"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value)}
                            />
                        </div>
                        <button onClick={handleApplyPromo} className="bg-white/10 text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-colors border-2 border-transparent hover:border-white/30">Apply</button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs font-bold mt-2">{promoError}</p>}
                    {appliedCode && <p className="text-green-500 text-sm font-bold flex items-center gap-2 mt-2"><Check size={16}/> Code Applied: {appliedCode.code}</p>}
                </div>
            </div>

            {/* Totals */}
            <div className="space-y-3 p-4">
                <div className="flex justify-between text-white/60 text-sm">
                    <span>Subtotal</span>
                    <span>R{subtotal.toFixed(2)}</span>
                </div>
                {finalDeliveryFee > 0 && (
                    <div className="flex justify-between text-white/60 text-sm">
                        <span>Delivery Fee</span>
                        <span>R{finalDeliveryFee.toFixed(2)}</span>
                    </div>
                )}
                {totalDiscount > 0 && (
                    <div className="flex justify-between text-[#f4d300] text-sm">
                        <span>Discount</span>
                        <span>-R{totalDiscount.toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between items-end pt-4 border-t border-white/10">
                    <span className="text-white font-bold text-lg">Total</span>
                    <span className="text-4xl font-bold text-white tracking-tighter">R{total.toFixed(2)}</span>
                </div>
                <p className="text-white/40 text-[10px] text-center mt-2 italic">
                    * For items sold by weight (e.g., steaks, biltong), the price is an estimation. The final weight and price may vary slightly.
                </p>
            </div>

            <button 
                onClick={handleInitialCheckout}
                className="w-full bg-[#f4d300] text-black py-5 rounded-[30px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#f4d300]/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
            >
                <MessageCircle size={20} />
                Order on WhatsApp
            </button>
        </div>
      )}

      {/* Checkout Form Modal */}
      {showCheckoutForm && (
          <div className="fixed inset-0 bg-black/90 glass z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#121212] w-full max-w-md rounded-[40px] border border-white/10 shadow-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <h3 className="text-xl font-bold text-white">Confirm Details</h3>
                      <button onClick={() => setShowCheckoutForm(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <p className="text-white/60 text-sm">
                      Please provide your details to complete the order via WhatsApp.
                  </p>

                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Name & Surname</label>
                          <div className="relative">
                              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20}/>
                              <input 
                                  className="w-full pl-12 p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white outline-none focus:border-[#f4d300] transition-colors"
                                  placeholder="John Doe"
                                  value={confirmName}
                                  onChange={e => setConfirmName(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">WhatsApp Number</label>
                          <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20}/>
                              <input 
                                  className="w-full pl-12 p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white outline-none focus:border-[#f4d300] transition-colors"
                                  placeholder="082 123 4567"
                                  value={confirmPhone}
                                  onChange={e => setConfirmPhone(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Email Address (Optional)</label>
                          <div className="relative">
                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20}/>
                              <input 
                                  className="w-full pl-12 p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white outline-none focus:border-[#f4d300] transition-colors"
                                  placeholder="john@example.com"
                                  value={confirmEmail}
                                  onChange={e => setConfirmEmail(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Date</label>
                              <input 
                                  type="date"
                                  className="w-full p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white outline-none focus:border-[#f4d300] text-sm transition-colors"
                                  value={requestedDate}
                                  onChange={e => setRequestedDate(e.target.value)}
                                  min={new Date().toISOString().split('T')[0]}
                              />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Time</label>
                              <input 
                                  type="time"
                                  className="w-full p-4 bg-black/50 border-2 border-white/10 rounded-2xl text-white outline-none focus:border-[#f4d300] text-sm transition-colors"
                                  value={deliveryTime}
                                  onChange={e => setDeliveryTime(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={processOrder}
                      className="w-full bg-[#f4d300] text-black py-5 rounded-[25px] font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-[#f4d300]/20"
                  >
                      <MessageCircle size={20} />
                      Send Order to WhatsApp
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Cart;
