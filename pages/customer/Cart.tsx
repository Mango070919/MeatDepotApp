
import React, { useState } from 'react';
import { useApp } from '../../store';
import { Trash2, ShoppingBag, MapPin, Truck, MessageCircle, Store, ArrowLeft, Coins, Loader2, CheckCircle, Navigation, Ticket, CreditCard, X, Phone, Mail, User, Package, Search, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OrderStatus, CartItem, UnitType, PromoCode } from '../../types';
import { validateAddress } from '../../services/geminiService';
import { playSound } from '../../services/soundService';

const Cart: React.FC = () => {
  const { cart, removeFromCart, placeOrder, currentUser, config, products, addToCart, promoCodes } = useApp();
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

  // Payment Link Request Modal State
  const [showPaymentRequestModal, setShowPaymentRequestModal] = useState(false);
  const [confirmName, setConfirmName] = useState(currentUser?.name || '');
  const [confirmPhone, setConfirmPhone] = useState(currentUser?.phone || '');
  const [confirmEmail, setConfirmEmail] = useState(currentUser?.email || '');

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
      const userPoints = currentUser?.loyaltyPoints || 0;
      if (val < 0 || val > userPoints || (val * pointValue) > (subtotal - discountAmount)) return; 
      setPointsToRedeem(val);
  };

  const handleApplyPromo = () => {
      if (!promoInput) return;
      if (!currentUser) {
          alert("Please login to use codes.");
          return;
      }
      
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
      
      if (code.usedBy.includes(currentUser.id)) {
          setPromoError('You have already used this code.');
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
              const rate = config.deliveryRatePerKm || 10;
              setCalculatedDeliveryFee(result.distanceKm * rate);
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
                      const rate = config.deliveryRatePerKm || 10;
                      setCalculatedDeliveryFee(result.distanceKm * rate);
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
        alert("Please login to complete your order.");
        navigate('/login');
        return;
    }

    if (deliveryType === 'DELIVERY' && !address) {
        alert("Please provide a delivery address.");
        return;
    }

    if (config.paymentEnabled) {
        // Show modal to confirm details for payment link
        setShowPaymentRequestModal(true);
    } else {
        // Proceed with standard WhatsApp order
        processOrder(false);
    }
  };

  const processOrder = (isPaymentRequest: boolean) => {
    let finalCodeString = appliedCode ? appliedCode.code : '';
    if (pointsToRedeem > 0) {
        const loyaltyString = `LOYALTY-${currentUser?.id.substring(0,4)}-${Date.now().toString().substring(8)}`;
        finalCodeString = finalCodeString ? `${finalCodeString} + ${loyaltyString}` : loyaltyString;
    }

    const order = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerId: currentUser?.id || '',
      customerName: isPaymentRequest ? confirmName : (currentUser?.name || ''),
      items: [...cart],
      total,
      discountUsed: totalDiscount,
      pointsEarned: Math.floor(total / 500),
      status: isPaymentRequest ? OrderStatus.PAYMENT_PENDING : OrderStatus.PENDING,
      createdAt: new Date().toISOString(),
      deliveryType,
      deliveryAddress: deliveryType === 'DELIVERY' ? address : '',
      deliveryCoordinates: deliveryType === 'DELIVERY' ? deliveryCoordinates : undefined,
      distanceKm: deliveryType === 'DELIVERY' ? distanceKm : undefined,
      deliveryFee: finalDeliveryFee,
      promoCodeApplied: finalCodeString,
      messages: [],
      // Store contact details for admin to use in Payment Manager
      contactPhone: isPaymentRequest ? confirmPhone : currentUser?.phone,
      contactEmail: isPaymentRequest ? confirmEmail : currentUser?.email
    };

    if (isPaymentRequest) {
        // --- PAYMENT LINK REQUEST FLOW ---
        placeOrder(order, pointsToRedeem, appliedCode?.id);
        
        // Trigger Email
        fetch('/api/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order, config })
        }).catch(console.error);

        setShowPaymentRequestModal(false);
        navigate('/payment/success'); // Reuse success page or create a specific "Request Sent" page
    } else {
        // --- WHATSAPP FLOW ---
        placeOrder(order, pointsToRedeem, appliedCode?.id);
        
        // Trigger Email
        fetch('/api/send-order-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order, config })
        }).catch(console.error);

        playSound('success');

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
        }).join('%0A');

        let message = `Hi Meat Depot, I'd like to place an order:%0A%0A${itemLines}%0A%0ATotal: R${total.toFixed(2)}`;
        
        if (deliveryType === 'DELIVERY') {
            message += `%0A%0ADelivery Address:%0A${address}`;
            if (deliveryCoordinates) {
                message += `%0A(Location: https://maps.google.com/?q=${deliveryCoordinates.lat},${deliveryCoordinates.lng})`;
            }
        } else {
            message += `%0A%0ACollection at Store`;
        }
        
        if (requestedDate) message += `%0ARequested Date: ${requestedDate}`;
        if (appliedCode) message += `%0APromo Code: ${appliedCode.code}`;
        
        const phone = config.businessDetails?.contactNumber?.replace(/[^0-9]/g, '') || '844012488038318'; 
        
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        
        navigate('/orders');
    }
  };

  return (
    <div className="min-h-screen bg-black -mx-4 px-6 pt-6 pb-20 space-y-8 animate-in slide-in-from-bottom duration-500">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/shop')} className="p-3 bg-white/5 rounded-full shadow-sm border border-white/10 text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
            <h1 className="brand-font text-4xl font-bold italic text-white">Your Basket</h1>
            <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.4em] uppercase opacity-70">{cart.length} Premium Items</p>
        </div>
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
                        <div key={item.id} className="bg-[#121212] p-4 rounded-[25px] border border-white/5 flex items-center gap-4 group">
                            <div className="w-20 h-20 bg-gray-800 rounded-2xl overflow-hidden shrink-0">
                                <img src={item.product.image} className="w-full h-full object-cover" alt={item.product.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-white text-sm truncate">{item.product.name}</h3>
                                <p className="text-[#f4d300] text-xs font-bold mt-1">R{price.toFixed(2)}</p>
                                <div className="text-white/40 text-[10px] mt-1 space-y-0.5">
                                    <p>{item.product.unit === UnitType.KG && item.weight ? `${item.weight}g` : 'Unit'} </p>
                                    {item.selectedOptions && item.selectedOptions.length > 0 && <p>• {item.selectedOptions.join(', ')}</p>}
                                    {item.vacuumPacked && <p className="text-blue-400 font-bold flex items-center gap-1"><Package size={10}/> Vacuum Packed</p>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="bg-white/10 text-white px-3 py-1 rounded-lg text-xs font-bold">x{item.quantity}</span>
                                <button onClick={() => removeFromCart(item.id)} className="p-2 text-white/20 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
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
                
                <div className="flex bg-black/50 p-1 rounded-2xl border border-white/10">
                    <button 
                        onClick={() => setDeliveryType('COLLECTION')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryType === 'COLLECTION' ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        Collection
                    </button>
                    <button 
                        onClick={() => setDeliveryType('DELIVERY')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${deliveryType === 'DELIVERY' ? 'bg-[#f4d300] text-black shadow-lg' : 'text-white/40 hover:text-white'}`}
                    >
                        Delivery
                    </button>
                </div>

                {deliveryType === 'COLLECTION' ? (
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center space-y-2">
                        <Store size={24} className="mx-auto text-white/30" />
                        <p className="text-white font-bold text-sm">Collection at Meat Depot</p>
                        <p className="text-white/50 text-xs">{config.businessDetails?.addressLine1 || "63 Clarence Road, Westering"}</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Delivery Address</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                                    <input 
                                        className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#f4d300]"
                                        placeholder="Search address (Area, Street)"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddressSearch()}
                                    />
                                </div>
                                <button onClick={handleUseCurrentLocation} className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-colors">
                                    <Navigation size={18} />
                                </button>
                                <button onClick={handleAddressSearch} className="bg-[#f4d300] text-black p-3 rounded-xl hover:bg-yellow-400 transition-colors" disabled={isSearchingAddress}>
                                    {isSearchingAddress ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </button>
                            </div>
                            {addressError && <p className="text-red-500 text-xs font-bold">{addressError}</p>}
                            {isAddressVerified && (
                                <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-xl flex items-start gap-3">
                                    <CheckCircle size={16} className="text-green-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-green-500 text-xs font-bold">Location Verified</p>
                                        <p className="text-white/60 text-[10px]">{address}</p>
                                        <p className="text-white/40 text-[10px] mt-1">Distance: {distanceKm.toFixed(1)}km | Fee: R{finalDeliveryFee.toFixed(2)}</p>
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
                        className="w-full p-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#f4d300]"
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
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                            <input 
                                className="w-full pl-10 pr-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-[#f4d300] uppercase"
                                placeholder="Enter Code"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value)}
                            />
                        </div>
                        <button onClick={handleApplyPromo} className="bg-white/10 text-white px-4 rounded-xl text-xs font-bold uppercase hover:bg-white/20">Apply</button>
                    </div>
                    {promoError && <p className="text-red-500 text-xs font-bold">{promoError}</p>}
                    {appliedCode && <p className="text-green-500 text-xs font-bold flex items-center gap-1"><Check size={12}/> Code Applied: {appliedCode.code}</p>}
                </div>

                {currentUser && currentUser.loyaltyPoints > 0 && (
                    <div className="space-y-2 pt-4 border-t border-white/10">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex justify-between">
                            <span>Use Loyalty Points</span>
                            <span className="text-[#f4d300]">{currentUser.loyaltyPoints} Available (R{currentUser.loyaltyPoints * pointValue})</span>
                        </label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="number" 
                                className="w-20 p-2 bg-black/50 border border-white/10 rounded-xl text-center text-white font-bold outline-none"
                                value={pointsToRedeem}
                                onChange={handlePointsChange}
                                min={0}
                                max={currentUser.loyaltyPoints}
                            />
                            <input 
                                type="range" 
                                className="flex-1 accent-[#f4d300] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                value={pointsToRedeem}
                                onChange={handlePointsChange}
                                min={0}
                                max={Math.min(currentUser.loyaltyPoints, Math.floor(subtotal / pointValue))}
                            />
                        </div>
                    </div>
                )}
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
            </div>

            <button 
                onClick={handleInitialCheckout}
                className="w-full bg-[#f4d300] text-black py-5 rounded-[30px] font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#f4d300]/20 flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform"
            >
                {config.paymentEnabled ? <CreditCard size={20} /> : <MessageCircle size={20} />}
                {config.paymentEnabled ? 'Checkout & Request Payment' : 'Order on WhatsApp'}
            </button>
        </div>
      )}

      {/* Payment Link Request Modal */}
      {showPaymentRequestModal && (
          <div className="fixed inset-0 bg-black/90 glass z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="bg-[#121212] w-full max-w-md rounded-[40px] border border-white/10 shadow-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <h3 className="text-xl font-bold text-white">Confirm Details</h3>
                      <button onClick={() => setShowPaymentRequestModal(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                  </div>
                  
                  <p className="text-white/60 text-sm">
                      We will use these details to send you a secure payment link via WhatsApp or Email shortly.
                  </p>

                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Full Name</label>
                          <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                              <input 
                                  className="w-full pl-10 p-3 bg-black/50 border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                  value={confirmName}
                                  onChange={e => setConfirmName(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">WhatsApp Number</label>
                          <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                              <input 
                                  className="w-full pl-10 p-3 bg-black/50 border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                  value={confirmPhone}
                                  onChange={e => setConfirmPhone(e.target.value)}
                              />
                          </div>
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">Email Address</label>
                          <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16}/>
                              <input 
                                  className="w-full pl-10 p-3 bg-black/50 border border-white/20 rounded-xl text-white outline-none focus:border-[#f4d300]"
                                  value={confirmEmail}
                                  onChange={e => setConfirmEmail(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  <button 
                      onClick={() => processOrder(true)}
                      className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-105 transition-transform"
                  >
                      Confirm & Place Order
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Cart;
