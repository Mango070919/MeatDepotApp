
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Save, Briefcase, CreditCard, Database, FileCode, ClipboardCopy, Download, Upload, Copy, FileText, RotateCcw, X, Terminal, Loader2, Eye, Camera, Globe, Package, Truck, Flame, Server, HardDrive, Link, Mail } from 'lucide-react';
import { AppConfig, BusinessDetails } from '../../types';
import { useNavigate } from 'react-router-dom';

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
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


const Settings: React.FC = () => {
  const { config, updateConfig, togglePreviewMode, products, users, orders, posts, restoreData, previewData, setPreviewData, syncToSheet, promoCodes, rawMaterials, productionBatches, activityLogs } = useApp();
  const [formData, setFormData] = useState<AppConfig>(previewData?.config || config);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  // Manual Restore State
  const [showManualRestore, setShowManualRestore] = useState(false);
  const [manualRestoreData, setManualRestoreData] = useState('');
  const [parsedRestoreData, setParsedRestoreData] = useState<any>(null);
  
  const [restoreSelection, setRestoreSelection] = useState({
      config: true,
      products: true,
      users: true,
      orders: true,
      posts: true,
      promoCodes: true,
      rawMaterials: true,
      productionBatches: true,
      activityLogs: true
  });

  useEffect(() => {
      if (!previewData?.config) setFormData(config);
  }, [config, previewData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        updateConfig(formData);
        // Force immediate sync to cloud (if configured elsewhere) or just local update
        await syncToSheet({ config: formData });
        setPreviewData({ config: undefined });
        alert('Settings saved!');
    } catch (e) {
        console.error(e);
        alert("Saved locally.");
    } finally {
        setIsSaving(false);
    }
  };

  const handlePreview = () => {
      setPreviewData({ config: formData });
      togglePreviewMode(true);
      navigate('/');
  };

  const updateBusinessDetails = (field: keyof BusinessDetails, value: string) => {
      setFormData({ ...formData, businessDetails: { ...formData.businessDetails!, [field]: value } });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedImageBase64 = await resizeImage(file, 300, 300);
        setFormData({ ...formData, logoUrl: resizedImageBase64 });
      } catch (error) {
        alert("Logo upload failed.");
      }
    }
  };

  const handleInvoiceLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedImageBase64 = await resizeImage(file, 300, 300);
        setFormData({ ...formData, invoiceLogoUrl: resizedImageBase64 });
      } catch (error) {
        alert("Invoice logo upload failed.");
      }
    }
  };

  const handleBackup = () => {
    const data: any = { timestamp: new Date().toISOString() };
    
    if (restoreSelection.config) data.config = formData;
    if (restoreSelection.products) data.products = products;
    if (restoreSelection.users) data.users = users;
    if (restoreSelection.orders) data.orders = orders;
    if (restoreSelection.posts) data.posts = posts;
    if (restoreSelection.promoCodes) data.promoCodes = promoCodes;
    if (restoreSelection.rawMaterials) data.rawMaterials = rawMaterials;
    if (restoreSelection.productionBatches) data.productionBatches = productionBatches;
    if (restoreSelection.activityLogs) data.activityLogs = activityLogs;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meat_depot_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
      const data: any = { timestamp: new Date().toISOString() };
      if (restoreSelection.config) data.config = formData;
      if (restoreSelection.products) data.products = products;
      if (restoreSelection.users) data.users = users;
      if (restoreSelection.orders) data.orders = orders;
      if (restoreSelection.posts) data.posts = posts;
      if (restoreSelection.promoCodes) data.promoCodes = promoCodes;
      if (restoreSelection.rawMaterials) data.rawMaterials = rawMaterials;
      if (restoreSelection.productionBatches) data.productionBatches = productionBatches;
      if (restoreSelection.activityLogs) data.activityLogs = activityLogs;

      const jsonString = JSON.stringify(data, null, 0); // Minified for clipboard
      navigator.clipboard.writeText(jsonString).then(() => {
          alert("Success! Selected data copied to clipboard.");
      }).catch(err => {
          alert("Failed to copy to clipboard: " + err);
      });
  };

  const parseRestoreInput = (input: string) => {
      try {
          const data = JSON.parse(input);
          setParsedRestoreData(data);
          // Auto-select available fields
          setRestoreSelection({
              config: !!data.config,
              products: !!data.products,
              users: !!data.users,
              orders: !!data.orders,
              posts: !!data.posts,
              promoCodes: !!data.promoCodes,
              rawMaterials: !!data.rawMaterials,
              productionBatches: !!data.productionBatches,
              activityLogs: !!data.activityLogs
          });
      } catch (e) {
          setParsedRestoreData(null);
      }
  };

  const handleManualRestoreSubmit = () => {
      if (!parsedRestoreData) return;
      
      if (window.confirm(`Restore selected data from ${parsedRestoreData.timestamp || 'unknown date'}?\n\nThis will OVERWRITE current data for the selected sections.`)) {
          processRestore(parsedRestoreData);
          setManualRestoreData('');
          setParsedRestoreData(null);
          setShowManualRestore(false);
          alert("System state restored successfully.");
      }
  };

  const processRestore = (data: any) => {
      const payload: any = {};
      if (restoreSelection.config && data.config) payload.config = data.config;
      if (restoreSelection.products && data.products) payload.products = data.products;
      if (restoreSelection.users && data.users) payload.users = data.users;
      if (restoreSelection.orders && data.orders) payload.orders = data.orders;
      if (restoreSelection.posts && data.posts) payload.posts = data.posts;
      if (restoreSelection.promoCodes && data.promoCodes) payload.promoCodes = data.promoCodes;
      if (restoreSelection.rawMaterials && data.rawMaterials) payload.rawMaterials = data.rawMaterials;
      if (restoreSelection.productionBatches && data.productionBatches) payload.productionBatches = data.productionBatches;
      if (restoreSelection.activityLogs && data.activityLogs) payload.activityLogs = data.activityLogs;
      
      restoreData(payload);
      if (payload.config) setFormData(payload.config);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                setParsedRestoreData(data);
                setManualRestoreData(JSON.stringify(data, null, 2));
                setShowManualRestore(true);
                // Auto-select available
                setRestoreSelection({
                    config: !!data.config,
                    products: !!data.products,
                    users: !!data.users,
                    orders: !!data.orders,
                    posts: !!data.posts,
                    promoCodes: !!data.promoCodes,
                    rawMaterials: !!data.rawMaterials,
                    productionBatches: !!data.productionBatches,
                    activityLogs: !!data.activityLogs
                });
            } catch (err) {
                alert('Invalid backup file.');
            }
        };
        reader.readAsText(e.target.files[0]);
    }
  };
  
  const toggleSelection = (key: keyof typeof restoreSelection) => {
      setRestoreSelection(prev => ({ ...prev, [key]: !prev[key] }));
  };
  
  return (
    <div className="space-y-8 pb-20 pt-8">
      <div className="flex justify-between items-center px-2">
        <h1 className="text-4xl font-bold text-gray-900">App Settings</h1>
        <div className="flex gap-4">
            <button onClick={handlePreview} className="bg-white text-gray-800 border border-gray-300 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors"><Eye size={20} /> Preview Mode</button>
            <button onClick={handleSave} disabled={isSaving} className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50">
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>
      
      {/* Cloud & Backup Strategy */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
              <div className="bg-purple-600 p-3 rounded-2xl text-white"><Server size={24} /></div>
              <div><h2 className="text-xl font-bold text-gray-900">Cloud & Backup Strategy</h2><p className="text-xs text-gray-500 font-medium">Choose where your data and images are stored.</p></div>
          </div>

          <div className="space-y-6">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select Backup Destination</label>
                  <select 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] font-bold"
                      value={formData.backupMethod || 'GOOGLE_DRIVE'}
                      onChange={(e) => setFormData({ ...formData, backupMethod: e.target.value as any })}
                  >
                      <option value="GOOGLE_DRIVE">Google Drive (Recommended)</option>
                      <option value="FIREBASE">Firebase (Fast & Real-time)</option>
                      <option value="CUSTOM_DOMAIN">Custom Domain / Server</option>
                  </select>
                  <p className="text-[10px] text-gray-400 italic mt-1">
                      Note: Vercel hosting is stateless. To ensure data persists across sessions and devices, you <b>must</b> configure one of the cloud sync methods above.
                  </p>
              </div>

              {/* Dynamic Configuration Fields */}
              {formData.backupMethod === 'GOOGLE_DRIVE' && (
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-blue-800 font-bold text-sm"><HardDrive size={16}/> Google Drive Settings</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Access Token</label>
                              <input type="password" className="w-full p-3 bg-white text-gray-900 rounded-xl border border-blue-200 outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={formData.googleDrive?.accessToken || ''} onChange={(e) => setFormData({ ...formData, googleDrive: { ...formData.googleDrive!, accessToken: e.target.value } })} placeholder="OAuth Token" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Folder ID</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-blue-200 outline-none focus:ring-1 focus:ring-blue-500 text-sm" value={formData.googleDrive?.folderId || ''} onChange={(e) => setFormData({ ...formData, googleDrive: { ...formData.googleDrive!, folderId: e.target.value } })} placeholder="Folder ID" />
                          </div>
                      </div>
                  </div>
              )}

              {formData.backupMethod === 'FIREBASE' && (
                  <div className="p-6 bg-orange-50 rounded-2xl border border-orange-100 space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-orange-800 font-bold text-sm"><Flame size={16}/> Firebase Configuration</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">API Key</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-orange-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, apiKey: e.target.value } })} placeholder="AIzaSy..." />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Project ID</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-orange-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, projectId: e.target.value } })} placeholder="project-id" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Storage Bucket</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-orange-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" value={formData.firebaseConfig?.storageBucket || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, storageBucket: e.target.value } })} placeholder="bucket.appspot.com" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">App ID</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-orange-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" value={formData.firebaseConfig?.appId || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, appId: e.target.value } })} placeholder="1:..." />
                          </div>
                      </div>
                  </div>
              )}

              {formData.backupMethod === 'CUSTOM_DOMAIN' && (
                  <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100 space-y-4 animate-in fade-in">
                      <div className="flex items-center gap-2 text-purple-800 font-bold text-sm"><Globe size={16}/> Custom Server Settings</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">API Endpoint URL</label>
                              <input className="w-full p-3 bg-white text-gray-900 rounded-xl border border-purple-200 outline-none focus:ring-1 focus:ring-purple-500 text-sm" value={formData.customDomain?.url || ''} onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, url: e.target.value } })} placeholder="https://api.mysite.com/v1" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">API Key / Token</label>
                              <input type="password" className="w-full p-3 bg-white text-gray-900 rounded-xl border border-purple-200 outline-none focus:ring-1 focus:ring-purple-500 text-sm" value={formData.customDomain?.apiKey || ''} onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, apiKey: e.target.value } })} placeholder="Secret Key" />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </section>

      {/* App Hosting / Public Link */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
              <div className="bg-[#f4d300] p-3 rounded-2xl text-black"><Link size={24} /></div>
              <div><h2 className="text-xl font-bold text-gray-900">App Hosting Link</h2><p className="text-xs text-gray-500 font-medium">Set the custom domain where this app is hosted.</p></div>
          </div>
          <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public App URL</label>
              <input 
                  className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" 
                  value={formData.appUrl || ''} 
                  onChange={(e) => setFormData({ ...formData, appUrl: e.target.value })} 
                  placeholder="e.g. https://app.meatdepot.co.za" 
              />
              <p className="text-[10px] text-gray-400">This link will be used in generated QR codes and shareable messages.</p>
          </div>
      </section>

      {/* Email Notifications */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
              <div className="bg-blue-600 p-3 rounded-2xl text-white"><Mail size={24} /></div>
              <div><h2 className="text-xl font-bold text-gray-900">Email Notifications</h2><p className="text-xs text-gray-500 font-medium">Configure automated order confirmation emails.</p></div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-xs text-blue-800 flex gap-2">
              <Mail size={16} className="shrink-0"/>
              <p>
                  <strong>Automated Emails:</strong> The system is configured to send order summaries to customers. 
                  To enable this, you must set <code>EMAIL_USER</code> and <code>EMAIL_PASS</code> in your environment variables (e.g., Vercel Dashboard).
              </p>
          </div>

          <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                      <p className="text-sm font-bold text-gray-900">Order Confirmation Emails</p>
                      <p className="text-[10px] text-gray-500">Send an email to customers immediately after they place an order.</p>
                  </div>
                  <div className="text-green-600 font-bold text-[10px] uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">Active</div>
              </div>
          </div>
      </section>

      {/* Home Screen Content */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                <div className="bg-[#f4d300] p-3 rounded-2xl text-black"><Globe size={24} /></div>
                <div><h2 className="text-xl font-bold text-gray-900">Home Screen Content</h2><p className="text-xs text-gray-500 font-medium">Banners, Announcements & Promos.</p></div>
          </div>
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scrolling Announcement</label>
                  <input className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm font-bold" value={formData.announcement || ''} onChange={(e) => setFormData({ ...formData, announcement: e.target.value })} placeholder="e.g. FREE DELIVERY ON ORDERS OVER R500" />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hero Promo Text</label>
                  <input className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.promoText || ''} onChange={(e) => setFormData({ ...formData, promoText: e.target.value })} placeholder="e.g. R50 OFF YOUR FIRST ORDER" />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Main Banner URL (Image or YouTube)</label>
                  <input className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm font-mono" value={formData.homepageBanners?.[0] || ''} onChange={(e) => setFormData({ ...formData, homepageBanners: [e.target.value] })} placeholder="https://..." />
              </div>
          </div>
      </section>

      {/* Services & Features Section */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                <div className="bg-[#f4d300] p-3 rounded-2xl text-black"><Package size={24} /></div>
                <div><h2 className="text-xl font-bold text-gray-900">Services & Logistics</h2><p className="text-xs text-gray-500 font-medium">Delivery Fees & Features.</p></div>
          </div>
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery Fee Calculation</label>
                  <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
                      <button 
                          onClick={() => setFormData({ ...formData, deliveryCalculationMethod: 'FIXED' })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${(!formData.deliveryCalculationMethod || formData.deliveryCalculationMethod === 'FIXED') ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          Fixed Fee
                      </button>
                      <button 
                          onClick={() => setFormData({ ...formData, deliveryCalculationMethod: 'DISTANCE' })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.deliveryCalculationMethod === 'DISTANCE' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          Distance Based
                      </button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.deliveryCalculationMethod === 'DISTANCE' && (
                      <div className="space-y-2 animate-in fade-in">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Delivery Rate (Per KM)</label>
                          <div className="relative">
                              <input 
                                  type="number" 
                                  className="w-full p-3 pl-8 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm font-bold" 
                                  value={formData.deliveryRatePerKm || ''} 
                                  onChange={(e) => setFormData({ ...formData, deliveryRatePerKm: Number(e.target.value) })} 
                                  placeholder="e.g. 10" 
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                          </div>
                      </div>
                  )}
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{formData.deliveryCalculationMethod === 'DISTANCE' ? 'Base / Min Delivery Fee' : 'Fixed Delivery Fee'}</label>
                      <div className="relative">
                          <input 
                              type="number" 
                              className="w-full p-3 pl-8 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm font-bold" 
                              value={formData.deliveryFee || ''} 
                              onChange={(e) => setFormData({ ...formData, deliveryFee: Number(e.target.value) })} 
                              placeholder="e.g. 50" 
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div>
                      <p className="font-bold text-sm text-gray-900">Vacuum Packaging Selection</p>
                      <p className="text-xs text-gray-500">Allow customers to choose vacuum sealing for items.</p>
                  </div>
                  <button 
                      onClick={() => setFormData({...formData, enableVacuumPack: !formData.enableVacuumPack})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.enableVacuumPack ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.enableVacuumPack ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
              </div>
          </div>
      </section>

      {/* Branding & Receipt Section */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                <div className="bg-[#f4d300] p-3 rounded-2xl text-black"><Briefcase size={24} /></div>
                <div><h2 className="text-xl font-bold text-gray-900">Receipt & Business Details</h2><p className="text-xs text-gray-500 font-medium">Manage how your invoices and app branding look.</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">App Logo</label>
                  <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-2 overflow-hidden">{formData.logoUrl ? <img src={formData.logoUrl} className="w-full h-full object-contain" /> : <span className="text-[8px]">No Logo</span>}</div>
                  <label className="flex-1 cursor-pointer"><div className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><Camera size={16} /><span>Change Logo</span></div><input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} /></label></div>
                  <input className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none mt-1" placeholder="Or paste URL..." value={formData.logoUrl} onChange={(e) => setFormData({...formData, logoUrl: e.target.value})} />
              </div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Invoice Logo</label>
                  <div className="flex items-center gap-4"><div className="w-16 h-16 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-center p-2 overflow-hidden">{formData.invoiceLogoUrl ? <img src={formData.invoiceLogoUrl} className="w-full h-full object-contain" /> : <span className="text-[8px] text-center">Same as App</span>}</div>
                  <label className="flex-1 cursor-pointer"><div className="w-full p-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><Camera size={16} /><span>Set Specific Logo</span></div><input type="file" accept="image/*" className="hidden" onChange={handleInvoiceLogoUpload} /></label></div>
                  <input className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none mt-1" placeholder="Or paste URL..." value={formData.invoiceLogoUrl || ''} onChange={(e) => setFormData({...formData, invoiceLogoUrl: e.target.value})} />
              </div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Company Name</label><input className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm font-bold" value={formData.businessDetails?.companyName || ''} onChange={(e) => updateBusinessDetails('companyName', e.target.value)} /></div>
              <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</label><input className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.email || ''} onChange={(e) => updateBusinessDetails('email', e.target.value)} /></div>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Details (Banking)</label><textarea className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" rows={4} value={formData.businessDetails?.bankingDetails || ''} onChange={(e) => updateBusinessDetails('bankingDetails', e.target.value)} /></div>
          </div>
      </section>

      {/* Manual Backup/Restore */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6"><div className="bg-[#f4d300] p-3 rounded-2xl text-black"><Database size={24} /></div><h2 className="text-xl font-bold text-gray-900">Local Backup & Restore</h2></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Based */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                  <h3 className="font-bold text-gray-700 text-sm flex items-center gap-2"><FileCode size={16}/> File Backup</h3>
                  <div className="flex gap-2">
                      <button onClick={handleBackup} className="flex-1 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2"><Download size={14} /> Download JSON</button>
                      <label className="flex-1 cursor-pointer"><div className="w-full bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 flex items-center justify-center gap-2"><Upload size={14} /> Upload JSON</div><input type="file" accept=".json" className="hidden" onChange={handleRestore} /></label>
                  </div>
              </div>

              {/* Clipboard Based */}
              <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h3 className="font-bold text-blue-800 text-sm flex items-center gap-2"><ClipboardCopy size={16}/> Quick Text Backup</h3>
                  <div className="flex gap-2">
                      <button onClick={handleCopyToClipboard} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-700 flex items-center justify-center gap-2 shadow-md"><Copy size={14} /> Copy State</button>
                      <button onClick={() => setShowManualRestore(!showManualRestore)} className="flex-1 bg-white text-blue-600 border border-blue-200 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-50 flex items-center justify-center gap-2"><FileText size={14} /> Paste State</button>
                  </div>
              </div>
          </div>
          
          <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100 text-xs text-yellow-800 flex gap-2">
              <Database size={16} className="shrink-0"/>
              <p><strong>Hosting on Vercel?</strong> Vercel does not store data permanently. You MUST configure Google Drive or Firebase above, or manually backup/restore your data regularly using these tools.</p>
          </div>

          {/* Manual Restore Text Area */}
          {showManualRestore && (
              <div className="animate-in fade-in slide-in-from-top-4 space-y-4 bg-gray-900 p-6 rounded-3xl border border-gray-800">
                  <div className="flex justify-between items-center text-white">
                      <h3 className="font-bold text-sm flex items-center gap-2"><Terminal size={16} className="text-[#f4d300]"/> Manual Restoration Console</h3>
                      <button onClick={() => setShowManualRestore(false)} className="text-gray-500 hover:text-white"><X size={18}/></button>
                  </div>
                  <p className="text-[10px] text-gray-400">Paste the JSON string you previously copied here to restore the entire application state. Warning: This overwrites all current data.</p>
                  <textarea 
                      className="w-full h-48 bg-black text-green-400 font-mono text-xs p-4 rounded-xl border border-gray-700 focus:border-[#f4d300] outline-none resize-none"
                      placeholder='Paste JSON data here... {"config": ...}'
                      value={manualRestoreData}
                      onChange={(e) => {
                          setManualRestoreData(e.target.value);
                          parseRestoreInput(e.target.value);
                      }}
                  />
                  
                  {parsedRestoreData && (
                      <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
                          <p className="text-xs font-bold text-white uppercase tracking-widest">Select Data to Restore/Backup:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {Object.keys(restoreSelection).map((key) => (
                                  <label key={key} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-700 transition-colors">
                                      <input 
                                          type="checkbox" 
                                          checked={(restoreSelection as any)[key]} 
                                          onChange={() => toggleSelection(key as any)}
                                          className="rounded border-gray-600 bg-gray-700 text-[#f4d300] focus:ring-[#f4d300]"
                                      />
                                      <span className="text-xs text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                  )}

                  <div className="flex justify-end">
                      <button 
                          onClick={handleManualRestoreSubmit}
                          disabled={!parsedRestoreData}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                          <RotateCcw size={14} /> Restore Selected Data
                      </button>
                  </div>
              </div>
          )}
      </section>
    </div>
  );
};

export default Settings;
