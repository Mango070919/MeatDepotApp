
import React, { useState } from 'react';
import { useApp } from '../../store';
import { generateAIAssistance } from '../../services/geminiService';
import { Terminal, Send, Copy, Zap, Loader2, Save, Folder, Download, Upload, ShieldCheck, Database, BrainCircuit, Server } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AIAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Destructure ALL necessary state and modifiers
  const { 
    products, updateProduct, 
    config, updateConfig, 
    addPromoCode, 
    users, updateUser,
    orders, updateOrder,
    posts, addPost, updatePost, deletePost,
    restoreData, rawMaterials, productionBatches, promoCodes, syncToSheet
  } = useApp();
  const navigate = useNavigate();

  // Local state for server config
  const [serverUrl, setServerUrl] = useState(config.customDomain?.url || '');
  const [apiKey, setApiKey] = useState(config.customDomain?.apiKey || '');
  const [isSavingServer, setIsSavingServer] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    
    // Construct the AI Context Bundle
    const context = {
        products, updateProduct,
        config, updateConfig,
        addPromoCode,
        users, updateUser,
        orders, updateOrder,
        posts, addPost, updatePost, deletePost
    };

    const text = await generateAIAssistance(prompt, context);
    setResult(text);
    setLoading(false);
  };

  const handleBackup = () => {
    const data = { 
        config, products, users, orders, posts, promoCodes, rawMaterials, productionBatches,
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

  const handleSaveServerConfig = async () => {
      setIsSavingServer(true);
      const newConfig = {
          ...config,
          customDomain: {
              url: serverUrl,
              apiKey: apiKey
          },
          backupMethod: (serverUrl ? 'CUSTOM_DOMAIN' : 'GOOGLE_DRIVE') as any
      };
      updateConfig(newConfig);
      await syncToSheet({ config: newConfig });
      setIsSavingServer(false);
      alert("Server configuration updated.");
  };

  const suggestionPills = [
    "Change primary brand color to #FF4500",
    "Create a promo code R5OFF for R5 discount",
    "Set price of 'Ballie Biltong' to R350",
    "Block user 'John Doe'",
    "Mark Order #12345 as DELIVERED",
    "Create a news post about weekend braai specials"
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 pt-8">
      {/* Header Title Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
                    <BrainCircuit size={32} className="text-[#f4d300]"/> 
                    AI App Manager
                </h1>
                <p className="text-xs text-gray-500 font-mono mt-1">Internal Code Assistant & Administrator</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Local Data Management */}
        <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <Database className="text-blue-500" size={20} />
                    <h2 className="font-bold text-gray-900">Data Control</h2>
                </div>
                
                <div className="space-y-4">
                    <p className="text-xs text-gray-500">Download a full JSON backup of the system state or restore from a previous file.</p>
                    
                    <button 
                        onClick={handleBackup}
                        className="w-full py-4 bg-gray-50 text-gray-800 border border-gray-200 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Download Backup
                    </button>

                    <label className="w-full py-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <Upload size={16} /> Restore from File
                        <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
                    </label>
                    
                    <div className="flex items-center gap-2 p-3 rounded-xl border bg-yellow-50 border-yellow-100 text-yellow-800 text-[10px] font-bold uppercase tracking-wider">
                        <ShieldCheck size={14} />
                        Root Access Active
                    </div>
                </div>
            </section>

            {/* Server Config Section */}
            <section className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
                    <Server className="text-purple-500" size={20} />
                    <h2 className="font-bold text-gray-900">Server Configuration</h2>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Custom Domain URL</label>
                        <input 
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#f4d300]"
                            placeholder="https://your-api.com/v1"
                            value={serverUrl}
                            onChange={(e) => setServerUrl(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">API Key</label>
                        <input 
                            type="password"
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:border-[#f4d300]"
                            placeholder="Secret Key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleSaveServerConfig}
                        disabled={isSavingServer}
                        className="w-full py-3 bg-black text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSavingServer ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} 
                        Update Server Settings
                    </button>
                </div>
            </section>
        </div>

        {/* Right Column: AI Console */}
        <div className="lg:col-span-8">
            <div className="bg-[#1e1e1e] rounded-[40px] shadow-2xl overflow-hidden border border-gray-700 flex flex-col min-h-[70vh]">
                {/* Terminal Header */}
                <div className="bg-[#2d2d2d] px-8 py-4 flex items-center justify-between border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400">admin@meatdepot-ai ~ %</span>
                    </div>
                </div>

                {/* Output Area */}
                <div className="flex-1 p-8 font-mono text-sm space-y-6 overflow-y-auto">
                    <div className="text-green-400">
                        &gt; System Initialized.<br/>
                        &gt; Connected to Store State.<br/>
                        &gt; Ready for instructions (Products, Users, Orders, Config).
                    </div>
                    {result && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex items-start gap-4">
                                <Zap className="text-yellow-400 shrink-0 mt-1" size={18} />
                                <div className="space-y-4 w-full">
                                    <div className="text-gray-200 whitespace-pre-wrap leading-relaxed">{result}</div>
                                    {result.includes('✅') && (
                                        <div className="pt-4 text-[10px] text-gray-500 border-t border-gray-700 flex items-center gap-2">
                                            <ShieldCheck size={12} />
                                            Runtime Patch Applied.
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(result); alert('Log copied.'); }} className="text-gray-500 hover:text-white transition-colors shrink-0">
                                    <Copy size={16}/>
                                </button>
                            </div>
                        </div>
                    )}
                    {loading && (
                        <div className="flex items-center gap-3 text-[#f4d300]">
                            <Loader2 className="animate-spin" size={16} />
                            <span className="animate-pulse">Processing Request...</span>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-6 bg-[#252525] border-t border-gray-700 space-y-6">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {suggestionPills.map((s, i) => (
                            <button 
                                key={i} 
                                onClick={() => setPrompt(s)}
                                className="text-[10px] font-mono bg-[#333] text-gray-300 px-4 py-2 rounded-full hover:bg-[#444] hover:text-[#f4d300] transition-all whitespace-nowrap border border-gray-600"
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-3 items-center bg-[#1e1e1e] border-2 border-gray-600 rounded-[25px] px-6 py-4 transition-colors focus-within:border-[#f4d300]">
                        <span className="text-green-500 font-mono text-xl font-bold">{'>'}</span>
                        <input 
                            className="flex-1 bg-transparent text-white font-mono outline-none placeholder-gray-600 text-base"
                            placeholder="Type a command or request..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={loading || !prompt}
                            className="bg-[#f4d300] text-black p-3 rounded-full hover:scale-105 active:scale-95 disabled:opacity-30 disabled:scale-100 transition-all"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      <div className="text-center">
          <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">© 2025 Meat Depot Systems | Secure Administrative Portal</p>
      </div>
    </div>
  );
};

export default AIAssistant;
