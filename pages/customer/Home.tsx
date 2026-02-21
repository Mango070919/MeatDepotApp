
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart, Heart, Facebook, Instagram, Coins, Settings, EyeOff, Trash2, Edit2, AlertTriangle, X, Trophy, Medal, Eye, User as UserIcon, Save, Palette, Repeat, Camera, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';
import { uploadFile } from '../../services/storageService';

const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Helper for YouTube embed
const getYoutubeEmbedUrl = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const Home: React.FC = () => {
  const { products, config, posts, currentUser, updateConfig, deletePost, users, orders, syncToSheet } = useApp();
  const navigate = useNavigate();
  
  // Modal Local States
  const [showBannerEdit, setShowBannerEdit] = useState(false);
  const [bannerText, setBannerText] = useState(config.soldOutBanner?.text || '');
  const [bannerBg, setBannerBg] = useState(config.soldOutBanner?.backgroundColor || '#dc2626');
  const [bannerColor, setBannerColor] = useState(config.soldOutBanner?.textColor || '#ffffff');

  const [showNoticeEdit, setShowNoticeEdit] = useState(false);
  const [noticeUrl, setNoticeUrl] = useState(config.topNotice?.imageUrl || '');
  const [isUploading, setIsUploading] = useState(false);
  
  // Leaderboard Edit States
  const [isEditingLeaderboard, setIsEditingLeaderboard] = useState(false);
  const [isManualLeaderboard, setIsManualLeaderboard] = useState(config.enableManualLeaderboard || false);
  const [manualEntry1, setManualEntry1] = useState(config.manualLeaderboard?.[0] || '');
  const [manualEntry2, setManualEntry2] = useState(config.manualLeaderboard?.[1] || '');
  const [manualEntry3, setManualEntry3] = useState(config.manualLeaderboard?.[2] || '');
  
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  // Sync notice URL when config changes
  useEffect(() => {
      if (config.topNotice?.imageUrl) {
          setNoticeUrl(config.topNotice.imageUrl);
      }
  }, [config.topNotice?.imageUrl]);

  // Sync banner text and styles when config changes
  useEffect(() => {
    if (config.soldOutBanner) {
        setBannerText(config.soldOutBanner.text || '');
        setBannerBg(config.soldOutBanner.backgroundColor || '#dc2626');
        setBannerColor(config.soldOutBanner.textColor || '#ffffff');
    }
  }, [config.soldOutBanner]);

  // Sync leaderboard settings
  useEffect(() => {
      setIsManualLeaderboard(config.enableManualLeaderboard || false);
      setManualEntry1(config.manualLeaderboard?.[0] || '');
      setManualEntry2(config.manualLeaderboard?.[1] || '');
      setManualEntry3(config.manualLeaderboard?.[2] || '');
  }, [config.enableManualLeaderboard, config.manualLeaderboard]);

  const featuredProducts = config.featuredProductOrder
    .map(id => products.find(p => p.id === id))
    .filter(p => p?.featured && p?.available);

  const orderedPosts = config.postOrder
    .map(id => posts.find(p => p.id === id))
    .filter(p => p && (p.visible !== false || isAdmin));

  const youtubeId = getYoutubeEmbedUrl(config.homepageBanners[0]);

  // --- Calculate Top Buyers (Auto or Manual) ---
  const topBuyers = useMemo(() => {
      if (config.enableManualLeaderboard && config.manualLeaderboard) {
          // Manual Mode: Resolve User IDs to Names
          const manualUsers = config.manualLeaderboard.map((userId) => {
              const user = users.find(u => u.id === userId);
              return {
                  name: user ? user.name.split(' ')[0] : 'Unknown',
                  spend: 0, // Not used in display for manual mode
                  rank: 0 // Assigned by index
              };
          });
          // Pad with nulls if less than 3
          while (manualUsers.length < 3) manualUsers.push({ name: 'TBA', spend: 0, rank: 0 });
          
          return manualUsers.map((u, i) => ({ ...u, rank: i + 1 }));
      } else {
          // Auto Mode: Based on Orders
          const now = new Date();
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          
          const userSpend: Record<string, number> = {};
          orders.forEach(o => {
              const d = new Date(o.createdAt);
              if (d >= startOfMonth && o.customerId && o.customerId !== 'manual') {
                  userSpend[o.customerId] = (userSpend[o.customerId] || 0) + o.total;
              }
          });

          return Object.entries(userSpend)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 3)
              .map(([userId, spend], index) => {
                  const user = users.find(u => u.id === userId);
                  return {
                      name: user ? user.name.split(' ')[0] : 'Unknown', 
                      spend,
                      rank: index + 1
                  };
              });
      }
  }, [orders, users, config.enableManualLeaderboard, config.manualLeaderboard]);

  // --- Admin Handlers ---
  const handleBannerSave = () => {
      const newConfig = {
          ...config,
          soldOutBanner: {
              visible: true,
              text: bannerText,
              backgroundColor: bannerBg,
              textColor: bannerColor
          }
      };
      updateConfig(newConfig);
      syncToSheet({ config: newConfig });
      setShowBannerEdit(false);
  };
  
  const toggleBannerVisibility = () => {
      updateConfig({
          ...config,
          soldOutBanner: {
              ...config.soldOutBanner,
              visible: !config.soldOutBanner.visible
          }
      });
  };

  const setBannerPreset = (bg: string, txt: string) => {
      setBannerBg(bg);
      setBannerColor(txt);
  };

  const handleNoticeSave = () => {
      updateConfig({
          ...config,
          topNotice: {
              visible: true,
              imageUrl: noticeUrl
          }
      });
      setShowNoticeEdit(false);
  };

  const toggleNoticeVisibility = () => {
      updateConfig({
          ...config,
          topNotice: {
              imageUrl: config.topNotice?.imageUrl || '',
              visible: !(config.topNotice?.visible ?? true)
          }
      });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 1200, 800);
        
        let url = resizedImageBase64;
        if (config.backupMethod === 'CUSTOM_DOMAIN' || (config.googleDrive?.accessToken && config.googleDrive?.folderId)) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `notice_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }
        setNoticeUrl(url);
      } catch (error) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const saveLeaderboardSettings = async () => {
      const newConfig = {
          ...config,
          enableManualLeaderboard: isManualLeaderboard,
          manualLeaderboard: isManualLeaderboard ? [manualEntry1, manualEntry2, manualEntry3].filter(Boolean) : []
      };
      updateConfig(newConfig);
      await syncToSheet({ config: newConfig });
      setIsEditingLeaderboard(false);
  };

  const hidePost = (postId: string) => {
      const newOrder = config.postOrder.filter(id => id !== postId);
      updateConfig({ ...config, postOrder: newOrder });
  };
  
  const deletePostPermanently = (postId: string) => {
      if(window.confirm('Delete this post permanently?')) {
          deletePost(postId);
          const newOrder = config.postOrder.filter(id => id !== postId);
          updateConfig({ ...config, postOrder: newOrder });
      }
  };

  // --- Render Sections ---

  const renderSoldOutBanner = () => {
      const isVisible = config.soldOutBanner?.visible;
      const bg = config.soldOutBanner?.backgroundColor || '#dc2626';
      const color = config.soldOutBanner?.textColor || '#ffffff';

      if (!isVisible && !isAdmin) return null;

      return (
          <div className={`relative -mx-4 mb-4 overflow-hidden transition-all ${isVisible ? 'h-auto' : 'h-12 bg-gray-900 border-b border-gray-800'}`}>
               {isVisible ? (
                  <div 
                    className="p-6 flex flex-col items-center justify-center text-center relative shadow-xl"
                    style={{ backgroundColor: bg, color: color }}
                  >
                      <div className="flex items-center gap-3 animate-pulse">
                          <AlertTriangle size={32} className="fill-current opacity-80" />
                          <h2 className="brand-font text-3xl md:text-5xl font-bold italic tracking-tighter">{config.soldOutBanner.text}</h2>
                          <AlertTriangle size={32} className="fill-current opacity-80" />
                      </div>
                      {isAdmin && (
                          <div className="absolute top-4 right-4 flex gap-2">
                              <button onClick={() => setShowBannerEdit(true)} className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"><Edit2 size={16}/></button>
                              <button onClick={toggleBannerVisibility} className="p-2 bg-black/30 hover:bg-black/50 rounded-full text-white"><EyeOff size={16}/></button>
                          </div>
                      )}
                  </div>
               ) : (
                   <div className="flex items-center justify-between px-6 h-full">
                       <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Banner Hidden</span>
                       <div className="flex gap-4">
                           <button onClick={() => setShowBannerEdit(true)} className="text-xs font-bold text-yellow-500 hover:underline">Edit Banner</button>
                           <button onClick={toggleBannerVisibility} className="text-xs font-bold text-green-500 hover:underline">Show Banner</button>
                       </div>
                   </div>
               )}
               
               {showBannerEdit && (
                   <div className="absolute inset-0 bg-[#121212] z-20 flex items-center justify-center p-4">
                       <div className="w-full max-w-2xl bg-gray-900 border border-white/20 rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
                           <div className="flex justify-between items-center border-b border-white/10 pb-2">
                               <h3 className="text-white font-bold flex items-center gap-2"><Palette size={18}/> Edit Banner Style</h3>
                               <button onClick={() => setShowBannerEdit(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                           </div>
                           
                           <div className="flex flex-col gap-4 md:flex-row">
                               <div className="flex-1 space-y-2">
                                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Message</label>
                                   <input 
                                      value={bannerText}
                                      onChange={(e) => setBannerText(e.target.value)}
                                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white font-bold text-lg outline-none focus:border-[#f4d300]"
                                      placeholder="BANNER TEXT..."
                                   />
                               </div>
                               <div className="space-y-2">
                                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Colors</label>
                                   <div className="flex gap-2">
                                       <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                                           <span className="text-xs text-white/50">BG</span>
                                           <input type="color" value={bannerBg} onChange={(e) => setBannerBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                                       </div>
                                       <div className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/10">
                                           <span className="text-xs text-white/50">Text</span>
                                           <input type="color" value={bannerColor} onChange={(e) => setBannerColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                                       </div>
                                   </div>
                               </div>
                           </div>

                           <div className="space-y-2">
                               <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quick Styles</label>
                               <div className="flex gap-2 overflow-x-auto pb-2">
                                   <button onClick={() => setBannerPreset('#dc2626', '#ffffff')} className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white border border-white/20">Sold Out</button>
                                   <button onClick={() => setBannerPreset('#f4d300', '#000000')} className="px-3 py-1 rounded-full text-xs font-bold bg-[#f4d300] text-black border border-white/20">Notice</button>
                                   <button onClick={() => setBannerPreset('#2563eb', '#ffffff')} className="px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white border border-white/20">Info</button>
                                   <button onClick={() => setBannerPreset('#16a34a', '#ffffff')} className="px-3 py-1 rounded-full text-xs font-bold bg-green-600 text-white border border-white/20">Success</button>
                                   <button onClick={() => setBannerPreset('#000000', '#ffffff')} className="px-3 py-1 rounded-full text-xs font-bold bg-black text-white border border-white/20">Dark</button>
                               </div>
                           </div>

                           <button onClick={handleBannerSave} className="w-full bg-[#f4d300] text-black py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.01] transition-transform">
                               Save Changes
                           </button>
                       </div>
                   </div>
               )}
          </div>
      )
  };

  const renderHero = () => (
      <section className="relative -mx-4 mb-12">
        <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
          {youtubeId ? (
              <div className="w-full h-full relative">
                 <iframe 
                    className="w-full h-full object-cover"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
                    title="Meat Depot Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }} 
                 ></iframe>
                 <div className="absolute inset-0 bg-black/20"></div>
              </div>
          ) : (
              <img 
                src={config.homepageBanners[0]} 
                alt="Meat Depot" 
                className="w-full h-full object-cover opacity-50 grayscale" 
              />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-8 md:p-10 pb-20 pointer-events-none">
            <div className="max-w-xl space-y-6 pointer-events-auto">
              <div className="flex items-center gap-3">
                <span className="bg-[#f4d300] text-black text-[9px] font-bold px-4 py-1.5 rounded-sm tracking-[0.3em] uppercase">Est. 2025</span>
                <span className="text-white/40 text-[9px] font-bold tracking-[0.4em] uppercase">PREMIUM MEAT</span>
              </div>
              <h1 className="brand-font text-5xl md:text-9xl font-bold italic text-white leading-[0.8] tracking-tighter whitespace-pre-line">
                {config.heroTitle || "Savour\nThe Cut."}
              </h1>
              <p className="text-sm md:text-lg text-white/60 font-medium max-w-sm leading-relaxed">
                {config.heroSubtitle || "Expertly sourced local meats. Freshly cut, perfectly aged or cured and delivered directly to your door in Gqeberha."}
              </p>
              <button 
                onClick={() => navigate('/shop')}
                className="bg-[#f4d300] text-black px-12 py-5 rounded-full font-bold text-[11px] tracking-[0.2em] flex items-center gap-4 shadow-2xl shadow-[#f4d300]/20 hover:scale-105 transition-all uppercase"
              >
                {config.heroButtonText || "SHOP COLLECTION"} <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>
  );

  const renderCategories = () => {
      const hasPastOrders = currentUser && orders.some(o => o.customerId === currentUser.id);
      const categories = ['Biltong', 'Steaks', 'Braai Packs', 'Specials'];
      if (hasPastOrders) {
          categories.unshift('Buy Again');
      }

      return (
      <section className="space-y-6 px-2 mb-12">
        <div className="space-y-1">
          <h2 className="script-font text-5xl text-[#f4d300] -rotate-1">The Depot</h2>
          <p className="text-white/30 text-[9px] font-bold tracking-[0.4em] uppercase">Our Finest Selections</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/shop?category=${cat}`)}
              className={`flex-shrink-0 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-[10px] tracking-[0.2em] text-white/70 hover:border-[#f4d300] hover:text-[#f4d300] transition-all uppercase flex items-center gap-2 ${cat === 'Buy Again' ? 'border-[#f4d300] text-[#f4d300]' : ''}`}
            >
              {cat === 'Buy Again' && <Repeat size={14} />}
              {cat}
            </button>
          ))}
        </div>
      </section>
      );
  };

  const renderFeatured = () => (
      <section className="space-y-10 px-2 mb-12">
        <div className="space-y-2">
          <h2 className="brand-font text-4xl font-bold italic text-white">Butcher's Picks</h2>
          <div className="h-1.5 w-20 bg-[#f4d300]"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {featuredProducts.slice(0, 4).map((product) => {
              if(!product) return null;
              const isOnSpecial = (product.specialPrice || 0) > 0 && (product.specialPrice || 0) < product.price;
              
              return (
                <div 
                  key={product.id}
                  onClick={() => navigate(`/shop?product=${product.id}`)}
                  className="group relative bg-[#0a0a0a] rounded-[50px] overflow-hidden border border-white/5 hover:border-[#f4d300]/30 transition-all duration-700 cursor-pointer shadow-2xl"
                >
                  <div className="h-96 w-full overflow-hidden relative">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover opacity-70 grayscale-[0.2] group-hover:scale-110 group-hover:opacity-100 transition-all duration-1000" 
                    />
                    
                    {isOnSpecial ? (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs font-bold px-4 py-1 z-10 shadow-md rounded-b-lg whitespace-nowrap" style={{ fontFamily: 'Impact, sans-serif' }}>
                          PROMOTION
                      </div>
                    ) : (
                        <div className="absolute top-8 right-8 bg-black/60 backdrop-blur-2xl px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-2">
                            <Star size={14} className="fill-[#f4d300] text-[#f4d300]" />
                            <span className="text-[10px] font-bold text-white tracking-[0.2em] uppercase">Butcher's Choice</span>
                        </div>
                    )}
                  </div>
                  <div className="p-10 space-y-4">
                    <h3 className="brand-font text-4xl font-bold text-white tracking-tight">{product.name}</h3>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em]">Price from</p>
                        <div className="flex items-baseline gap-2">
                          {isOnSpecial ? (
                              <>
                                <span className="text-gray-500 font-bold text-2xl line-through decoration-red-500/50">R{product.price}</span>
                                <span className="text-red-500 font-bold text-4xl tracking-tighter">R{product.specialPrice}</span>
                              </>
                          ) : (
                              <span className="text-[#f4d300] font-bold text-4xl tracking-tighter">R{product.price}</span>
                          )}
                          <span className="text-white/30 text-[10px] font-bold uppercase">/ {product.unit}</span>
                        </div>
                      </div>
                      <div className="bg-[#f4d300] p-5 rounded-[25px] text-black shadow-2xl group-hover:rotate-12 transition-transform duration-500">
                        <ShoppingCart size={28} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </div>
              );
          })}
        </div>
      </section>
  );

  const renderNews = () => (
      <section className="space-y-10 px-2 mb-12">
        <div className="space-y-2">
          <h2 className="brand-font text-4xl font-bold italic text-white">Latest News</h2>
          <div className="h-1.5 w-20 bg-[#f4d300]"></div>
        </div>
        <div className="w-full bg-white rounded-[20px] overflow-hidden flex justify-center">
            <iframe 
                src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fmeatdepotgq&tabs=timeline&width=500&height=800&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId" 
                width="100%" 
                height="800" 
                style={{ border: 'none', overflow: 'hidden', maxWidth: '500px' }} 
                scrolling="no" 
                frameBorder="0" 
                allowFullScreen={true} 
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
            ></iframe>
        </div>
      </section>
  );

  const sectionMap: Record<string, () => React.ReactElement> = {
    'hero': renderHero,
    'categories': renderCategories,
    'featured': renderFeatured,
    'news': renderNews
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-700 bg-black -mx-4 px-4">
      
      {/* App Description Banner */}
      <div className="bg-[#121212] rounded-2xl p-4 border border-white/5 text-center mb-4">
          <p className="text-xs text-white/60 font-medium whitespace-pre-line">
              {config.appDescription || <span>This app is used to place orders with <span className="text-[#f4d300] font-bold">Meat Depot</span>.</span>}
          </p>
      </div>

      {/* Top Notice Image with Admin Controls */}
      {(config.topNotice?.visible || isAdmin) && config.topNotice?.imageUrl && (
          <div className="relative mb-4 group">
              <img 
                  src={config.topNotice.imageUrl} 
                  alt="Notice" 
                  className={`w-full h-auto rounded-xl transition-opacity ${!config.topNotice.visible ? 'opacity-40 grayscale' : ''}`} 
              />
              
              {isAdmin && (
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                          onClick={() => setShowNoticeEdit(true)} 
                          className="p-2 bg-black/70 hover:bg-black text-white rounded-full backdrop-blur-sm"
                          title="Change Image"
                      >
                          <Edit2 size={16}/>
                      </button>
                      <button 
                          onClick={toggleNoticeVisibility} 
                          className={`p-2 rounded-full backdrop-blur-sm text-white ${config.topNotice.visible ? 'bg-black/70 hover:bg-black' : 'bg-red-600 hover:bg-red-700'}`}
                          title={config.topNotice.visible ? "Hide Notice" : "Show Notice"}
                      >
                          {config.topNotice.visible ? <Eye size={16}/> : <EyeOff size={16}/>}
                      </button>
                  </div>
              )}

              {showNoticeEdit && (
                  <div className="absolute inset-0 bg-black/90 z-20 flex items-center justify-center p-6 rounded-xl animate-in fade-in">
                      <div className="w-full max-w-lg flex flex-col gap-4">
                          <h3 className="text-white font-bold">Update Notice Image</h3>
                          <div className="flex gap-2">
                              <label className="bg-white/10 text-white px-4 rounded-xl flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                                  {isUploading ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>}
                                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                              </label>
                              <input 
                                 value={noticeUrl}
                                 onChange={(e) => setNoticeUrl(e.target.value)}
                                 className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-[#f4d300]"
                                 placeholder="Enter Image URL..."
                              />
                              <button onClick={handleNoticeSave} className="bg-[#f4d300] text-black px-6 rounded-xl font-bold text-xs uppercase tracking-widest">SAVE</button>
                              <button onClick={() => setShowNoticeEdit(false)} className="bg-white/10 text-white px-4 rounded-xl"><X size={20}/></button>
                          </div>
                          <p className="text-[10px] text-white/40">Upload an image or paste a URL.</p>
                      </div>
                  </div>
              )}
          </div>
      )}

      {renderSoldOutBanner()}

      {/* Promotion Bar */}
      {config.announcement && (
        <div className="bg-[#f4d300] text-black py-2 overflow-hidden -mx-4 mb-2">
          <div className="whitespace-nowrap flex gap-12 px-4 animate-[marquee_25s_linear_infinite]">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">{config.announcement}</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">{config.announcement}</span>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">{config.announcement}</span>
          </div>
        </div>
      )}
      
      {currentUser && (
          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 mb-8">
              <div className="flex items-center gap-3">
                  <div className="bg-[#f4d300] text-black p-2 rounded-full">
                      <Coins size={20} />
                  </div>
                  <div>
                      <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Loyalty Balance</p>
                      <p className="text-white font-bold text-lg">{currentUser.loyaltyPoints || 0} Points</p>
                  </div>
              </div>
              <p className="text-[10px] text-white/30 text-right">R500 = 1 Point</p>
          </div>
      )}

      {/* Dynamic Sections */}
      {config.homeSectionOrder.map((sectionId) => (
          <div key={sectionId}>
              {sectionMap[sectionId] ? sectionMap[sectionId]() : null}
          </div>
      ))}

      {/* Top Buyers Leaderboard */}
      {topBuyers.length > 0 && (
          <section className="space-y-6 px-2 mb-12 border-t border-white/10 pt-10">
              <div className="flex flex-col items-center text-center space-y-2 relative">
                  {isAdmin && (
                      <button 
                        onClick={() => setIsEditingLeaderboard(true)}
                        className="absolute right-0 top-0 p-2 text-white/30 hover:text-[#f4d300] transition-colors"
                        title="Edit Leaderboard"
                      >
                          <Settings size={18} />
                      </button>
                  )}
                  <div className="bg-gradient-to-tr from-[#f4d300] to-yellow-200 text-black p-4 rounded-full shadow-lg shadow-yellow-500/20 mb-2">
                      <Trophy size={32} />
                  </div>
                  <h2 className="brand-font text-3xl font-bold italic text-white">Top Buyers of the Month</h2>
                  <p className="text-white/40 text-[10px] font-bold tracking-[0.3em] uppercase max-w-xs">Earn points by topping the charts! Resets Monthly.</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 items-end">
                  {topBuyers[1] && (
                      <div className="bg-white/5 rounded-t-[30px] rounded-b-[20px] p-4 text-center border border-white/5 flex flex-col items-center gap-2 h-36 justify-end relative">
                          <div className="absolute -top-4 w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-black font-bold shadow-lg text-sm border-2 border-white">2</div>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Win 2 Pts</span>
                          <span className="font-bold text-white text-lg">{topBuyers[1].name}</span>
                          <div className="h-16 w-full bg-white/5 rounded-xl"></div>
                      </div>
                  )}
                  {topBuyers[0] && (
                      <div className="bg-[#f4d300]/10 rounded-t-[30px] rounded-b-[20px] p-4 text-center border border-[#f4d300]/30 flex flex-col items-center gap-2 h-44 justify-end relative shadow-[0_0_30px_rgba(244,211,0,0.1)]">
                          <div className="absolute -top-5 w-12 h-12 bg-[#f4d300] rounded-full flex items-center justify-center text-black font-bold shadow-xl text-lg border-2 border-white"><Medal size={20}/></div>
                          <span className="text-[10px] text-[#f4d300] font-bold uppercase tracking-widest">Win 4 Pts</span>
                          <span className="font-bold text-white text-xl">{topBuyers[0].name}</span>
                          <div className="h-24 w-full bg-[#f4d300] rounded-xl opacity-80"></div>
                      </div>
                  )}
                  {topBuyers[2] && (
                      <div className="bg-white/5 rounded-t-[30px] rounded-b-[20px] p-4 text-center border border-white/5 flex flex-col items-center gap-2 h-32 justify-end relative">
                          <div className="absolute -top-4 w-10 h-10 bg-yellow-700 rounded-full flex items-center justify-center text-white font-bold shadow-lg text-sm border-2 border-white">3</div>
                          <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Win 1 Pt</span>
                          <span className="font-bold text-white text-lg">{topBuyers[2].name}</span>
                          <div className="h-12 w-full bg-white/5 rounded-xl"></div>
                      </div>
                  )}
              </div>
          </section>
      )}

      {/* Leaderboard Editor Modal */}
      {isEditingLeaderboard && (
          <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-[#121212] w-full max-w-lg rounded-[40px] border border-white/10 shadow-2xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2"><Trophy size={20} className="text-[#f4d300]"/> Leaderboard Settings</h3>
                      <button onClick={() => setIsEditingLeaderboard(false)} className="text-white/50 hover:text-white"><X size={20}/></button>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex justify-between items-center">
                      <div>
                          <p className="text-sm font-bold text-white">Manual Selection</p>
                          <p className="text-[10px] text-white/50">Override automatic calculation</p>
                      </div>
                      <button 
                          onClick={() => setIsManualLeaderboard(!isManualLeaderboard)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isManualLeaderboard ? 'bg-[#f4d300]' : 'bg-gray-600'}`}
                      >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${isManualLeaderboard ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                  </div>

                  {isManualLeaderboard && (
                      <div className="space-y-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest">1st Place (Gold)</label>
                              <select 
                                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-[#f4d300]"
                                  value={manualEntry1}
                                  onChange={(e) => setManualEntry1(e.target.value)}
                              >
                                  <option value="">Select User...</option>
                                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">2nd Place (Silver)</label>
                              <select 
                                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-[#f4d300]"
                                  value={manualEntry2}
                                  onChange={(e) => setManualEntry2(e.target.value)}
                              >
                                  <option value="">Select User...</option>
                                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                              </select>
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-yellow-700 uppercase tracking-widest">3rd Place (Bronze)</label>
                              <select 
                                  className="w-full bg-black border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-[#f4d300]"
                                  value={manualEntry3}
                                  onChange={(e) => setManualEntry3(e.target.value)}
                              >
                                  <option value="">Select User...</option>
                                  {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
                              </select>
                          </div>
                      </div>
                  )}

                  <button onClick={saveLeaderboardSettings} className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform flex items-center justify-center gap-2">
                      <Save size={16} /> Save Changes
                  </button>
              </div>
          </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

export default Home;
