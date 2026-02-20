
import React, { useState } from 'react';
import { useApp } from '../../store';
import { ArrowLeft, Ticket, Plus, Trash2, Copy, RefreshCw, X, Save, Home, LayoutDashboard, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PromoCode } from '../../types';

const PromoManager: React.FC = () => {
  const { promoCodes, addPromoCode, deletePromoCode, syncToSheet } = useApp();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newCode, setNewCode] = useState<Partial<PromoCode>>({
      type: 'PERCENTAGE_OFF',
      value: 10,
      active: true,
      code: '',
      usedBy: []
  });

  const generateRandomCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < 8; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setNewCode({ ...newCode, code: result });
  };

  const handleSave = async () => {
      if (!newCode.code || newCode.value === undefined) {
          alert("Code and Value are required");
          return;
      }
      setIsSaving(true);
      const code: PromoCode = {
          id: Math.random().toString(36).substr(2, 9),
          code: newCode.code.toUpperCase(),
          type: newCode.type!,
          value: Number(newCode.value),
          active: newCode.active ?? true,
          usedBy: []
      };
      
      const updatedPromos = [code, ...promoCodes];
      addPromoCode(code);
      await syncToSheet({ promoCodes: updatedPromos });
      
      setIsSaving(false);
      setIsAdding(false);
      setNewCode({ type: 'PERCENTAGE_OFF', value: 10, active: true, code: '', usedBy: [] });
  };
  
  const handleDelete = async (id: string) => {
      if(window.confirm('Delete code?')) {
          const updatedPromos = promoCodes.filter(c => c.id !== id);
          deletePromoCode(id);
          await syncToSheet({ promoCodes: updatedPromos });
      }
  };

  const copyCode = (code: string) => {
      navigator.clipboard.writeText(code);
      alert("Code copied!");
  };

  return (
    <div className="space-y-8 pb-20 pt-8">
      <div className="flex justify-between items-center px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900">Unique Codes</h1>
            <p className="text-gray-500 text-sm">Manage discounts & loyalty tokens</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-[#f4d300] text-black px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-md hover:scale-105 transition-all">
            <Plus size={16} /> New Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
          {promoCodes.map((code) => (
              <div key={code.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative group">
                  <div className="flex justify-between items-start mb-4">
                      <div className="bg-gray-100 p-3 rounded-xl text-gray-600 font-mono text-lg font-bold tracking-widest flex items-center gap-2">
                          {code.code}
                          <button onClick={() => copyCode(code.code)} className="text-gray-400 hover:text-black"><Copy size={14} /></button>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${code.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {code.active ? 'Active' : 'Inactive'}
                      </span>
                  </div>
                  <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600 font-medium">Type: <span className="text-black font-bold">{code.type.replace('_', ' ')}</span></p>
                      <p className="text-sm text-gray-600 font-medium">Value: <span className="text-[#f4d300] font-bold text-lg">{code.type === 'PERCENTAGE_OFF' ? `${code.value}%` : `R${code.value}`}</span></p>
                  </div>
                  <button onClick={() => handleDelete(code.id)} className="w-full bg-gray-50 text-red-500 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                      <Trash2 size={16} /> Delete Code
                  </button>
              </div>
          ))}
      </div>

      {isAdding && (
          <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-300">
              <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl relative">
                  <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black"><X size={24} /></button>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Code</h2>
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Code String</label>
                          <div className="flex gap-2">
                              <input className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-[#f4d300]" placeholder="SUMMER25" value={newCode.code} onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })} />
                              <button onClick={generateRandomCode} className="bg-black text-white p-3 rounded-xl hover:bg-gray-800"><RefreshCw size={20} /></button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Type</label>
                          <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#f4d300]" value={newCode.type} onChange={e => setNewCode({ ...newCode, type: e.target.value as any, value: e.target.value === 'FREE_DELIVERY' ? 0 : newCode.value })}>
                              <option value="PERCENTAGE_OFF">Percentage Off (%)</option>
                              <option value="FLAT_DISCOUNT">Flat Amount Off (R)</option>
                              <option value="FREE_DELIVERY">Free Delivery</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Value</label>
                          <input type="number" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#f4d300]" placeholder="Value" value={newCode.value || ''} onChange={e => setNewCode({ ...newCode, value: Number(e.target.value) })} disabled={newCode.type === 'FREE_DELIVERY'} />
                      </div>
                  </div>
                  <button onClick={handleSave} disabled={isSaving} className="w-full bg-[#f4d300] text-black py-4 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:brightness-95 transition-all disabled:opacity-50">
                      {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
                      {isSaving ? 'Syncing...' : 'Save Code'}
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default PromoManager;
