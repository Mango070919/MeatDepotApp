
import React, { useState } from 'react';
import { useApp } from '../../store';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  ArrowUp, 
  ArrowDown, 
  Image as ImageIcon, 
  Type, 
  Layout, 
  Bell, 
  Eye, 
  Loader2, 
  Info,
  Newspaper,
  Camera,
  MessageSquare
} from 'lucide-react';
import { AppConfig } from '../../types';
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
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const HomeEditor: React.FC = () => {
  const { config, updateConfig, setPreviewData, togglePreviewMode, syncToSheet } = useApp();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<AppConfig>(config);
  const [activeTab, setActiveTab] = useState<'LAYOUT' | 'HERO' | 'NOTICES' | 'POPUP' | 'CONTENT'>('LAYOUT');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent accidental form submission
    setIsSaving(true);
    try {
        updateConfig(formData);
        await syncToSheet({ config: formData });
        setPreviewData({ config: undefined });
        alert('Home page updated successfully!');
    } catch (e) {
        console.error(e);
        alert("Saved locally. Cloud sync failed.");
    } finally {
        setIsSaving(false);
    }
  };

  const handlePreview = (e: React.MouseEvent) => {
      e.preventDefault();
      setPreviewData({ config: formData });
      togglePreviewMode(true);
      navigate('/');
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
      const newOrder = [...formData.homeSectionOrder];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newOrder.length) {
          [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
          setFormData({ ...formData, homeSectionOrder: newOrder });
      }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'hero' | 'notice') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsUploading(true);
        const resizedImageBase64 = await resizeImage(file, 1200, 800);
        
        let url = resizedImageBase64;
        if (config.backupMethod === 'CUSTOM_DOMAIN' || (config.googleDrive?.accessToken && config.googleDrive?.folderId)) {
            const uploadedUrl = await uploadFile(resizedImageBase64, `${field}_${Date.now()}.jpg`, config);
            if (uploadedUrl) url = uploadedUrl;
        }

        if (field === 'hero') {
            setFormData({ ...formData, homepageBanners: [url, ...formData.homepageBanners.slice(1)] });
        } else {
            setFormData({ ...formData, topNotice: { ...formData.topNotice!, imageUrl: url } });
        }
      } catch (error) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const sectionLabels: Record<string, string> = {
      'hero': 'Hero Banner (Top)',
      'categories': 'Categories List',
      'featured': 'Butcher\'s Picks',
      'news': 'News Feed Posts'
  };

  return (
    <div className="space-y-8 pb-20 pt-8">
      <div className="flex justify-between items-center px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Home Editor</h1>
            <p className="text-gray-500 text-sm">Customize app landing page</p>
        </div>
        <div className="flex gap-3">
            <button type="button" onClick={handlePreview} className="bg-white text-gray-800 border border-gray-300 px-4 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors text-xs uppercase tracking-widest cursor-pointer z-10">
                <Eye size={16} /> Preview
            </button>
            <button type="button" onClick={handleSave} disabled={isSaving} className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer z-10">
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
              <button type="button" onClick={() => setActiveTab('LAYOUT')} className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'LAYOUT' ? 'text-[#f4d300] bg-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Layout size={16}/> Layout
              </button>
              <button type="button" onClick={() => setActiveTab('HERO')} className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'HERO' ? 'text-[#f4d300] bg-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <ImageIcon size={16}/> Hero & Brand
              </button>
              <button type="button" onClick={() => setActiveTab('NOTICES')} className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'NOTICES' ? 'text-[#f4d300] bg-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Bell size={16}/> Notices
              </button>
              <button type="button" onClick={() => setActiveTab('POPUP')} className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'POPUP' ? 'text-[#f4d300] bg-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <MessageSquare size={16}/> Popup
              </button>
              <button type="button" onClick={() => setActiveTab('CONTENT')} className={`flex-1 py-4 px-6 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${activeTab === 'CONTENT' ? 'text-[#f4d300] bg-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                  <Type size={16}/> Info
              </button>
          </div>

          <div className="p-8 min-h-[400px]">
              {/* LAYOUT TAB */}
              {activeTab === 'LAYOUT' && (
                  <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in">
                      <div className="p-4 bg-blue-50 rounded-2xl text-blue-800 text-sm flex gap-3 border border-blue-100">
                          <Info size={20} className="shrink-0"/>
                          <p>Reorder how sections appear on the home screen. Use arrows to move sections up or down.</p>
                      </div>
                      <div className="space-y-3">
                          {formData.homeSectionOrder.map((section, index) => (
                              <div key={section} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200">
                                  <span className="font-bold text-gray-700 uppercase text-xs tracking-widest">{sectionLabels[section] || section}</span>
                                  <div className="flex gap-2">
                                      <button 
                                        type="button"
                                        onClick={() => moveSection(index, 'up')} 
                                        disabled={index === 0}
                                        className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                      >
                                          <ArrowUp size={16}/>
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => moveSection(index, 'down')} 
                                        disabled={index === formData.homeSectionOrder.length - 1}
                                        className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-100 disabled:opacity-30 cursor-pointer"
                                      >
                                          <ArrowDown size={16}/>
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <div className="pt-6 border-t border-gray-100">
                          <button type="button" onClick={() => navigate('/admin/posts')} className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-bold text-xs uppercase tracking-widest hover:border-[#f4d300] hover:text-[#f4d300] hover:bg-gray-900 transition-all flex items-center justify-center gap-2 cursor-pointer">
                              <Newspaper size={16} /> Manage News Feed Posts
                          </button>
                      </div>
                  </div>
              )}

              {/* HERO TAB */}
              {activeTab === 'HERO' && (
                  <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Main Headline</label>
                          <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] font-bold text-2xl text-gray-900 resize-none"
                            rows={2}
                            value={formData.heroTitle || 'Savour\nThe Cut.'}
                            onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Subtitle Text</label>
                          <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-700 resize-none"
                            rows={3}
                            value={formData.heroSubtitle || ''}
                            onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Call to Action Button</label>
                          <input 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-900 font-bold"
                            value={formData.heroButtonText || 'SHOP COLLECTION'}
                            onChange={(e) => setFormData({ ...formData, heroButtonText: e.target.value })}
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Background Image (or YouTube URL)</label>
                          <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group">
                              {formData.homepageBanners?.[0] ? (
                                  <img src={formData.homepageBanners[0]} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Set</div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase flex items-center gap-2 hover:bg-[#f4d300]">
                                      {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16}/>} Upload New
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'hero')} disabled={isUploading} />
                                  </label>
                              </div>
                          </div>
                          <input 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs text-gray-600 mt-2"
                            placeholder="Or paste image/YouTube URL here..."
                            value={formData.homepageBanners?.[0] || ''}
                            onChange={(e) => setFormData({ ...formData, homepageBanners: [e.target.value] })}
                          />
                      </div>
                  </div>
              )}

              {/* NOTICES TAB */}
              {activeTab === 'NOTICES' && (
                  <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Scrolling Banner Text</label>
                          <input 
                            className="w-full p-4 bg-[#f4d300] border-none rounded-2xl outline-none text-black font-bold placeholder-black/50"
                            placeholder="e.g. FREE DELIVERY OVER R1000"
                            value={formData.announcement || ''}
                            onChange={(e) => setFormData({ ...formData, announcement: e.target.value })}
                          />
                      </div>

                      <div className="space-y-4 pt-4 border-t border-gray-100">
                          <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Top Notice Image (Popup)</label>
                              <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-gray-500">Visible?</span>
                                  <button 
                                      type="button"
                                      onClick={() => setFormData({ ...formData, topNotice: { ...formData.topNotice!, visible: !formData.topNotice?.visible } })}
                                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${formData.topNotice?.visible ? 'bg-green-500' : 'bg-gray-300'}`}
                                  >
                                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.topNotice?.visible ? 'translate-x-6' : 'translate-x-1'}`} />
                                  </button>
                              </div>
                          </div>
                          
                          <div className="relative w-full h-48 bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 group">
                              {formData.topNotice?.imageUrl ? (
                                  <img src={formData.topNotice.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Set</div>
                              )}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <label className="cursor-pointer bg-white text-black px-6 py-3 rounded-full font-bold text-xs uppercase flex items-center gap-2 hover:bg-[#f4d300]">
                                      {isUploading ? <Loader2 className="animate-spin" size={16}/> : <Camera size={16}/>} Change Image
                                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'notice')} disabled={isUploading} />
                                  </label>
                              </div>
                          </div>
                          <input 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-xs text-gray-600 mt-2"
                            placeholder="Or paste image URL..."
                            value={formData.topNotice?.imageUrl || ''}
                            onChange={(e) => setFormData({ ...formData, topNotice: { ...formData.topNotice!, imageUrl: e.target.value } })}
                          />
                      </div>
                  </div>
              )}

              {/* POPUP TAB */}
              {activeTab === 'POPUP' && (
                  <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in">
                      <div className="flex items-center justify-between bg-gray-50 p-6 rounded-2xl border border-gray-200">
                          <div>
                              <h3 className="font-bold text-gray-900">Startup Popup</h3>
                              <p className="text-xs text-gray-500">Show a message when users open the app</p>
                          </div>
                          <button 
                              type="button"
                              onClick={() => setFormData({ 
                                  ...formData, 
                                  startupPopup: { 
                                      title: formData.startupPopup?.title || '', 
                                      message: formData.startupPopup?.message || '', 
                                      isActive: !(formData.startupPopup?.isActive) 
                                  } 
                              })}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${formData.startupPopup?.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                          >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.startupPopup?.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                          </button>
                      </div>

                      <div className={`space-y-6 transition-opacity ${formData.startupPopup?.isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Popup Title</label>
                              <input 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] font-bold text-lg text-gray-900"
                                value={formData.startupPopup?.title || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    startupPopup: { 
                                        isActive: formData.startupPopup?.isActive || false,
                                        message: formData.startupPopup?.message || '',
                                        title: e.target.value 
                                    } 
                                })}
                                placeholder="e.g. Heads Up!"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message Body</label>
                              <textarea 
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-700 resize-none"
                                rows={4}
                                value={formData.startupPopup?.message || ''}
                                onChange={(e) => setFormData({ 
                                    ...formData, 
                                    startupPopup: { 
                                        isActive: formData.startupPopup?.isActive || false,
                                        title: formData.startupPopup?.title || '',
                                        message: e.target.value 
                                    } 
                                })}
                                placeholder="Enter your announcement message..."
                              />
                          </div>
                      </div>
                  </div>
              )}

              {/* CONTENT TAB */}
              {activeTab === 'CONTENT' && (
                  <div className="space-y-8 max-w-2xl mx-auto animate-in fade-in">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">App Description (Below Header)</label>
                          <textarea 
                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#f4d300] text-gray-700 resize-none leading-relaxed"
                            rows={4}
                            value={formData.appDescription || ''}
                            onChange={(e) => setFormData({ ...formData, appDescription: e.target.value })}
                            placeholder="This app is used to place orders..."
                          />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Brand Color (Hex Code)</label>
                          <div className="flex gap-2 items-center">
                              <div className="w-10 h-10 rounded-xl border border-gray-200 shadow-sm" style={{ backgroundColor: formData.brandColor }}></div>
                              <input 
                                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none font-mono text-sm"
                                value={formData.brandColor || '#f4d300'}
                                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                              />
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default HomeEditor;
