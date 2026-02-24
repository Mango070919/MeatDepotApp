
import React, { useState, useEffect } from 'react';
import { useApp } from '../../store';
import { Save, Briefcase, Camera, Globe, Package, Truck, Link, Loader2, Eye, Database, Flame, Server, Key, Mail, Sparkles, HardDrive, X, Plus, Facebook } from 'lucide-react';
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
  const { config, updateConfig, togglePreviewMode, previewData, setPreviewData, syncToSheet } = useApp();
  const [formData, setFormData] = useState<AppConfig>(previewData?.config || config);
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
      if (!previewData?.config) setFormData(config);
  }, [config, previewData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        updateConfig(formData);
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

  return (
    <div className="space-y-8 pb-20 pt-8 max-w-6xl mx-auto">
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

      {/* Security & Admin Access */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
              <div className="bg-red-600 p-3 rounded-2xl text-white"><Globe size={24} /></div>
              <div><h2 className="text-xl font-bold text-gray-900">Security & Admin Access</h2><p className="text-xs text-gray-500 font-medium">Protect your admin dashboard with custom credentials.</p></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Username</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 text-sm font-bold" 
                      value={formData.adminCredentials?.username || ''} 
                      onChange={(e) => setFormData({ ...formData, adminCredentials: { ...(formData.adminCredentials || { username: '' }), username: e.target.value } })} 
                      placeholder="e.g. MeatAdmin98" 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin Password</label>
                  <input 
                      type="password"
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-red-500 text-sm" 
                      value={formData.adminCredentials?.password || ''} 
                      onChange={(e) => setFormData({ ...formData, adminCredentials: { ...(formData.adminCredentials || { username: '' }), password: e.target.value } })} 
                      placeholder="••••••••" 
                  />
              </div>
          </div>
          <p className="text-[10px] text-gray-400">If left blank, the default credentials from the source code will be used. <strong>Highly recommended to change these for production.</strong></p>
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
                      <button 
                          onClick={() => setFormData({ ...formData, deliveryCalculationMethod: 'ZONES' })}
                          className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${formData.deliveryCalculationMethod === 'ZONES' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                      >
                          Zones
                      </button>
                  </div>
              </div>

              {formData.deliveryCalculationMethod === 'ZONES' && (
                  <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-200 animate-in fade-in">
                      <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-gray-900">Delivery Zones</h3>
                          <button 
                              onClick={() => {
                                  const newZone = { id: Math.random().toString(36).substr(2, 9), name: 'New Zone', fee: 50, minDistance: 0, maxDistance: 10 };
                                  setFormData({ ...formData, deliveryZones: [...(formData.deliveryZones || []), newZone] });
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline"
                          >
                              <Plus size={12} /> Add Zone
                          </button>
                      </div>
                      <div className="space-y-3">
                          {(formData.deliveryZones || []).map((zone, index) => (
                              <div key={zone.id} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm relative group">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Zone Name</label>
                                      <input 
                                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold" 
                                          value={zone.name} 
                                          onChange={(e) => {
                                              const newZones = [...(formData.deliveryZones || [])];
                                              newZones[index].name = e.target.value;
                                              setFormData({ ...formData, deliveryZones: newZones });
                                          }}
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Min Distance (km)</label>
                                      <input 
                                          type="number"
                                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                                          value={zone.minDistance || 0} 
                                          onChange={(e) => {
                                              const newZones = [...(formData.deliveryZones || [])];
                                              newZones[index].minDistance = Number(e.target.value);
                                              setFormData({ ...formData, deliveryZones: newZones });
                                          }}
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Max Distance (km)</label>
                                      <input 
                                          type="number"
                                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs" 
                                          value={zone.maxDistance || 0} 
                                          onChange={(e) => {
                                              const newZones = [...(formData.deliveryZones || [])];
                                              newZones[index].maxDistance = Number(e.target.value);
                                              setFormData({ ...formData, deliveryZones: newZones });
                                          }}
                                      />
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-bold text-gray-400 uppercase">Fee (R)</label>
                                      <input 
                                          type="number"
                                          className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-blue-600" 
                                          value={zone.fee} 
                                          onChange={(e) => {
                                              const newZones = [...(formData.deliveryZones || [])];
                                              newZones[index].fee = Number(e.target.value);
                                              setFormData({ ...formData, deliveryZones: newZones });
                                          }}
                                      />
                                  </div>
                                  <button 
                                      onClick={() => {
                                          const newZones = (formData.deliveryZones || []).filter((_, i) => i !== index);
                                          setFormData({ ...formData, deliveryZones: newZones });
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                  >
                                      <X size={12} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

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

      {/* Cloud Sync & API Credentials */}
      <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-6">
                <div className="bg-blue-600 p-3 rounded-2xl text-white"><Database size={24} /></div>
                <div><h2 className="text-xl font-bold text-gray-900">Cloud Sync & API Credentials</h2><p className="text-xs text-gray-500 font-medium">Manage your cloud backups and external service keys.</p></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Backup Strategy */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><HardDrive size={16} className="text-blue-500" /> Backup Destination</h3>
                  <select 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold text-sm"
                      value={formData.backupMethod || 'GOOGLE_DRIVE'}
                      onChange={(e) => setFormData({ ...formData, backupMethod: e.target.value as any })}
                  >
                      <option value="GOOGLE_DRIVE">Google Drive (Recommended)</option>
                      <option value="FIREBASE">Firebase (Fast & Real-time)</option>
                      <option value="CUSTOM_DOMAIN">Custom Domain / Server</option>
                  </select>
              </div>

              {/* Gemini AI */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sparkles size={16} className="text-purple-500" /> Gemini AI</h3>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gemini API Key</label>
                      <input 
                          type="password"
                          className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-purple-500 text-sm font-mono" 
                          value={formData.geminiApiKey || ''} 
                          onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })} 
                          placeholder="AIzaSy..." 
                      />
                  </div>
              </div>

              {/* Firebase */}
              <div className="space-y-4 md:col-span-2 p-6 bg-orange-50/30 rounded-2xl border border-orange-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Flame size={16} className="text-orange-600" /> Firebase Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">API Key</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" value={formData.firebaseConfig?.apiKey || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, apiKey: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Project ID</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.firebaseConfig?.projectId || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, projectId: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Storage Bucket</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.firebaseConfig?.storageBucket || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, storageBucket: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">App ID</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs font-mono" value={formData.firebaseConfig?.appId || ''} onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, appId: e.target.value } })} />
                      </div>
                  </div>
              </div>

              {/* Custom Server */}
              <div className="space-y-4 p-6 bg-purple-50/30 rounded-2xl border border-purple-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Server size={16} className="text-purple-600" /> Custom Server</h3>
                  <div className="space-y-3">
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Endpoint URL</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.customDomain?.url || ''} onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, url: e.target.value } })} placeholder="https://..." />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Server API Key</label>
                          <input type="password" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.customDomain?.apiKey || ''} onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, apiKey: e.target.value } })} />
                      </div>
                  </div>
              </div>

              {/* Email Config */}
              <div className="space-y-4 p-6 bg-blue-50/30 rounded-2xl border border-blue-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Mail size={16} className="text-blue-600" /> Email (SMTP)</h3>
                  <div className="space-y-3">
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">SMTP User</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.emailConfig?.user || ''} onChange={(e) => setFormData({ ...formData, emailConfig: { ...formData.emailConfig!, user: e.target.value } })} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">SMTP Password</label>
                          <input type="password" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.emailConfig?.pass || ''} onChange={(e) => setFormData({ ...formData, emailConfig: { ...formData.emailConfig!, pass: e.target.value } })} />
                      </div>
                  </div>
              </div>

              {/* Facebook OAuth Config */}
              <div className="space-y-4 p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Facebook size={16} className="text-indigo-600" /> Facebook Login</h3>
                  <div className="space-y-3">
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">App ID</label>
                          <input className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.facebookAppId || ''} onChange={(e) => setFormData({ ...formData, facebookAppId: e.target.value })} placeholder="1234567890" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">App Secret</label>
                          <input type="password" className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs" value={formData.facebookAppSecret || ''} onChange={(e) => setFormData({ ...formData, facebookAppSecret: e.target.value })} placeholder="••••••••" />
                      </div>
                      <div className="pt-2">
                          <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Callback URL:</p>
                          <code className="text-[9px] bg-white p-1 rounded border border-gray-200 block break-all">
                              {window.location.origin}/auth/facebook/callback
                          </code>
                      </div>
                  </div>
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
              <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Banking Details (Structured)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Bank Name</label>
                          <input className="w-full p-2 bg-white text-gray-900 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.bankName || ''} onChange={(e) => updateBusinessDetails('bankName', e.target.value)} placeholder="e.g. FNB" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Account Name</label>
                          <input className="w-full p-2 bg-white text-gray-900 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.accountName || ''} onChange={(e) => updateBusinessDetails('accountName', e.target.value)} placeholder="e.g. Meat Depot" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Account Number</label>
                          <input className="w-full p-2 bg-white text-gray-900 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.accountNumber || ''} onChange={(e) => updateBusinessDetails('accountNumber', e.target.value)} placeholder="e.g. 123456789" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Branch Code</label>
                          <input className="w-full p-2 bg-white text-gray-900 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.branchCode || ''} onChange={(e) => updateBusinessDetails('branchCode', e.target.value)} placeholder="e.g. 250655" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Account Type</label>
                          <input className="w-full p-2 bg-white text-gray-900 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" value={formData.businessDetails?.accountType || ''} onChange={(e) => updateBusinessDetails('accountType', e.target.value)} placeholder="e.g. Current" />
                      </div>
                  </div>
              </div>
              <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Legacy / Custom Banking Notes</label><textarea className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-[#f4d300] text-sm" rows={3} value={formData.businessDetails?.bankingDetails || ''} onChange={(e) => updateBusinessDetails('bankingDetails', e.target.value)} placeholder="Any additional payment instructions..." /></div>
          </div>
      </section>
    </div>
  );
};

export default Settings;
