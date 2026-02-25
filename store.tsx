
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Product, Order, User, CartItem, AppNotification, AppConfig, UserRole, OrderStatus, Post, UnitType, Review, PromoCode, ActivityLog, RawMaterial, ProductionBatch } from './types';
import { INITIAL_PRODUCTS, INITIAL_CONFIG, INITIAL_POSTS, INITIAL_USERS, INITIAL_ORDERS, CUSTOMER_DATABASE_SHEET, INITIAL_PROMO_CODES } from './constants';
import { loadAppStateFromDrive, saveAppStateToDrive } from './services/googleDriveService';
import { loadFromDomain, saveToDomain } from './services/domainService';
import { initFirebase, saveStateToFirebase, loadStateFromFirebase } from './services/firebaseService';
import { deleteFile } from './services/storageService';
import { extractSheetId, loadStateFromSheet, saveStateToSheet } from './services/sheetService';
import { playSound } from './services/soundService';

interface PreviewData {
  config?: AppConfig;
  products?: Product[];
  posts?: Post[];
}

interface AppState {
  products: Product[];
  orders: Order[];
  users: User[];
  posts: Post[];
  promoCodes: PromoCode[];
  rawMaterials: RawMaterial[];
  productionBatches: ProductionBatch[];
  currentUser: User | null;
  cart: CartItem[];
  notifications: AppNotification[];
  activityLogs: ActivityLog[];
  config: AppConfig;
  isLoading: boolean;
  isPreviewMode: boolean;
  isCloudSyncing: boolean;
  hasLoadedFromCloud: boolean;
  previewData: PreviewData | null;
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;
  updateUserPassword: (email: string, newPassword: string) => void;
  addToCart: (product: Product, quantity: number, weight?: number, selectedOptions?: string[], vacuumPacked?: boolean) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  placeOrder: (order: Order, usedPromoCodeId?: string) => void;
  updateOrder: (orderId: string, updates: Partial<Order>) => void;
  deleteOrder: (orderId: string) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addProduct: (product: Product) => void;
  reorderProducts: (productId: string, direction: 'up' | 'down') => void;
  updateConfig: (config: AppConfig) => void;
  addNotification: (notif: AppNotification) => void;
  deleteNotification: (id: string) => void;
  addPost: (post: Post) => void;
  updatePost: (post: Post) => void;
  deletePost: (postId: string) => void;
  addPromoCode: (code: PromoCode) => void;
  deletePromoCode: (id: string) => void;
  addReview: (productId: string, review: Review) => void;
  deleteReview: (productId: string, reviewId: string) => void;
  replyToReview: (productId: string, reviewId: string, reply: string) => void;
  togglePreviewMode: (enabled: boolean) => void;
  setPreviewData: (data: Partial<PreviewData>) => void;
  commitPreview: () => void;
  cancelPreview: () => void;
  restoreData: (data: any) => void;
  syncToSheet: (overrides?: any) => Promise<void>;
  logActivity: (action: ActivityLog['action'], details: string) => void;
  // Production Actions
  addRawMaterial: (material: RawMaterial) => void;
  updateRawMaterial: (material: RawMaterial) => void;
  deleteRawMaterial: (id: string) => void;
  addProductionBatch: (batch: ProductionBatch) => void;
  // Analytics
  trackProductView: (productId: string) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const saveData = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Failed to save data for key "${key}":`, error);
  }
};

// Helper to check for expired specials
const checkAndExpireSpecials = (prods: Product[]): Product[] => {
    // Use local time (YYYY-MM-DD) to avoid UTC lag issues
    const today = new Date().toLocaleDateString('en-CA'); 
    return prods.map(product => {
        if (product.specialExpiryDate && product.specialPrice) {
            if (today > product.specialExpiryDate) {
                // Expired
                return { ...product, specialPrice: 0, specialExpiryDate: undefined };
            }
        }
        return product;
    });
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('md_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('md_orders');
    return saved ? JSON.parse(saved) : INITIAL_ORDERS;
  });
  
  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('md_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('md_users');
    let loadedUsers = saved ? JSON.parse(saved) : INITIAL_USERS;
    
    // Force admin phone number
    loadedUsers = loadedUsers.map((u: User) => {
        if (u.id === 'admin') {
            return { ...u, phone: '0632148131' };
        }
        return u;
    });
    return loadedUsers;
  });
  
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>(() => {
      const saved = localStorage.getItem('md_promocodes');
      return saved ? JSON.parse(saved) : INITIAL_PROMO_CODES;
  });

  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(() => {
      const saved = localStorage.getItem('md_rawMaterials');
      return saved ? JSON.parse(saved) : [];
  });

  const [productionBatches, setProductionBatches] = useState<ProductionBatch[]>(() => {
      const saved = localStorage.getItem('md_productionBatches');
      return saved ? JSON.parse(saved) : [];
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
      const saved = localStorage.getItem('md_activityLogs');
      return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('md_currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('md_cart');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        id: item.id || Math.random().toString(36).substr(2, 9)
      }));
    }
    return [];
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('md_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('md_config');
    if (!saved) return INITIAL_CONFIG;
    const parsed = JSON.parse(saved);
    return { ...INITIAL_CONFIG, ...parsed };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewData, setPreviewDataState] = useState<PreviewData | null>(null);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [hasLoadedFromCloud, setHasLoadedFromCloud] = useState(false);

  // --- Admin Credential Sync ---
  // This ensures that if the code changes (new password), the local storage 'admin' user is updated.
  useEffect(() => {
      const adminInConfig = INITIAL_USERS.find(u => u.id === 'admin');
      if (adminInConfig) {
          setUsers(prev => {
              const existingAdminIndex = prev.findIndex(u => u.id === 'admin');
              if (existingAdminIndex === -1) {
                  // Admin missing, add them
                  return [...prev, adminInConfig];
              } else {
                  const existingAdmin = prev[existingAdminIndex];
                  // Check if critical fields changed (Password/Username)
                  if (existingAdmin.password !== adminInConfig.password || existingAdmin.username !== adminInConfig.username) {
                      console.log("Syncing Admin credentials from config...");
                      const newUsers = [...prev];
                      newUsers[existingAdminIndex] = { ...existingAdmin, ...adminInConfig };
                      return newUsers;
                  }
              }
              return prev;
          });
      }
  }, []);

  // Check for expired specials on mount
  useEffect(() => {
      const validatedProducts = checkAndExpireSpecials(products);
      // Only update if changes occurred to avoid loops
      const hasChanges = JSON.stringify(validatedProducts) !== JSON.stringify(products);
      if (hasChanges) {
          setProducts(validatedProducts);
      }
  }, []);

  // Initialize Firebase if configured
  useEffect(() => {
      if (config.firebaseConfig?.apiKey) {
          initFirebase(config);
      }
  }, [config.firebaseConfig?.apiKey, config.firebaseConfig?.projectId]);

  // Auto-sync on critical changes
  useEffect(() => {
    // Only sync if we have a cloud method configured and we've already loaded initial data
    const hasCloud = config.firebaseConfig?.apiKey || (config.googleDrive?.accessToken && config.googleDrive?.folderId) || config.customDomain?.url;
    
    if (hasCloud && hasLoadedFromCloud && !isCloudSyncing) {
      // Debounce sync slightly to avoid spamming on rapid changes
      const timeout = setTimeout(() => {
        syncToSheet();
      }, 2000); // Increased to 2s to allow multiple state updates to settle
      return () => clearTimeout(timeout);
    }
  }, [products, orders, users, posts, promoCodes, config, rawMaterials, productionBatches]);

  useEffect(() => { saveData('md_products', products); }, [products]);
  useEffect(() => { saveData('md_orders', orders); }, [orders]);
  useEffect(() => { saveData('md_posts', posts); }, [posts]);
  useEffect(() => { saveData('md_users', users); }, [users]);
  useEffect(() => { saveData('md_promocodes', promoCodes); }, [promoCodes]);
  useEffect(() => { saveData('md_currentUser', currentUser); }, [currentUser]);
  useEffect(() => { saveData('md_cart', cart); }, [cart]);
  useEffect(() => { saveData('md_notifications', notifications); }, [notifications]);
  useEffect(() => { saveData('md_config', config); }, [config]);
  useEffect(() => { saveData('md_activityLogs', activityLogs); }, [activityLogs]);
  useEffect(() => { saveData('md_rawMaterials', rawMaterials); }, [rawMaterials]);
  useEffect(() => { saveData('md_productionBatches', productionBatches); }, [productionBatches]);

  // Activity Logger
  const logActivity = (action: ActivityLog['action'], details: string) => {
      const newLog: ActivityLog = {
          id: Math.random().toString(36).substr(2, 9),
          userId: currentUser?.id || 'system',
          userName: currentUser?.name || 'System',
          action,
          details,
          timestamp: new Date().toISOString()
      };
      setActivityLogs(prev => [newLog, ...prev].slice(0, 1000)); // Keep last 1000
  };

  useEffect(() => {
    const initCloudLoad = async () => {
      if (hasLoadedFromCloud) return;
      
      const hasFirebase = !!config.firebaseConfig?.apiKey;
      const hasDomain = !!config.customDomain?.url && !!config.customDomain?.apiKey;
      const hasDrive = !!config.googleDrive?.accessToken && !!config.googleDrive?.folderId;

      if (!hasFirebase && !hasDomain && !hasDrive) return;

      setIsCloudSyncing(true);
      
      // 1. Try Firebase First if configured
      if (hasFirebase) {
          try {
              initFirebase(config);
              const firebaseData = await loadStateFromFirebase();
              if (firebaseData) {
                  restoreData(firebaseData);
                  setHasLoadedFromCloud(true);
                  setIsCloudSyncing(false);
                  return;
              }
          } catch(e) { console.warn("Firebase load failed/skipped", e); }
      }

      // 2. Try Loading from Domain
      if (hasDomain) {
          try {
              const domainData = await loadFromDomain(config);
              if (domainData) {
                  restoreData(domainData);
                  setHasLoadedFromCloud(true);
                  setIsCloudSyncing(false);
                  return;
              }
          } catch(e) { console.warn("Domain load skipped", e); }
      }

      // 3. Try Drive if Domain failed or not configured
      if (hasDrive) {
        try {
          const cloudData = await loadAppStateFromDrive(config);
          if (cloudData) {
              restoreData(cloudData);
              setHasLoadedFromCloud(true);
          }
        } catch (e: any) {
          if (e.message === 'token_expired') {
              setNotifications(prev => {
                  if (prev.some(n => n.title === "Sync Error: Token Expired")) return prev;
                  return [{
                      id: `sync-err-${Date.now()}`,
                      title: "Sync Error: Token Expired",
                      body: "Your Google Drive access token has expired. Cloud data could not be loaded. Please update in App Manager.",
                      type: 'ANNOUNCEMENT',
                      timestamp: new Date().toISOString(),
                      targetUserId: 'admin'
                  }, ...prev];
              });
          } else {
              console.error("Drive load failed", e);
          }
        }
      }
      setIsCloudSyncing(false);
    };
    initCloudLoad();
  }, [config.firebaseConfig?.apiKey, config.googleDrive?.accessToken, config.customDomain?.url, config.customDomain?.apiKey]);

  const syncToSheet = async (overrides?: any) => {
      setIsCloudSyncing(true);
      const effectiveConfig = overrides?.config || config;
      const dataToSave = { 
          products: overrides?.products || products, 
          users: overrides?.users || users, 
          orders: overrides?.orders || orders, 
          posts: overrides?.posts || posts, 
          promoCodes: overrides?.promoCodes || promoCodes, 
          config: effectiveConfig, 
          activityLogs: overrides?.activityLogs || activityLogs, 
          rawMaterials: overrides?.rawMaterials || rawMaterials, 
          productionBatches: overrides?.productionBatches || productionBatches, 
          timestamp: new Date().toISOString() 
      };
      
      try {
          const syncPromises = [];

          // 1. SYNC TO FIREBASE
          if (effectiveConfig.firebaseConfig?.apiKey) {
              initFirebase(effectiveConfig);
              syncPromises.push(saveStateToFirebase(dataToSave));
          }

          // 2. SYNC TO CUSTOM DOMAIN (Self-Hosted)
          if (effectiveConfig.customDomain?.url && effectiveConfig.customDomain?.apiKey) {
              syncPromises.push(saveToDomain(dataToSave, effectiveConfig));
          }

          // 3. SYNC TO GOOGLE DRIVE (Backup/CMS)
          if (effectiveConfig.googleDrive?.accessToken && effectiveConfig.googleDrive?.folderId) {
              // Also sync to Sheet if configured
              const sheetTarget = effectiveConfig.googleSheetUrl || CUSTOMER_DATABASE_SHEET;
              const sheetId = extractSheetId(sheetTarget);
              if (sheetId) {
                  // Sheet sync is important, we'll await it or at least track it
                  syncPromises.push(saveStateToSheet(sheetId, dataToSave, effectiveConfig.googleDrive.accessToken));
              }
              syncPromises.push(saveAppStateToDrive(dataToSave, effectiveConfig));
          }

          // 4. PING LOCAL SERVER (For Vercel/Full-stack awareness)
          try {
              syncPromises.push(fetch('/api/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ data: dataToSave })
              }).catch(() => {})); // Ignore server ping failures
          } catch (e) {}
          
          await Promise.all(syncPromises);
          
          setHasLoadedFromCloud(true);
          logActivity('SYNC', 'System state redeployed to cloud(s)');
          return true;
      } catch (e: any) {
          if (e.message === 'token_expired') {
              setNotifications(prev => {
                  if (prev.some(n => n.title === "Sync Error: Token Expired")) return prev;
                  return [{
                      id: `sync-err-${Date.now()}`,
                      title: "Sync Error: Token Expired",
                      body: "Your Google Drive access token has expired. Please update it in Admin > App Manager to resume backups.",
                      type: 'ANNOUNCEMENT',
                      timestamp: new Date().toISOString(),
                      targetUserId: 'admin'
                  }, ...prev];
              });
              console.warn("Sync failed: Token Expired. Local state preserved.");
          } else {
              console.error("Sync Error", e);
          }
      } finally {
          setIsCloudSyncing(false);
      }
  };

  const addNotification = (notif: AppNotification) => setNotifications(prev => [notif, ...prev]);

  const login = (user: User) => {
    setUsers(prev => {
      const exists = prev.some(u => u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase());
      if (exists) {
        return prev.map(u => (u.id === user.id || u.email.toLowerCase() === user.email.toLowerCase()) ? { ...u, ...user } : u);
      }
      return [...prev, user];
    });
    setCurrentUser(user);
    logActivity('LOGIN', `User ${user.name} logged in`);
  };

  const logout = () => {
    if (currentUser) logActivity('LOGIN', `User ${currentUser.name} logged out`);
    setCurrentUser(null);
    setCart([]);
  };

  const updateUser = (user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
    logActivity('EDIT', `User profile updated: ${user.name}`);
  };

  const deleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
    if (currentUser?.id === userId) logout();
    logActivity('EDIT', `User deleted: ${userId}`);
  };
  
  const updateUserPassword = (email: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, password: newPassword } : u));
    logActivity('EDIT', `Password changed for ${email}`);
  };

  const addToCart = (product: Product, quantity: number, weight?: number, selectedOptions?: string[], vacuumPacked?: boolean) => {
    setCart(prev => {
      const existingItem = prev.find(item => 
          item.productId === product.id && 
          item.weight === weight &&
          JSON.stringify(item.selectedOptions?.sort()) === JSON.stringify(selectedOptions?.sort()) &&
          item.vacuumPacked === vacuumPacked
      );

      if (existingItem) {
          return prev.map(item => item.id === existingItem.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      
      return [...prev, { 
          id: Math.random().toString(36).substr(2, 9), 
          productId: product.id, 
          product, 
          quantity, 
          weight, 
          selectedOptions,
          vacuumPacked 
      }];
    });
  };

  const removeFromCart = (cartItemId: string) => setCart(prev => prev.filter(item => item.id !== cartItemId));
  const clearCart = () => setCart([]);

  const placeOrder = (order: Order, usedPromoCodeId?: string) => {
    setOrders(prev => [order, ...prev]);
    if (usedPromoCodeId) {
        setPromoCodes(prev => prev.map(code => code.id === usedPromoCodeId ? { ...code, usedBy: [...code.usedBy, 'anonymous'] } : code));
    }
    clearCart();
    
    // Deduct Stock
    order.items.forEach(item => {
        const deduction = item.product.unit === UnitType.KG 
            ? (item.weight || 0) * item.quantity // Deduct grams
            : item.quantity;
        
        setProducts(prev => prev.map(p => {
            if (p.id === item.productId) {
                const currentStock = p.stock || 0;
                return { ...p, stock: Math.max(0, currentStock - deduction) };
            }
            return p;
        }));
    });

    logActivity(order.isManual ? 'POS_SALE' : 'ORDER', `Order placed: #${order.id} (R${order.total})`);
  };

  const updateOrder = (orderId: string, updates: Partial<Order>) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
    logActivity('EDIT', `Order #${orderId} updated: ${JSON.stringify(updates)}`);
  };

  const deleteOrder = (orderId: string) => {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      logActivity('EDIT', `Order #${orderId} deleted`);
  };
  
  const addProduct = (product: Product) => setProducts(prev => [product, ...prev]);
  const updateProduct = (updatedProduct: Product) => setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  const deleteProduct = (productId: string) => setProducts(prev => prev.filter(p => p.id !== productId));
  
  const reorderProducts = (productId: string, direction: 'up' | 'down') => {
      setProducts(prev => {
          const index = prev.findIndex(p => p.id === productId);
          if (index === -1) return prev;
          const newIndex = direction === 'up' ? index - 1 : index + 1;
          if (newIndex < 0 || newIndex >= prev.length) return prev;
          const newProducts = [...prev];
          [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
          return newProducts;
      });
  };

  const addPost = (post: Post) => setPosts(prev => [post, ...prev]);
  const updatePost = (post: Post) => setPosts(prev => prev.map(p => p.id === post.id ? post : p));
  const deletePost = (postId: string) => setPosts(prev => prev.filter(p => p.id !== postId));
  const addPromoCode = (code: PromoCode) => setPromoCodes(prev => [code, ...prev]);
  const deletePromoCode = (id: string) => setPromoCodes(prev => prev.filter(c => c.id !== id));

  const updateConfig = (newConfig: AppConfig) => {
    if (isPreviewMode) setPreviewDataState(prev => ({ ...prev, config: { ...newConfig } }));
    else {
        setConfig({ ...newConfig });
        // Removed explicit syncToSheet here as the useEffect will handle it
    }
    logActivity('EDIT', 'System configuration updated');
  };

  const deleteNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));
  const addReview = (productId: string, review: Review) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: [review, ...(p.reviews || [])] } : p));
  };
  const deleteReview = (productId: string, reviewId: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: (p.reviews || []).filter(r => r.id !== reviewId) } : p));
  };
  const replyToReview = (productId: string, reviewId: string, reply: string) => {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: (p.reviews || []).map(r => r.id === reviewId ? { ...r, adminReply: reply, adminReplyDate: new Date().toISOString() } : r) } : p));
  };
  
  const togglePreviewMode = (enabled: boolean) => setIsPreviewMode(enabled);
  const setPreviewData = (data: Partial<PreviewData>) => setPreviewDataState(prev => ({ ...prev, ...data }));
  const commitPreview = () => {
      if (previewData?.config) setConfig(previewData.config);
      if (previewData?.products) setProducts(previewData.products);
      if (previewData?.posts) setPosts(previewData.posts);
      setPreviewDataState(null);
      setIsPreviewMode(false);
  };
  const cancelPreview = () => {
      setPreviewDataState(null);
      setIsPreviewMode(false);
  };

  // --- Production Actions ---
  const addRawMaterial = (material: RawMaterial) => setRawMaterials(prev => [material, ...prev]);
  const updateRawMaterial = (material: RawMaterial) => setRawMaterials(prev => prev.map(m => m.id === material.id ? material : m));
  const deleteRawMaterial = (id: string) => setRawMaterials(prev => prev.filter(m => m.id !== id));
  const addProductionBatch = (batch: ProductionBatch) => setProductionBatches(prev => [batch, ...prev]);

  const trackProductView = (productId: string) => {
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p));
  };

  const restoreData = (data: any) => {
    let restoredSections = [];
    
    if(data.products) {
        // Run expiry validation on restored products
        const validated = checkAndExpireSpecials(data.products);
        setProducts(validated);
        restoredSections.push('Products');
    }
    if(data.users) {
        setUsers(data.users);
        restoredSections.push('Users');
    }
    if(data.orders) {
        setOrders(data.orders);
        restoredSections.push('Orders');
    }
    if(data.posts) {
        setPosts(data.posts);
        restoredSections.push('Posts');
    }
    if(data.promoCodes) {
        setPromoCodes(data.promoCodes);
        restoredSections.push('Promo Codes');
    }
    if(data.activityLogs) {
        setActivityLogs(data.activityLogs);
        restoredSections.push('Activity Logs');
    }
    if(data.rawMaterials) {
        setRawMaterials(data.rawMaterials);
        restoredSections.push('Raw Materials');
    }
    if(data.productionBatches) {
        setProductionBatches(data.productionBatches);
        restoredSections.push('Production Batches');
    }
    if(data.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
        restoredSections.push('Config');
    }
    
    if (restoredSections.length > 0) {
        logActivity('SYNC', `System restore executed for: ${restoredSections.join(', ')}`);
    }
  };

  const finalConfig = (isPreviewMode && previewData?.config) ? previewData.config : config;

  return (
    <AppContext.Provider value={{
      products: (isPreviewMode && previewData?.products) ? previewData.products : products, 
      orders, users, currentUser, cart, notifications, promoCodes, activityLogs, rawMaterials, productionBatches,
      config: finalConfig, 
      isLoading, posts: (isPreviewMode && previewData?.posts) ? previewData.posts : posts, 
      isPreviewMode, isCloudSyncing, hasLoadedFromCloud, previewData,
      login, logout, addToCart, removeFromCart, clearCart, placeOrder, updateOrder, deleteOrder,
      updateProduct, deleteProduct, addProduct, updateConfig, addNotification, deleteNotification,
      updateUser, deleteUser, updateUserPassword, addPost, updatePost, deletePost, 
      addPromoCode, deletePromoCode, addReview, deleteReview, replyToReview, 
      togglePreviewMode, setPreviewData, commitPreview, cancelPreview, restoreData, syncToSheet, reorderProducts,
      logActivity, addRawMaterial, updateRawMaterial, deleteRawMaterial, addProductionBatch, trackProductView
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
