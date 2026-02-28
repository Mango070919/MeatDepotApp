
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { CATEGORIES } from '../../constants';
import { Search, ShoppingCart, Info, Plus, Minus, X, Weight, ArrowLeft, Star, Settings, Trash2, Edit2, Lock, ChevronDown, Heart, Repeat, Check, Share2, MessageCircle, Package, ShieldCheck, Truck, Monitor, MapPin, Loader2 } from 'lucide-react';
import { Product, UnitType, Review, UserRole, User } from '../../types';
import { validateAddress } from '../../services/geminiService';

// StarRating component
const StarRating: React.FC<{ rating: number; size?: number }> = ({ rating, size = 16 }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={size}
        className={i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
      />
    ))}
  </div>
);

// ProductReviews component
const ProductReviews: React.FC<{ product: Product }> = ({ product }) => {
    const { currentUser, orders, addReview, users } = useApp();
    const [showForm, setShowForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');

    const hasPurchased = currentUser && orders.some(o => o.customerId === currentUser.id && o.items.some(item => item.productId === product.id));
    const hasReviewed = currentUser && product.reviews?.some(r => r.userId === currentUser.id);

    const handleSubmit = () => {
        if (!currentUser || !hasPurchased) return;
        const newReview: Review = {
            id: Math.random().toString(36).substr(2, 9),
            userId: currentUser.id,
            userName: currentUser.name,
            rating,
            comment,
            timestamp: new Date().toISOString(),
            visible: true // Default to visible
        };
        addReview(product.id, newReview);
        setShowForm(false);
    };
    
    // Filter reviews: Visible to public OR (is Admin OR is Author)
    const reviews = (product.reviews || []).filter(r => 
        r.visible !== false || 
        (currentUser?.role === UserRole.ADMIN) || 
        (currentUser?.id === r.userId)
    );
    
    const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;

    const getReviewerDisplay = (userId: string, fallbackName: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return { name: fallbackName, role: UserRole.CUSTOMER, pic: null };
        return { 
            name: user.name, 
            role: user.role, 
            pic: user.profilePicture 
        };
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <h3 className="brand-font text-2xl font-bold italic text-white">Customer Reviews</h3>
                     <div className="flex items-center gap-2">
                        <StarRating rating={avgRating} size={20}/>
                        <span className="text-white/40 text-sm font-bold">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
                     </div>
                </div>
                 {hasPurchased && !hasReviewed ? (
                     <button onClick={() => setShowForm(true)} className="bg-white/5 text-white/70 px-6 py-3 rounded-2xl font-bold text-xs tracking-widest hover:bg-white/10 hover:text-white transition-colors uppercase">
                        Leave a Review
                     </button>
                 ) : !hasPurchased && currentUser && (
                     <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl text-white/30 text-[10px] font-bold uppercase tracking-wider border border-white/5">
                         <Lock size={12}/>
                         <span>Order item to review</span>
                     </div>
                 )}
            </div>
            
            {showForm && (
                <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-white">Your Review</h4>
                        <button onClick={() => setShowForm(false)} className="p-2 text-white/50 hover:text-white"><X size={18}/></button>
                    </div>
                    <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(star => (
                            <button key={star} onClick={() => setRating(star)}>
                                <Star size={24} className={star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'} />
                            </button>
                        ))}
                    </div>
                    <textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="Optional: Share your experience..." className="w-full bg-black/50 text-white/80 p-4 rounded-xl min-h-[100px] outline-none focus:ring-2 focus:ring-[#f4d300] border border-white/10"></textarea>
                    <button onClick={handleSubmit} className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold uppercase tracking-widest text-sm">Submit Review</button>
                </div>
            )}
            
            <div className="space-y-4 max-h-96 overflow-y-auto no-scrollbar">
                {reviews.length > 0 ? reviews.map(review => {
                    const { name, role, pic } = getReviewerDisplay(review.userId, review.userName);
                    const isStaff = role !== UserRole.CUSTOMER;

                    return (
                        <div key={review.id} className={`bg-white/5 p-6 rounded-3xl border ${review.visible === false ? 'border-red-500/30 bg-red-900/10' : 'border-white/10'}`}>
                            <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border ${isStaff ? 'border-[#f4d300]' : 'border-white/10'} bg-[#1a1a1a]`}>
                                    {pic ? (
                                        <img src={pic} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className={`font-bold text-sm ${isStaff ? 'text-[#f4d300]' : 'text-white'}`}>{name.charAt(0)}</span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold text-sm block ${isStaff ? 'text-[#f4d300]' : 'text-white'}`}>{name}</span>
                                        {isStaff && (
                                            <div className="flex items-center gap-1 bg-[#f4d300] text-black px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide">
                                                {role === UserRole.ADMIN && <ShieldCheck size={8} />}
                                                {role === UserRole.DRIVER && <Truck size={8} />}
                                                {role === UserRole.CASHIER && <Monitor size={8} />}
                                                {role}
                                            </div>
                                        )}
                                    </div>
                                    {review.visible === false && <span className="text-[9px] text-red-400 font-bold uppercase">Hidden from public</span>}
                                </div>
                            </div>
                                <span className="text-white/40 text-xs">{new Date(review.timestamp).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2 pl-[52px]">
                                <StarRating rating={review.rating} size={14}/>
                            </div>
                            {review.comment && <p className="text-white/70 text-sm italic pl-[52px]">"{review.comment}"</p>}
                            
                            {/* Admin Reply */}
                            {review.adminReply && (
                                <div className="ml-[52px] mt-4 bg-[#f4d300]/10 p-4 rounded-2xl border border-[#f4d300]/20">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ShieldCheck size={12} className="text-[#f4d300]" />
                                        <span className="text-[#f4d300] font-bold text-xs uppercase tracking-wider">Meat Depot Reply</span>
                                    </div>
                                    <p className="text-white/80 text-sm">{review.adminReply}</p>
                                </div>
                            )}
                        </div>
                    );
                }) : <p className="text-white/40 text-sm text-center py-8">No reviews yet. Be the first!</p>}
            </div>
        </div>
    )
}

// Shop Component
const Shop: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, addToCart, currentUser, updateProduct, updateConfig, config, deleteProduct, toggleWishlist, orders, trackProductView } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [weightGrams, setWeightGrams] = useState(250);
  const [isCustomWeight, setIsCustomWeight] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [checkedOptions, setCheckedOptions] = useState<string[]>([]);
  const [isVacuumPacked, setIsVacuumPacked] = useState(false);
  const navigate = useNavigate();

  // Address Validation State
  const [validationAddress, setValidationAddress] = useState('123 Main Road, Green Acres, Gqeberha');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ isValidLocation: boolean; error?: string; distanceKm?: number } | null>(null);

  const handleValidateAddress = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const result = await validateAddress(validationAddress, config.deliveryAreas, config);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({ isValidLocation: false, error: 'Failed to validate address.' });
    } finally {
      setIsValidating(false);
    }
  };

  const activeCategory = searchParams.get('category') || 'All';
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const filteredProducts = products.filter(p => {
    let matchesCategory = true;
    
    if (activeCategory === 'Favorites') {
        matchesCategory = currentUser?.wishlist?.includes(p.id) || false;
    } else if (activeCategory === 'Buy Again') {
        const purchasedProductIds = new Set(
            orders
                .filter(o => o.customerId === currentUser?.id)
                .flatMap(o => o.items.map(i => i.productId))
        );
        matchesCategory = purchasedProductIds.has(p.id);
    } else if (activeCategory !== 'All') {
        matchesCategory = p.category === activeCategory;
    }

    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  })
  .sort((a, b) => {
      const aSpecial = (a.specialPrice || 0) > 0 && (a.specialPrice || 0) < a.price;
      const bSpecial = (b.specialPrice || 0) > 0 && (b.specialPrice || 0) < b.price;
      if (aSpecial && !bSpecial) return -1;
      if (!aSpecial && bSpecial) return 1;
      return 0;
  });

  useEffect(() => {
    const productId = searchParams.get('product');
    if (productId) {
      const product = products.find(p => p.id === productId);
      setSelectedProduct(productId);
      setQuantity(1);
      setIsCustomWeight(false);
      setCheckedOptions([]); // Reset options
      setIsVacuumPacked(false); // Reset vacuum
      if (product?.thicknessOptions?.[0]) {
        setWeightGrams(product.thicknessOptions[0].weight);
      } else {
        setWeightGrams(250);
      }
      
      // Track View
      if (!isAdmin && product) {
          trackProductView(productId);
      }
    }
  }, [searchParams, products]);
  
  const handleCloseProduct = () => {
      setSelectedProduct(null);
      setSearchParams(prev => {
          const newParams = new URLSearchParams(prev);
          newParams.delete('product');
          return newParams;
      });
  };

  const handleWeightChange = (val: string) => {
      if (val === 'custom') {
          setIsCustomWeight(true);
          setWeightGrams(0); // Reset for custom input
      } else {
          setIsCustomWeight(false);
          setWeightGrams(Number(val));
      }
  };
  
  const toggleOption = (label: string) => {
      if (checkedOptions.includes(label)) {
          setCheckedOptions(checkedOptions.filter(o => o !== label));
      } else {
          setCheckedOptions([...checkedOptions, label]);
      }
  };

  const validateOptions = (product: Product) => {
      if (!product.productCheckboxes) return true;
      for (const box of product.productCheckboxes) {
          if (box.required && !checkedOptions.includes(box.label)) {
              alert(`Please select the required option: ${box.label}`);
              return false;
          }
      }
      return true;
  };

  const handleAddToCart = (product: Product) => {
    if (!currentUser) {
      alert("Please login to add items to cart.");
      return;
    }
    if (!validateOptions(product)) return;
    
    addToCart(product, quantity, undefined, checkedOptions, isVacuumPacked);
    handleCloseProduct();
  };
  
  const handleKgAddToCart = (product: Product) => {
    if (!currentUser) {
      alert("Please login to add items to cart.");
      return;
    }
    if (weightGrams <= 0) {
        alert("Please enter a valid weight.");
        return;
    }
    if (!validateOptions(product)) return;

    addToCart(product, quantity, weightGrams, checkedOptions, isVacuumPacked);
    handleCloseProduct();
  };

  const handleWhatsAppDirectOrder = (product: Product) => {
      let message = `Hi Meat Depot, I would like to order:\n\n`;
      
      let itemDetails = `${quantity} x ${product.name}`;
      if (product.unit === UnitType.KG) {
          itemDetails += ` (${weightGrams}g)`;
      }
      
      if (checkedOptions.length > 0) {
          itemDetails += ` [${checkedOptions.join(', ')}]`;
      }

      if (isVacuumPacked) {
          itemDetails += ` (Vacuum Packed)`;
      }
      
      message += itemDetails;
      message += `\n\nPlease confirm availability.`;

      const phone = '27632148131';
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };
  
  const togglePremium = (product: Product) => {
      const isNowFeatured = !product.featured;
      updateProduct({...product, featured: isNowFeatured});
      
      const order = new Set(config.featuredProductOrder);
      if(isNowFeatured) {
          order.add(product.id);
      } else {
          order.delete(product.id);
      }
      updateConfig({...config, featuredProductOrder: [...order]});
  };
  
  const handleToggleWishlist = (productId: string) => {
      if (!currentUser) {
          alert('Please login to use the wishlist.');
          return;
      }
      toggleWishlist(productId);
  };

  const handleShareProduct = async (product: Product) => {
      const url = `${window.location.origin}/#/shop?product=${product.id}`;
      const shareData = {
          title: `Meat Depot - ${product.name}`,
          text: `Check out ${product.name} at Meat Depot!`,
          url: url
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.log('Error sharing:', err);
          }
      } else {
          navigator.clipboard.writeText(url);
          alert("Product link copied to clipboard!");
      }
  };

  const renderProductControls = (product: Product) => {
    if (!product.available) {
        return (
            <div className="bg-white/5 text-white/40 w-full py-4 rounded-[20px] text-xs font-bold uppercase tracking-widest flex items-center justify-center cursor-not-allowed">
              Sold Out
            </div>
        );
    }
    if (product.unit === UnitType.KG) {
      return (
        <button 
          onClick={() => setSelectedProduct(product.id)}
          className="bg-[#f4d300] text-black w-full py-4 rounded-[20px] shadow-lg shadow-[#f4d300]/20 active:scale-95 transition-all text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Weight size={16} /> Select Weight
        </button>
      );
    }
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 bg-white/5 p-2 rounded-2xl">
          <button 
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:text-[#f4d300] transition-colors text-white"
          >
            <Minus size={16} />
          </button>
          <span className="text-xs font-bold min-w-[28px] text-center text-white">{quantity}</span>
          <button 
            onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-xl hover:text-[#f4d300] transition-colors text-white"
          >
            <Plus size={16} />
          </button>
        </div>
        <button 
          onClick={() => setSelectedProduct(product.id)} // Open modal to show options
          className="bg-[#f4d300] text-black w-14 h-14 flex items-center justify-center rounded-[20px] shadow-2xl shadow-[#f4d300]/20 active:scale-90 transition-all"
        >
          <ShoppingCart size={24} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  const switchCategory = (cat: string) => {
      if ((cat === 'Favorites' || cat === 'Buy Again') && !currentUser) {
          alert('Please login to view this section.');
          navigate('/login');
          return;
      }
      setSearchParams({ category: cat });
  };

  return (
    <div className="space-y-10 bg-black -mx-4 px-6 pt-4">
      {/* ... Header and Search ... */}
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="brand-font text-5xl font-bold italic text-white">The Butchery</h1>
          <p className="text-[#f4d300] text-[9px] font-bold tracking-[0.3em] uppercase opacity-70">Premium Cuts Selected For You</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#f4d300] transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search our collection..."
            className="w-full pl-16 pr-8 py-6 bg-white/5 border border-white/10 rounded-[30px] focus:bg-white/10 focus:ring-4 focus:ring-[#f4d300]/5 focus:border-[#f4d300]/50 transition-all text-sm font-medium text-white placeholder-white/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Address Validation Section */}
        <div className="bg-[#121212] border border-white/10 rounded-[30px] p-6 space-y-4">
            <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#f4d300]" />
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">Check Delivery Area</h3>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text"
                    value={validationAddress}
                    onChange={(e) => setValidationAddress(e.target.value)}
                    placeholder="Enter delivery address..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white text-sm outline-none focus:border-[#f4d300]"
                />
                <button 
                    onClick={handleValidateAddress}
                    disabled={isValidating || !validationAddress}
                    className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
                >
                    {isValidating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    {isValidating ? 'Checking...' : 'Check Address'}
                </button>
            </div>
            {validationResult && (
                <div className={`p-4 rounded-2xl text-sm font-medium flex items-start gap-3 ${validationResult.isValidLocation ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {validationResult.isValidLocation ? <Check size={18} className="shrink-0 mt-0.5" /> : <X size={18} className="shrink-0 mt-0.5" />}
                    <div>
                        <p>{validationResult.isValidLocation ? 'Great news! We deliver to this address.' : 'Sorry, this address is outside our delivery area.'}</p>
                        {validationResult.distanceKm && <p className="text-xs opacity-70 mt-1">Distance: {validationResult.distanceKm.toFixed(1)} km</p>}
                        {validationResult.error && <p className="text-xs opacity-70 mt-1">{validationResult.error}</p>}
                    </div>
                </div>
            )}
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 -mx-6 px-6">
          <button 
            onClick={() => switchCategory('All')}
            className={`px-8 py-4 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all whitespace-nowrap border-2 ${
              activeCategory === 'All' 
              ? 'bg-[#f4d300] border-[#f4d300] text-black shadow-xl shadow-[#f4d300]/20' 
              : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
            }`}
          >
            ALL CATEGORIES
          </button>
          
          <button 
            onClick={() => switchCategory('Favorites')}
            className={`px-8 py-4 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all whitespace-nowrap border-2 flex items-center gap-2 ${
              activeCategory === 'Favorites' 
              ? 'bg-[#f4d300] border-[#f4d300] text-black shadow-xl shadow-[#f4d300]/20' 
              : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
            }`}
          >
            <Heart size={12} className={activeCategory === 'Favorites' ? "fill-black text-black" : "fill-transparent"} />
            FAVORITES
          </button>

          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => switchCategory(cat)}
              className={`px-8 py-4 rounded-full text-[9px] font-bold tracking-widest uppercase transition-all whitespace-nowrap border-2 ${
                activeCategory === cat 
                ? 'bg-[#f4d300] border-[#f4d300] text-black shadow-xl shadow-[#f4d300]/20' 
                : 'bg-white/5 border-white/5 text-white/40 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {filteredProducts.length > 0 ? filteredProducts.map(product => {
            const reviews = product.reviews || [];
            const avgRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
            const isFeatured = product.featured;
            const inWishlist = currentUser?.wishlist?.includes(product.id);
            const isOnSpecial = (product.specialPrice || 0) > 0 && (product.specialPrice || 0) < product.price;

            return (
              <div key={product.id} className="bg-[#121212] rounded-[40px] overflow-hidden border border-white/5 flex h-64 group hover:border-[#f4d300]/20 transition-all duration-500 shadow-2xl relative">
                {isAdmin && (
                    <div className="absolute top-4 right-4 z-20 group/admin">
                         <button 
                            className="p-2 bg-black/50 hover:bg-[#f4d300] text-white hover:text-black rounded-full backdrop-blur-md transition-colors shadow-lg"
                        >
                            <Settings size={16} />
                        </button>
                        <div className="hidden group-hover/admin:block absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl py-2">
                             <button onClick={(e) => { e.stopPropagation(); togglePremium(product); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-bold flex items-center gap-2">
                                  <Star size={14} className={isFeatured ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}/> 
                                  {isFeatured ? 'Remove Premium' : 'Make Premium'}
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); navigate('/admin/products'); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-bold flex items-center gap-2">
                                  <Edit2 size={14}/> Edit Product
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete product?')) deleteProduct(product.id); }} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 font-bold flex items-center gap-2">
                                  <Trash2 size={14}/> Delete Product
                              </button>
                        </div>
                    </div>
                )}
                
                <div className="w-2/5 h-full relative overflow-hidden">
                  <img src={product.image} alt={product.name} className={`w-full h-full object-cover transition-all duration-1000 ${product.available ? 'opacity-70 group-hover:scale-110 group-hover:opacity-100' : 'opacity-30 grayscale'}`} />
                  
                  {isFeatured && !isOnSpecial && (
                      <div className="absolute top-4 left-4 z-10">
                          <div className="bg-[#f4d300] text-black p-2 rounded-full shadow-lg">
                              <Star size={14} className="fill-black" />
                          </div>
                      </div>
                  )}
                  
                  {isOnSpecial && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 z-10 shadow-md rounded-b-lg whitespace-nowrap" style={{ fontFamily: 'Impact, sans-serif' }}>
                          PROMOTION
                      </div>
                  )}

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleToggleWishlist(product.id); }}
                    className="absolute bottom-4 left-4 z-10 bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors group/heart"
                  >
                      <Heart size={16} className={`transition-colors ${inWishlist ? 'fill-red-500 text-red-500' : 'text-white group-hover/heart:text-red-500'}`} />
                  </button>

                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareProduct(product); }}
                    className="absolute bottom-4 right-4 z-10 bg-black/40 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors group/share"
                    title="Share"
                  >
                      <Share2 size={16} className="transition-colors text-white group-hover/share:text-[#f4d300]" />
                  </button>

                  {product.available ? (
                    <button 
                      onClick={() => setSelectedProduct(product.id)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Info size={28} className="text-[#f4d300]" />
                    </button>
                  ) : (
                    <div 
                      onClick={() => setSelectedProduct(product.id)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center cursor-pointer"
                    >
                      <span className="text-white/80 font-bold text-sm uppercase tracking-[0.2em] border-2 border-white/50 px-4 py-2 rounded-lg">SOLD OUT</span>
                    </div>
                  )}
                </div>
                <div className="w-3/5 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                        <span className="text-[8px] font-bold text-[#f4d300] uppercase tracking-[0.3em] mb-2 block opacity-70">{product.category}</span>
                        {avgRating > 0 && 
                            <div className="flex items-center gap-1">
                                <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-white/50">{avgRating.toFixed(1)}</span>
                            </div>
                        }
                    </div>
                    <h3 className="font-main text-2xl font-bold text-white leading-tight group-hover:text-[#f4d300] transition-colors">{product.name}</h3>
                    <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                      {isOnSpecial ? (
                          <>
                            <span className="text-xl font-bold text-gray-500 line-through decoration-red-500/50">R{product.price}</span>
                            <span className="text-3xl font-bold text-[#f4d300] tracking-tighter">R{product.specialPrice}</span>
                          </>
                      ) : (
                          <span className="text-3xl font-bold text-white tracking-tighter">R{product.price}</span>
                      )}
                      <span className="text-white/40 text-[9px] font-bold uppercase tracking-widest">/ {product.unit.toUpperCase()}</span>
                    </div>
                    {product.unit === UnitType.KG && (
                        <span className="inline-block mt-1 bg-white/10 text-white/60 text-[8px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-widest">
                            Est. Price
                        </span>
                    )}
                  </div>

                  <div className="mt-4">
                     {renderProductControls(product)}
                  </div>
                </div>
              </div>
            )
        }) : (
            <div className="col-span-1 md:col-span-2 text-center py-20 text-white/30 space-y-4">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    {activeCategory === 'Favorites' ? <Heart size={40} /> : activeCategory === 'Buy Again' ? <Repeat size={40} /> : <Search size={40} />}
                </div>
                <p className="text-lg font-medium">
                    {activeCategory === 'Favorites' ? 'Your wishlist is currently empty.' :
                     activeCategory === 'Buy Again' ? 'No past orders found to reorder.' :
                     'No products found matching your search.'}
                </p>
                {(activeCategory === 'Favorites' || activeCategory === 'Buy Again') && (
                    <button onClick={() => setSearchParams({ category: 'All' })} className="text-[#f4d300] text-xs font-bold uppercase tracking-widest hover:underline">
                        Browse All Products
                    </button>
                )}
            </div>
        )}
      </div>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/95 glass z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-[#121212] w-full max-w-2xl rounded-t-[50px] sm:rounded-[50px] overflow-hidden border border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-500">
            {products.filter(p => p.id === selectedProduct).map(p => {
               const priceToUse = (p.specialPrice && p.specialPrice < p.price) ? p.specialPrice : p.price;
               const estimatedPrice = p.unit === UnitType.KG 
                ? ((priceToUse / 1000) * weightGrams * quantity).toFixed(2)
                : (priceToUse * quantity).toFixed(2);

              return (
              <div key={p.id} className="max-h-[90vh] overflow-y-auto no-scrollbar">
                <div className="h-[300px] relative">
                  <img src={p.image} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                  <button
                    onClick={handleCloseProduct}
                    className="absolute top-8 left-8 bg-black/40 backdrop-blur-xl text-white px-6 py-3 rounded-full border border-white/10 hover:border-[#f4d300] hover:text-[#f4d300] transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-widest z-10"
                  >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                  </button>
                  <button
                    onClick={() => handleShareProduct(p)}
                    className="absolute top-8 right-8 bg-black/40 backdrop-blur-xl text-white p-3 rounded-full border border-white/10 hover:border-[#f4d300] hover:text-[#f4d300] transition-all group z-10"
                    title="Share Product"
                  >
                    <Share2 size={20} className="group-hover:scale-110 transition-transform" />
                  </button>
                  <div className="absolute bottom-10 left-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#f4d300] mb-2 block">{p.category}</span>
                    <h2 className="font-main text-5xl font-bold italic text-white tracking-tighter">{p.name}</h2>
                  </div>
                </div>
                <div className="p-12 space-y-10">
                  <p className="font-main text-white/60 font-medium text-lg leading-relaxed">{p.description}</p>
                  
                  {p.productCheckboxes && p.productCheckboxes.length > 0 && (
                      <div className="space-y-4 bg-white/5 p-6 rounded-3xl border border-white/10">
                          <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Options</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {p.productCheckboxes.map(box => (
                                  <label key={box.id} className="flex items-center gap-3 cursor-pointer group">
                                      <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${checkedOptions.includes(box.label) ? 'bg-[#f4d300] border-[#f4d300] text-black' : 'border-white/20 bg-transparent'}`}>
                                          {checkedOptions.includes(box.label) && <Check size={14} strokeWidth={4} />}
                                      </div>
                                      <input type="checkbox" className="hidden" checked={checkedOptions.includes(box.label)} onChange={() => toggleOption(box.label)} />
                                      <span className={`text-sm font-medium transition-colors ${checkedOptions.includes(box.label) ? 'text-white' : 'text-white/60'}`}>{box.label}</span>
                                      {box.required && <span className="text-[9px] text-red-400 font-bold uppercase ml-auto">Req.</span>}
                                  </label>
                              ))}
                          </div>
                      </div>
                  )}

                  {config.enableVacuumPack && (
                      <div className="bg-white/5 p-6 rounded-3xl border border-white/10 flex items-center justify-between cursor-pointer group hover:border-[#f4d300] transition-colors" onClick={() => setIsVacuumPacked(!isVacuumPacked)}>
                          <div className="flex items-center gap-4">
                              <div className="p-3 bg-white/10 rounded-2xl group-hover:bg-[#f4d300] group-hover:text-black transition-colors">
                                  <Package size={24} />
                              </div>
                              <div>
                                  <p className="font-bold text-white text-sm">Vacuum Pack</p>
                                  <p className="text-white/40 text-[10px] uppercase tracking-widest">Seal for freshness</p>
                              </div>
                          </div>
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isVacuumPacked ? 'bg-[#f4d300] border-[#f4d300] text-black' : 'border-white/20'}`}>
                              {isVacuumPacked && <Check size={14} strokeWidth={4} />}
                          </div>
                      </div>
                  )}

                  {p.unit === UnitType.KG && (
                    p.thicknessOptions && p.thicknessOptions.length > 0 ? (
                        <div className="space-y-4">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-1">Select Thickness</label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                {p.thicknessOptions.map(option => (
                                    <button 
                                        key={option.name} 
                                        onClick={() => setWeightGrams(option.weight)}
                                        className={`p-4 rounded-2xl border-2 text-center transition-all ${
                                            weightGrams === option.weight 
                                            ? 'bg-[#f4d300]/10 border-[#f4d300] text-white' 
                                            : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'
                                        }`}
                                    >
                                        <span className="font-bold text-sm leading-tight block">{option.name}</span>
                                        <span className="text-xs block opacity-70 mt-1">~{option.weight}g</span>
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10 mt-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Est. Weight</label>
                                    <div className="w-full px-4 py-3 bg-black/50 text-white text-lg font-bold rounded-xl border border-white/10 text-center flex items-center justify-center h-[52px]">
                                        {weightGrams}g
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">No. of Steaks</label>
                                    <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10 h-[60px]">
                                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#f4d300] hover:text-black transition-colors rounded-lg"><Minus size={20} strokeWidth={3} /></button>
                                        <span className="flex-1 text-xl font-bold text-center">{quantity}</span>
                                        <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#f4d300] hover:text-black transition-colors rounded-lg"><Plus size={20} strokeWidth={3} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-3xl border border-white/10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Select Weight</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        className="w-full pl-4 pr-12 py-4 bg-black/50 text-white rounded-xl border border-white/10 outline-none focus:border-[#f4d300] font-bold text-lg"
                                        placeholder="Amount"
                                        value={isCustomWeight ? (weightGrams || '') : weightGrams}
                                        onChange={(e) => { setIsCustomWeight(true); setWeightGrams(Number(e.target.value)); }}
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-xs uppercase">Grams</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mt-2">
                                    {[250, 500, 1000, 2000].map(w => (
                                        <button key={w} onClick={() => { setIsCustomWeight(false); setWeightGrams(w); }} className={`px-4 py-3 rounded-xl text-sm font-bold border transition-all ${weightGrams === w && !isCustomWeight ? 'bg-[#f4d300] border-[#f4d300] text-black' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/30'}`}>{w}g</button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Quantity</label>
                                <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-xl border border-white/10 h-[60px]">
                                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#f4d300] hover:text-black transition-colors rounded-lg"><Minus size={20} strokeWidth={3} /></button>
                                    <span className="flex-1 text-xl font-bold text-center">{quantity}</span>
                                    <button onClick={() => setQuantity(q => q + 1)} className="w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-[#f4d300] hover:text-black transition-colors rounded-lg"><Plus size={20} strokeWidth={3} /></button>
                                </div>
                            </div>
                        </div>
                    )
                  )}

                  <div className="pt-6 border-t border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Total Estimate</span>
                          <span className="text-3xl font-bold text-[#f4d300] tracking-tighter">R{estimatedPrice}</span>
                      </div>
                      {p.unit === UnitType.KG && (
                          <p className="text-white/40 text-[10px] italic text-center">
                              * Price is an estimation. Final weight and price may vary slightly.
                          </p>
                      )}
                      <button 
                        onClick={() => p.unit === UnitType.KG ? handleKgAddToCart(p) : handleAddToCart(p)}
                        className="w-full bg-[#f4d300] text-black py-5 rounded-[25px] font-bold text-sm tracking-[0.2em] shadow-xl shadow-[#f4d300]/20 hover:scale-[1.02] transition-transform uppercase"
                      >
                        ADD TO BASKET
                      </button>
                      <button 
                        onClick={() => handleWhatsAppDirectOrder(p)}
                        className="w-full bg-[#25D366] text-white py-4 rounded-[25px] font-bold text-xs tracking-[0.2em] shadow-xl shadow-green-500/20 hover:scale-[1.02] transition-transform uppercase flex items-center justify-center gap-2"
                      >
                          <MessageCircle size={18} /> Order on WhatsApp
                      </button>
                  </div>
                  
                  <div className="pt-8 border-t border-white/10">
                      <ProductReviews product={p} />
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Shop;
