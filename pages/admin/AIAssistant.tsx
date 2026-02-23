
import React, { useState } from 'react';
import { useApp } from '../../store';
import { generateAIAssistance } from '../../services/geminiService';
import { Terminal, Send, Copy, Zap, Loader2, ShieldCheck, BrainCircuit } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { 
    products, updateProduct, 
    config, updateConfig, 
    addPromoCode, 
    users, updateUser,
    orders, updateOrder,
    posts, addPost, updatePost, deletePost,
    promoCodes
  } = useApp();

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
                    AI Console
                </h1>
                <p className="text-xs text-gray-500 font-mono mt-1">Intelligent Assistant & System Administrator</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* AI Console Terminal */}
        <div className="w-full">
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
                        &gt; AI Console Initialized.<br/>
                        &gt; Connected to System State.<br/>
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
                                            System Update Applied.
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
                            <span className="animate-pulse">Analyzing Request...</span>
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
