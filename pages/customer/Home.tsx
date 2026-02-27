
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, ShoppingCart, Heart, Facebook, Instagram, Coins, Settings, EyeOff, Trash2, Edit2, AlertTriangle, X, Trophy, Medal, Eye, User as UserIcon, Save, Palette, Repeat, Camera, Loader2 } from 'lucide-react';
import { UserRole, Post } from '../../types';
import { uploadFile } from '../../services/storageService';

import { fetchFacebookPosts } from '../../services/facebookService';

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
  const { products, config, posts, currentUser, updateConfig, deletePost, users, orders, syncToSheet, addPost } = useApp();
  const navigate = useNavigate();
  
  // Modal Local States
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

  // Background Facebook Sync
  useEffect(() => {
    const syncFB = async () => {
        if (config.facebookPageId && config.facebookAccessToken) {
            try {
                const fbPosts = await fetchFacebookPosts(config.facebookPageId, config.facebookAccessToken);
                const existingIds = new Set(posts.map(p => p.id));
                let hasNew = false;
                for (const fbPost of fbPosts) {
                    if (!existingIds.has(fbPost.id)) {
                        addPost(fbPost);
                        hasNew = true;
                    }
                }
                if (hasNew) {
                    // We don't necessarily need to syncToSheet here as it might be too frequent, 
                    // but the addPost updates the local state which is what matters for the current view.
                }
            } catch (e) {
                console.warn("Background FB Sync failed", e);
            }
        }
    };
    syncFB();
  }, [config.facebookPageId, config.facebookAccessToken]);

  // Sync notice URL when config changes
  useEffect(() => {
      setIsManualLeaderboard(config.enableManualLeaderboard || false);
      setManualEntry1(config.manualLeaderboard?.[0] || '');
      setManualEntry2(config.manualLeaderboard?.[1] || '');
      setManualEntry3(config.manualLeaderboard?.[2] || '');
  }, [config.enableManualLeaderboard, config.manualLeaderboard]);

  const featuredProducts = config.featuredProductOrder
    .map(id => products.find(p => p.id === id))
    .filter(p => p?.featured && p?.available);

  const orderedPosts = useMemo(() => {
    // Start with posts in the defined order
    const ordered = config.postOrder
      .map(id => posts.find(p => p.id === id))
      .filter((p): p is Post => !!p && (p.visible !== false || isAdmin));

    // Find posts NOT in the defined order (e.g. newly synced FB posts)
    const unordered = posts
      .filter(p => !config.postOrder.includes(p.id) && (p.visible !== false || isAdmin))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Combine them, putting unordered (new) posts first if they are newer
    // Actually, let's just combine them and sort the whole thing by timestamp for the home screen 
    // to ensure "Latest News" is actually latest.
    return [...ordered, ...unordered].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [posts, config.postOrder, isAdmin]);

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
        if (config.firebaseConfig?.apiKey) {
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

  const renderHero = () => (
      <section className="relative -mx-4 mb-12">
        <div className="relative h-[85vh] md:h-[90vh] w-full overflow-hidden bg-black">
          {youtubeId ? (
              <div className="w-full h-full relative opacity-60 mix-blend-luminosity">
                 <iframe 
                    className="w-full h-full object-cover scale-150"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${youtubeId}&playsinline=1`}
                    title="Meat Depot Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ pointerEvents: 'none' }} 
                 ></iframe>
                 <div className="absolute inset-0 bg-black/40"></div>
              </div>
          ) : (
              <img 
                src={config.homepageBanners[0]} 
                alt="Meat Depot" 
                className="w-full h-full object-cover opacity-40 mix-blend-luminosity" 
              />
          )}
          
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 pb-24 md:pb-32 pointer-events-none z-10">
            <div className="w-full space-y-4 pointer-events-auto">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-[#f4d300] text-black text-[10px] font-bold px-3 py-1 tracking-[0.2em] uppercase">EST. 2025</span>
                <span className="text-white/60 text-[10px] font-bold tracking-[0.3em] uppercase">GQEBERHA</span>
              </div>
              
              <div className="title-wrapper transform -skew-x-6 origin-bottom-left">
                <h1 className="brand-font text-[18vw] md:text-[12vw] font-black text-white leading-[0.85] tracking-tighter uppercase drop-shadow-2xl">
                  {config.heroTitle?.split('\n').map((line, i) => (
                    <span key={i} className="block hover:text-[#f4d300] transition-colors duration-300">{line}</span>
                  )) || (
                    <>
                      <span className="block hover:text-[#f4d300] transition-colors duration-300">SAVOUR</span>
                      <span className="block hover:text-[#f4d300] transition-colors duration-300">THE CUT.</span>
                    </>
                  )}
                </h1>
              </div>

              <p className="text-sm md:text-xl text-white/80 font-medium max-w-md leading-relaxed mt-6 border-l-4 border-[#f4d300] pl-4">
                {config.heroSubtitle || "Expertly sourced local meats. Freshly cut, perfectly aged or cured and delivered directly to your door."}
              </p>
              
              <div className="pt-8 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => navigate('/shop')}
                  className="bg-[#f4d300] text-black px-10 py-5 font-black text-sm md:text-base tracking-[0.1em] flex items-center justify-center gap-4 hover:bg-white transition-colors uppercase transform -skew-x-6"
                >
                  <span className="transform skew-x-6 flex items-center gap-2">
                    {config.heroButtonText || "SHOP COLLECTION"} <ArrowRight size={20} strokeWidth={3} />
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Marquee Banner at bottom of hero */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#f4d300] text-black py-3 overflow-hidden border-y-2 border-black z-20 transform -rotate-1 scale-105">
            <div className="flex whitespace-nowrap animate-[marquee_20s_linear_infinite]">
              {[...Array(10)].map((_, i) => (
                <span key={i} className="brand-font text-xl font-black uppercase tracking-widest mx-4 flex items-center gap-4">
                  PREMIUM QUALITY <Star size={14} className="fill-black" /> 
                  LOCAL SOURCED <Star size={14} className="fill-black" /> 
                  EXPERTLY CUT <Star size={14} className="fill-black" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>
  );

  const renderCategories = () => {
      const categories = ['Biltong', 'Steaks', 'Braai Packs', 'Specials'];

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
              className={`flex-shrink-0 px-10 py-5 bg-white/5 border border-white/10 rounded-2xl font-bold text-[10px] tracking-[0.2em] text-white/70 hover:border-[#f4d300] hover:text-[#f4d300] transition-all uppercase flex items-center gap-2`}
            >
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
                    <h3 className="font-main text-4xl font-bold text-white tracking-tight">{product.name}</h3>
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

  const renderNews = () => {
    const displayPosts = orderedPosts.slice(0, 3);
    
    if (displayPosts.length === 0) return null;

    return (
      <section className="space-y-10 px-2 mb-12">
        <div className="space-y-2">
          <h2 className="brand-font text-4xl font-bold italic text-white">Latest News</h2>
          <div className="h-1.5 w-20 bg-[#f4d300]"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayPosts.map((post) => (
                <div key={post.id} className="bg-[#121212] rounded-[32px] overflow-hidden border border-white/5 group hover:border-[#f4d300]/30 transition-all">
                    <div className="aspect-square overflow-hidden relative">
                        <img 
                            src={post.imageUrl} 
                            alt="News" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                                {new Date(post.timestamp).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-white/80 text-sm leading-relaxed line-clamp-3 italic">
                            "{post.caption}"
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-[#f4d300]">
                                <Facebook size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Facebook</span>
                            </div>
                            <a 
                                href={config.socialLinks?.facebook || "https://facebook.com/meatdepotgq"} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-white/40 hover:text-[#f4d300] transition-colors"
                            >
                                <ArrowRight size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>
    );
  };

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
      
      {/* Dynamic Sections */}
      {config.homeSectionOrder.filter(id => id !== 'leaderboard').map((sectionId) => (
          <div key={sectionId}>
              {sectionMap[sectionId] ? sectionMap[sectionId]() : null}
          </div>
      ))}

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
