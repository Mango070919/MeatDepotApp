
import React, { useState } from 'react';
import { useApp } from '../../store';
import { 
  Database, 
  Download, 
  Upload, 
  Server, 
  Save, 
  Loader2, 
  Key, 
  Mail, 
  Sparkles, 
  Globe, 
  Flame,
  ShieldCheck,
  RefreshCcw,
  HardDrive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BusinessDetails } from '../../types';

const SyncManager: React.FC = () => {
  const { 
    config, updateConfig, 
    products, users, orders, posts, promoCodes, rawMaterials, productionBatches, activityLogs,
    restoreData, syncToSheet, isCloudSyncing 
  } = useApp();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(config);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
        updateConfig(formData);
        await syncToSheet({ config: formData });
        alert("Configuration saved and synced successfully.");
    } catch (error) {
        alert("Failed to save configuration.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleBackup = () => {
    const data = { 
        config, products, users, orders, posts, promoCodes, rawMaterials, productionBatches, activityLogs,
        timestamp: new Date().toISOString() 
    };
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

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target?.result as string);
                if(window.confirm(`Restore backup from ${data.timestamp || 'unknown'}? This will overwrite current data.`)) {
                    restoreData(data);
                    alert('System restored successfully!');
                }
            } catch (err) {
                alert('Invalid backup file.');
            }
        };
        reader.readAsText(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <RefreshCcw size={32} className="text-blue-600"/> 
            Sync & API Manager
          </h1>
          <p className="text-xs text-gray-500 font-mono mt-1">Manage cloud synchronization and external service credentials</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#f4d300] text-black px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} 
          {isSaving ? 'Saving...' : 'Save All Credentials'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Cloud Strategy & Backup */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Database className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Cloud & Backup Strategy</h2>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Backup Destination</label>
                <select 
                    className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    value={formData.backupMethod || 'GOOGLE_DRIVE'}
                    onChange={(e) => setFormData({ ...formData, backupMethod: e.target.value as any })}
                >
                    <option value="GOOGLE_DRIVE">Google Drive (Recommended)</option>
                    <option value="FIREBASE">Firebase (Fast & Real-time)</option>
                    <option value="CUSTOM_DOMAIN">Custom Domain / Server</option>
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={handleBackup} className="py-4 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2">
                    <Download size={16} /> Export JSON
                </button>
                <label className="py-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
                    <Upload size={16} /> Import JSON
                    <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
                </label>
            </div>
          </div>
        </section>

        {/* Google Drive & Sheets */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <HardDrive className="text-green-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Google Drive & Sheets</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drive Access Token</label>
                  <input 
                      type="password"
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-green-500 text-sm font-mono" 
                      value={formData.googleDrive?.accessToken || ''} 
                      onChange={(e) => setFormData({ ...formData, googleDrive: { ...formData.googleDrive!, accessToken: e.target.value } })} 
                      placeholder="ya29..." 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Drive Folder ID</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-green-500 text-sm font-mono" 
                      value={formData.googleDrive?.folderId || ''} 
                      onChange={(e) => setFormData({ ...formData, googleDrive: { ...formData.googleDrive!, folderId: e.target.value } })} 
                      placeholder="1fWq..." 
                  />
              </div>
              <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Google Sheet URL / ID</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-green-500 text-sm" 
                      value={formData.googleSheetUrl || ''} 
                      onChange={(e) => setFormData({ ...formData, googleSheetUrl: e.target.value })} 
                      placeholder="https://docs.google.com/spreadsheets/d/..." 
                  />
              </div>
          </div>
        </section>

        {/* Firebase Configuration */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Flame className="text-orange-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Firebase Config</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">API Key</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono" 
                      value={formData.firebaseConfig?.apiKey || ''} 
                      onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, apiKey: e.target.value } })} 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Project ID</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" 
                      value={formData.firebaseConfig?.projectId || ''} 
                      onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, projectId: e.target.value } })} 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Storage Bucket</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm" 
                      value={formData.firebaseConfig?.storageBucket || ''} 
                      onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, storageBucket: e.target.value } })} 
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">App ID</label>
                  <input 
                      className="w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-orange-500 text-sm font-mono" 
                      value={formData.firebaseConfig?.appId || ''} 
                      onChange={(e) => setFormData({ ...formData, firebaseConfig: { ...formData.firebaseConfig!, appId: e.target.value } })} 
                  />
              </div>
          </div>
        </section>

        {/* Custom Server / Domain */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Server className="text-purple-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Custom Server Config</h2>
          </div>
          <div className="space-y-4">
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endpoint URL</label>
                  <input 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500"
                      placeholder="https://your-api.com/v1"
                      value={formData.customDomain?.url || ''}
                      onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, url: e.target.value } })}
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Server API Key</label>
                  <input 
                      type="password"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500"
                      placeholder="Secret Key"
                      value={formData.customDomain?.apiKey || ''}
                      onChange={(e) => setFormData({ ...formData, customDomain: { ...formData.customDomain!, apiKey: e.target.value } })}
                  />
              </div>
          </div>
        </section>

        {/* External Service Keys */}
        <section className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <Key className="text-yellow-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">External Service API Keys</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-sm"><Sparkles size={16} className="text-purple-600"/> Gemini AI</div>
                  <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gemini API Key</label>
                      <input 
                          type="password"
                          className="w-full p-3 bg-white text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-purple-500 text-sm font-mono" 
                          value={formData.geminiApiKey || ''} 
                          onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })} 
                          placeholder="AIzaSy..." 
                      />
                  </div>
              </div>

              <div className="space-y-4 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-900 font-bold text-sm"><Mail size={16} className="text-blue-600"/> Email (SMTP)</div>
                  <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SMTP User</label>
                          <input 
                              className="w-full p-3 bg-white text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                              value={formData.emailConfig?.user || ''} 
                              onChange={(e) => setFormData({ ...formData, emailConfig: { ...formData.emailConfig!, user: e.target.value } })} 
                              placeholder="user@example.com" 
                          />
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">SMTP Password</label>
                          <input 
                              type="password"
                              className="w-full p-3 bg-white text-gray-900 rounded-xl border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                              value={formData.emailConfig?.pass || ''} 
                              onChange={(e) => setFormData({ ...formData, emailConfig: { ...formData.emailConfig!, pass: e.target.value } })} 
                              placeholder="••••••••" 
                          />
                      </div>
                  </div>
              </div>
          </div>
        </section>
      </div>
      
      <div className="text-center">
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">© 2025 Meat Depot Systems | Secure Administrative Portal</p>
      </div>
    </div>
  );
};

export default SyncManager;
