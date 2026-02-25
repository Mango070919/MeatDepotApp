
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../store';
import { Plus, Search, Edit2, Trash2, X, Camera, ArrowUp, ArrowDown, Star, Save, ArrowLeft, Eye, EyeOff, Loader2, Cloud, Package, AlertTriangle, TrendingDown, DollarSign, Calculator, Calendar, Home, LayoutDashboard, Percent } from 'lucide-react';
import { Product, UnitType, ProductCosting, ProductCheckbox } from '../../types';
import { CATEGORIES } from '../../constants';
import { uploadFile } from '../../services/storageService';

const StarRating: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex">
    {[...Array(5)].map((_, i) => (
      <Star key={i} size={14} className={i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
    ))}
  </div>
);

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

const ProductManager: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, config, updateConfig, setPreviewData, togglePreviewMode, reorderProducts, syncToSheet } = useApp();
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      handleAddNew();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsAddingNew(false);
  };

  const handleAddNew = () => {
    setEditingProduct({
      name: '',
      description: '',
      price: 0,
      specialPrice: 0,
      unit: UnitType.KG,
      category: CATEGORIES[0],
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800',
      available: true,
      featured: false,
      stock: 0,
      reviews: [],
      productCheckboxes: [],
      costing: {
          totalCost: 0,
          markupPercent: 30
      }
    });
    setIsAddingNew(true);
  };

  const handleClosePanel = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
  };

  const handleSave = async (form: Partial<Product>) => {
    let updatedProducts = [...products];
    let updatedConfig = { ...config };

    if (isAddingNew) {
      const newId = Math.random().toString(36).substr(2, 9);
      const newProduct = { ...form, id: newId } as Product;
      
      updatedProducts = [newProduct, ...products];
      addProduct(newProduct);
      
      if (newProduct.featured) {
        updatedConfig.featuredProductOrder = [newId, ...updatedConfig.featuredProductOrder];
        updateConfig(updatedConfig);
      }
    } else {
      const product = form as Product;
      updatedProducts = products.map(p => p.id === product.id ? product : p);
      updateProduct(product);
      
      let newOrder = [...updatedConfig.featuredProductOrder];
      if (product.featured && !newOrder.includes(product.id)) {
        newOrder = [product.id, ...newOrder];
      } else if (!product.featured && newOrder.includes(product.id)) {
        newOrder = newOrder.filter(id => id !== product.id);
      }
      updatedConfig.featuredProductOrder = newOrder;
      updateConfig(updatedConfig);
    }
    
    handleClosePanel();
  };

  const handlePreview = (form: Partial<Product>) => {
      let updatedProducts = [...products];
      if (isAddingNew) {
          updatedProducts = [{ ...form, id: 'preview-new-id' } as Product, ...updatedProducts];
      } else {
          updatedProducts = products.map(p => p.id === form.id ? { ...p, ...form } as Product : p);
      }
      setPreviewData({ products: updatedProducts });
      togglePreviewMode(true);
      if (form.id && !isAddingNew) navigate(`/shop?product=${form.id}`);
      else navigate('/shop');
  };
  
  const toggleAvailability = async (product: Product) => {
      const updated = { ...product, available: !product.available };
      const updatedProducts = products.map(p => p.id === product.id ? updated : p);
      updateProduct(updated);
      await syncToSheet({ products: updatedProducts });
  };
  
  const handleDelete = async (productId: string) => {
      if(window.confirm("Permanently delete this product?")) {
          const updatedProducts = products.filter(p => p.id !== productId);
          deleteProduct(productId);
          await syncToSheet({ products: updatedProducts });
      }
  };
  
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  // Stock Overview Calculation
  const lowStockThreshold = 5; 
  const lowStockItems = products.filter(p => {
      const val = p.unit === UnitType.KG ? (p.stock || 0) / 1000 : (p.stock || 0);
      return val < lowStockThreshold && p.available;
  });
  const totalStockValue = products.reduce((acc, p) => {
      const stock = p.stock || 0;
      const unitValue = p.unit === UnitType.KG ? (p.price / 1000) * stock : p.price * stock;
      return acc + unitValue;
  }, 0);

  return (
    <div className="space-y-8 pb-20 pt-8">
      <div className="flex gap-8 px-2">
        <div className="w-full lg:w-2/3 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-900">Inventory & Stock</h1>
              <button onClick={handleAddNew} className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:scale-105 transition-all">
                  <Plus size={16} /> New Product
              </button>
            </div>
            
            {/* Inventory Tracking Dashboard */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Inventory Value</p>
                        <p className="text-2xl font-bold text-gray-900">R{totalStockValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                    <div className="p-3 bg-green-50 text-green-600 rounded-2xl">
                        <Package size={24} />
                    </div>
                </div>
                <div className={`p-6 rounded-3xl shadow-sm border flex items-center justify-between transition-colors ${lowStockItems.length > 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-100'}`}>
                    <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${lowStockItems.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>Low Stock Alerts</p>
                        <p className={`text-2xl font-bold ${lowStockItems.length > 0 ? 'text-red-600' : 'text-gray-900'}`}>{lowStockItems.length} Items</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${lowStockItems.length > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-50 text-gray-400'}`}>
                        <AlertTriangle size={24} />
                    </div>
                </div>
            </div>

            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search inventory..." className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            
            <div className="space-y-4">
              {filteredProducts.map((p, index) => {
                const stockDisplay = p.unit === UnitType.KG ? `${((p.stock || 0) / 1000).toFixed(1)}kg` : `${p.stock || 0} units`;
                const stockVal = p.unit === UnitType.KG ? (p.stock || 0) / 1000 : (p.stock || 0);
                const isLowStock = stockVal < 5;
                const isNoStock = stockVal <= 0;
                const isOnSpecial = (p.specialPrice || 0) > 0 && (p.specialPrice || 0) < p.price;

                return (
                <div key={p.id} className={`bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4 group ${!p.available ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                  <div className="flex flex-col gap-1">
                      <button onClick={() => reorderProducts(p.id, 'up')} disabled={index === 0} className="p-1 text-gray-300 hover:text-black disabled:opacity-0"><ArrowUp size={16}/></button>
                      <button onClick={() => reorderProducts(p.id, 'down')} disabled={index === filteredProducts.length - 1} className="p-1 text-gray-300 hover:text-black disabled:opacity-0"><ArrowDown size={16}/></button>
                  </div>
                  
                  <div className="relative">
                      <img src={p.image} className="w-20 h-20 rounded-2xl object-cover" />
                      {p.featured && <Star size={16} className="absolute -top-2 -right-2 text-yellow-400 fill-yellow-400" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                          {isNoStock && <span className="bg-red-100 text-red-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Out of Stock</span>}
                          {!isNoStock && isLowStock && <span className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded uppercase">Low Stock</span>}
                          {isOnSpecial && (
                              <span className="bg-yellow-100 text-yellow-800 text-[9px] font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                  Promo {p.specialExpiryDate && <span className="text-[8px] opacity-70">({new Date(p.specialExpiryDate).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})})</span>}
                              </span>
                          )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                              {isOnSpecial ? (
                                  <>
                                    <span className="line-through opacity-50 mr-1">R{p.price}</span>
                                    <span className="text-red-600 font-bold">R{p.specialPrice}</span>
                                  </>
                              ) : `R${p.price}`} / {p.unit}
                          </span>
                          <span className={`font-bold flex items-center gap-1 ${isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                              <Package size={12} /> {stockDisplay}
                          </span>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAvailability(p)} className={`p-2 rounded-lg ${p.available ? 'text-green-600 bg-green-50' : 'text-gray-400 bg-gray-50'}`}>{p.available ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                    <button onClick={() => handleEdit(p)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-[#f4d300] hover:text-black transition-colors"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-red-50 hover:text-red-800 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              )})}
            </div>
        </div>
        {editingProduct && <EditPanel product={editingProduct} onSave={handleSave} onPreview={handlePreview} onClose={handleClosePanel} isNew={isAddingNew} />}
      </div>
    </div>
  );
};

interface EditPanelProps {
  product: Partial<Product>;
  onSave: (product: Partial<Product>) => void;
  onPreview: (product: Partial<Product>) => void;
  onClose: () => void;
  isNew: boolean;
}

const EditPanel: React.FC<EditPanelProps> = ({ product, onSave, onPreview, onClose, isNew }) => {
  const [form, setForm] = useState(product);
  const [costing, setCosting] = useState<ProductCosting>({
      totalCost: product.costing?.totalCost || 0,
      markupPercent: product.costing?.markupPercent || 30,
      // Maintain legacy structure if present
      rawMeatCost: product.costing?.rawMeatCost,
      spicesCost: product.costing?.spicesCost,
      packagingCost: product.costing?.packagingCost,
      labelCost: product.costing?.labelCost,
      overheadPercent: product.costing?.overheadPercent,
  });
  
  const { config, deleteReview } = useApp();
  const [activeTab, setActiveTab] = useState('details');
  const [isUploading, setIsUploading] = useState(false);
  const [newCheckboxLabel, setNewCheckboxLabel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
      setForm(prev => ({ ...prev, costing }));
  }, [costing]);

  // Simplified Calculation
  const unitCost = costing.totalCost || 0;
  const markupMultiplier = 1 + (costing.markupPercent / 100);
  const recommendedPrice = unitCost * markupMultiplier;
  const profitAmount = recommendedPrice - unitCost;
  const currentPriceProfit = (form.price || 0) - unitCost;
  const marginPercent = (form.price || 0) > 0 ? (currentPriceProfit / (form.price || 0)) * 100 : 0;

  const [stockDisplay, setStockDisplay] = useState(() => {
      if (form.unit === UnitType.KG) return (form.stock || 0) / 1000;
      return form.stock || 0;
  });

  const handleStockChange = (val: number) => {
      setStockDisplay(val);
      if (form.unit === UnitType.KG) {
          setForm({ ...form, stock: val * 1000 });
      } else {
          setForm({ ...form, stock: val });
      }
  };

  const handleReviewVisibilityToggle = (reviewId: string) => {
      setForm(prev => ({
          ...prev,
          reviews: (prev.reviews || []).map(r => r.id === reviewId ? { ...r, visible: r.visible === false ? true : false } : r)
      }));
  };

  const handleAddCheckbox = () => {
      if (!newCheckboxLabel.trim()) return;
      const newBox: ProductCheckbox = {
          id: Math.random().toString(36).substr(2, 9),
          label: newCheckboxLabel,
          required: false
      };
      setForm(prev => ({
          ...prev,
          productCheckboxes: [...(prev.productCheckboxes || []), newBox]
      }));
      setNewCheckboxLabel('');
  };

  const handleRemoveCheckbox = (id: string) => {
      setForm(prev => ({
          ...prev,
          productCheckboxes: prev.productCheckboxes?.filter(b => b.id !== id)
      }));
  };

  const toggleCheckboxRequired = (id: string) => {
      setForm(prev => ({
          ...prev,
          productCheckboxes: prev.productCheckboxes?.map(b => b.id === id ? { ...b, required: !b.required } : b)
      }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 800, 800);
        let url = resizedImageBase64;
        if (config.backupMethod === 'CUSTOM_DOMAIN' || (config.googleDrive?.accessToken && config.googleDrive?.folderId)) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `prod_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }
        setForm({ ...form, image: url });
      } catch (error) {
        alert("Image processing failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };
  
  const handlePanelSave = async () => {
      setIsSaving(true);
      await onSave(form);
      setIsSaving(false);
  };

  return (
    <div className="fixed top-0 right-0 h-full w-full max-w-md bg-black border-l border-white/10 shadow-2xl z-[150] flex flex-col animate-in slide-in-from-right-full">
      <div className="p-6 bg-[#121212] border-b border-white/10 flex justify-between items-center shrink-0">
        <h2 className="text-xl font-bold text-white">{isNew ? 'Add New Product' : 'Edit Product'}</h2>
        <div className="flex items-center gap-4">
          <button onClick={handlePanelSave} disabled={isSaving} className="bg-[#f4d300] text-black px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50">
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              <span>{isSaving ? 'Saving...' : (isNew ? 'Add' : 'Save')}</span>
          </button>
          <button onClick={onClose} className="p-2 text-white/50 rounded-full"><X size={20} /></button>
        </div>
      </div>
      <div className="flex border-b border-white/10 bg-[#121212] shrink-0">
          <button onClick={() => setActiveTab('details')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'details' ? 'text-[#f4d300] border-b-2 border-[#f4d300]' : 'text-white/40'}`}>Details</button>
          <button onClick={() => setActiveTab('options')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'options' ? 'text-[#f4d300] border-b-2 border-[#f4d300]' : 'text-white/40'}`}>Options</button>
          <button onClick={() => setActiveTab('costing')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'costing' ? 'text-[#f4d300] border-b-2 border-[#f4d300]' : 'text-white/40'}`}>Costing</button>
          {!isNew && <button onClick={() => setActiveTab('reviews')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'reviews' ? 'text-[#f4d300] border-b-2 border-[#f4d300]' : 'text-white/40'}`}>Reviews</button>}
      </div>
      
      {activeTab === 'details' && (
        <div className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product Image</label>
                <div className="relative w-full h-48 bg-gray-800 rounded-2xl flex items-center justify-center">
                    <img src={form.image} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                    <label htmlFor="image-upload" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                        {isUploading ? <Loader2 className="animate-spin" size={32} /> : <><Camera size={32} /><span className="text-xs font-bold mt-1">Upload</span></>}
                    </label>
                    <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                </div>
                <input type="text" className="w-full px-4 py-3 bg-white text-gray-900 rounded-xl text-xs" placeholder="Or paste image URL" value={form.image?.startsWith('data:') ? '' : form.image} onChange={e => setForm({...form, image: e.target.value})} />
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Name</label><input className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl outline-none" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Price</label><input type="number" className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl" value={form.price === 0 ? '' : form.price} onChange={e => setForm({...form, price: Number(e.target.value)})} placeholder="0" /></div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-[#f4d300] uppercase tracking-wider">Special Price</label>
                    <input type="number" className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl border border-[#f4d300]" value={form.specialPrice === 0 ? '' : form.specialPrice} onChange={e => setForm({...form, specialPrice: Number(e.target.value)})} placeholder="0" />
                </div>
            </div>
            {(form.specialPrice || 0) > 0 && (
                <div className="space-y-2 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#f4d300] uppercase tracking-wider flex items-center gap-2">
                            <Calendar size={14}/> Ends On (Auto-Delete)
                        </label>
                        {form.specialExpiryDate && (
                            <button onClick={() => setForm({...form, specialExpiryDate: undefined})} className="text-[10px] text-red-400 hover:text-red-300 font-bold uppercase">Clear Date</button>
                        )}
                    </div>
                    <input 
                        type="date" 
                        className="w-full px-5 py-4 bg-white/10 text-white rounded-2xl border border-[#f4d300]/30 outline-none focus:ring-1 focus:ring-[#f4d300]"
                        value={form.specialExpiryDate || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={e => setForm({...form, specialExpiryDate: e.target.value})}
                    />
                    <p className="text-[9px] text-white/40">If set, the special price will automatically revert to 0 after this date.</p>
                </div>
            )}
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label><select className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Type</label><select className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl" value={form.unit} onChange={e => setForm({...form, unit: e.target.value as UnitType})}>{Object.values(UnitType).map(u => <option key={u} value={u}>{u}</option>)}</select></div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Stock ({form.unit === UnitType.KG ? 'kg' : 'units'})</label>
                    <input type="number" step="0.5" className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl" value={stockDisplay === 0 ? '' : stockDisplay} onChange={e => handleStockChange(Number(e.target.value))} placeholder="0" />
                </div>
            </div>
            <div className="space-y-2"><label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Description</label><textarea className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl min-h-[100px]" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
            <div className="flex items-center gap-3"><input type="checkbox" id="featured" checked={form.featured} onChange={e => setForm({...form, featured: e.target.checked})} className="w-5 h-5 accent-[#f4d300]" /><label htmlFor="featured" className="text-sm font-bold text-white">Butcher's Pick (Premium)</label></div>
            <div className="pt-6 border-t border-white/10 flex gap-4"><button onClick={() => onPreview(form)} className="flex-1 py-4 font-bold text-white border border-white/20 rounded-2xl flex items-center justify-center gap-2"><Eye size={18} /> Preview</button><button onClick={handlePanelSave} disabled={isSaving} className="flex-1 bg-[#f4d300] text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2">{isSaving ? 'Syncing...' : 'Save'}</button></div>
        </div>
      )}

      {activeTab === 'options' && (
          <div className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="space-y-4">
                  <div className="flex gap-2">
                      <input 
                        className="flex-1 px-4 py-3 bg-white text-gray-900 rounded-xl text-sm outline-none border border-white/10"
                        placeholder="Add Checkbox (e.g. Sliced)"
                        value={newCheckboxLabel}
                        onChange={e => setNewCheckboxLabel(e.target.value)}
                      />
                      <button onClick={handleAddCheckbox} className="bg-[#f4d300] text-black p-3 rounded-xl hover:bg-yellow-400"><Plus size={20} /></button>
                  </div>
                  <div className="space-y-3">
                      {form.productCheckboxes?.map(box => (
                          <div key={box.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <input type="checkbox" checked={box.required} onChange={() => toggleCheckboxRequired(box.id)} className="w-4 h-4 accent-red-500" />
                                  <div className="space-y-0.5"><p className="text-white font-medium text-sm">{box.label}</p><p className={`text-[10px] uppercase font-bold tracking-wider ${box.required ? 'text-red-400' : 'text-green-400'}`}>{box.required ? 'Compulsory' : 'Optional'}</p></div>
                              </div>
                              <button onClick={() => handleRemoveCheckbox(box.id)} className="text-gray-500 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}
      
      {activeTab === 'costing' && (
          <div className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <DollarSign size={12}/> Unit Cost (R)
                      </label>
                      <input 
                          type="number" 
                          className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl text-lg font-bold" 
                          value={costing.totalCost === 0 ? '' : costing.totalCost} 
                          onChange={e => setCosting({...costing, totalCost: Number(e.target.value)})} 
                          placeholder="0.00" 
                      />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                          <Percent size={12}/> Markup (%)
                      </label>
                      <input 
                          type="number" 
                          className="w-full px-5 py-4 bg-white text-gray-900 rounded-2xl text-lg font-bold" 
                          value={costing.markupPercent === 0 ? '' : costing.markupPercent} 
                          onChange={e => setCosting({...costing, markupPercent: Number(e.target.value)})} 
                          placeholder="30" 
                      />
                  </div>
              </div>

              {/* Profit Card */}
              <div className="bg-[#1a1a1a] p-6 rounded-3xl border border-white/10 space-y-6 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Calculator size={80} className="text-white"/>
                  </div>
                  
                  <div className="relative z-10">
                      <div className="flex justify-between items-start border-b border-white/10 pb-4 mb-4">
                          <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Recommended Price</p>
                              <p className="text-3xl font-bold text-white tracking-tighter">R{recommendedPrice.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Net Profit</p>
                              <p className="text-xl font-bold text-green-500">R{profitAmount.toFixed(2)}</p>
                          </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                          <div className="space-y-1">
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Current Margin</p>
                              <p className={`text-sm font-bold ${marginPercent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {marginPercent.toFixed(1)}% on Sales
                              </p>
                          </div>
                          <button 
                              onClick={() => setForm({...form, price: parseFloat(recommendedPrice.toFixed(2))})} 
                              className="bg-[#f4d300] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-yellow-400 transition-colors shadow-lg"
                          >
                              Apply Price
                          </button>
                      </div>
                  </div>
              </div>
              
              <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20">
                  <p className="text-xs text-blue-300 leading-relaxed">
                      <span className="font-bold text-blue-200">Tip:</span> Ensure "Unit Cost" includes meat, spices, packaging, and overheads for accurate profit reporting.
                  </p>
              </div>
          </div>
      )}

      {activeTab === 'reviews' && (
        <div className="p-8 space-y-4 overflow-y-auto no-scrollbar flex-1">
            {form.reviews?.map(review => (
                <div key={review.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">{review.userName}</p>
                            <button onClick={() => handleReviewVisibilityToggle(review.id)} className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${review.visible !== false ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{review.visible !== false ? 'Public' : 'Hidden'}</button>
                        </div>
                        <button onClick={() => { deleteReview(form.id!, review.id); setForm(prev => ({ ...prev, reviews: prev.reviews?.filter(r => r.id !== review.id) })); }} className="text-red-500 hover:bg-red-500/10 p-2 rounded-full"><Trash2 size={14} /></button>
                    </div>
                    <StarRating rating={review.rating}/>
                    <p className="text-xs text-white/70 italic">"{review.comment}"</p>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};

export default ProductManager;
