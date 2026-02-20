
import React, { useState } from 'react';
import { useApp } from '../../store';
import { 
  Package, Plus, Trash2, ArrowLeft, Scale, ChefHat, 
  DollarSign, TrendingDown, Save, History, AlertTriangle, Check, Edit2, X
} from 'lucide-react';
import { RawMaterial, ProductionBatch, UnitType } from '../../types';
import { useNavigate } from 'react-router-dom';

const ProductionManager: React.FC = () => {
  const { rawMaterials, addRawMaterial, updateRawMaterial, deleteRawMaterial, products, updateProduct, addProductionBatch, productionBatches, logActivity, syncToSheet } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'MANUFACTURE' | 'HISTORY'>('INVENTORY');
  
  // -- Inventory State --
  const [newMaterial, setNewMaterial] = useState<Partial<RawMaterial>>({ name: '', unit: 'kg', currentStock: 0, averageCost: 0 });
  const [isAddingMaterial, setIsAddingMaterial] = useState(false);
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockAmount, setRestockAmount] = useState<string>('');
  const [restockCost, setRestockCost] = useState<string>('');

  // -- Manufacturing State --
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [batchInputs, setBatchInputs] = useState<{ id: string, amount: number }[]>([]);
  const [finalOutputWeight, setFinalOutputWeight] = useState<string>('');
  const [batchNotes, setBatchNotes] = useState('');

  // -- Calculations --
  const currentProduct = products.find(p => p.id === selectedProduct);
  const totalInputWeight = batchInputs.reduce((sum, input) => sum + (input.amount || 0), 0);
  const totalInputCost = batchInputs.reduce((sum, input) => {
      const mat = rawMaterials.find(m => m.id === input.id);
      return sum + ((input.amount || 0) * (mat?.averageCost || 0));
  }, 0);
  
  const outputNum = parseFloat(finalOutputWeight) || 0;
  const yieldPercent = totalInputWeight > 0 ? (outputNum / totalInputWeight) * 100 : 0;
  const costPerOutputUnit = outputNum > 0 ? totalInputCost / outputNum : 0;
  const suggestedSellingPrice = costPerOutputUnit / 0.7; // Aiming for 30% margin

  // -- Handlers: Inventory --
  const handleSaveMaterial = () => {
      if (!newMaterial.name) return;

      if (newMaterial.id) {
          // EDIT MODE
          const updatedMat = newMaterial as RawMaterial;
          updateRawMaterial(updatedMat);
          syncToSheet({ rawMaterials: rawMaterials.map(m => m.id === updatedMat.id ? updatedMat : m) });
          logActivity('PRODUCTION', `Updated raw material: ${newMaterial.name}`);
      } else {
          // CREATE MODE
          const mat: RawMaterial = {
              id: Math.random().toString(36).substr(2, 9),
              name: newMaterial.name,
              unit: newMaterial.unit || 'kg',
              currentStock: Number(newMaterial.currentStock),
              averageCost: Number(newMaterial.averageCost),
              lastPurchased: new Date().toISOString()
          };
          addRawMaterial(mat);
          syncToSheet({ rawMaterials: [mat, ...rawMaterials] });
          logActivity('PRODUCTION', `Created raw material: ${mat.name}`);
      }
      
      setIsAddingMaterial(false);
      setNewMaterial({ name: '', unit: 'kg', currentStock: 0, averageCost: 0 });
  };

  const startEditMaterial = (mat: RawMaterial) => {
      setNewMaterial({ ...mat });
      setIsAddingMaterial(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startAddMaterial = () => {
      setNewMaterial({ name: '', unit: 'kg', currentStock: 0, averageCost: 0 }); // Clear form
      setIsAddingMaterial(true);
  };

  const handleRestock = () => {
      if (!restockId || !restockAmount || !restockCost) return;
      const mat = rawMaterials.find(m => m.id === restockId);
      if (!mat) return;

      const newQty = parseFloat(restockAmount);
      const newCost = parseFloat(restockCost); // Total cost for this batch
      const unitCost = newCost / newQty;

      // Weighted Average Calculation
      const totalValue = (mat.currentStock * mat.averageCost) + newCost;
      const totalStock = mat.currentStock + newQty;
      const newAverage = totalStock > 0 ? totalValue / totalStock : unitCost;

      const updatedMat = {
          ...mat,
          currentStock: totalStock,
          averageCost: newAverage,
          lastPurchased: new Date().toISOString()
      };

      updateRawMaterial(updatedMat);
      syncToSheet({ rawMaterials: rawMaterials.map(m => m.id === mat.id ? updatedMat : m) });
      
      setRestockId(null);
      setRestockAmount('');
      setRestockCost('');
      logActivity('PRODUCTION', `Restocked ${mat.name}: +${newQty}${mat.unit} @ R${unitCost.toFixed(2)}/${mat.unit}`);
  };

  // -- Handlers: Production --
  const toggleIngredient = (id: string) => {
      if (batchInputs.find(i => i.id === id)) {
          setBatchInputs(batchInputs.filter(i => i.id !== id));
      } else {
          setBatchInputs([...batchInputs, { id, amount: 0 }]);
      }
  };

  const updateIngredientAmount = (id: string, val: number) => {
      setBatchInputs(batchInputs.map(i => i.id === id ? { ...i, amount: val } : i));
  };

  const handleCommitBatch = () => {
      if (!currentProduct || outputNum <= 0) {
          alert("Please select a product and enter valid output quantity.");
          return;
      }

      if (window.confirm(`Commit Batch?\n\nYield: ${yieldPercent.toFixed(1)}%\nCost: R${costPerOutputUnit.toFixed(2)}/${currentProduct.unit}\n\nThis will update stock levels.`)) {
          // 1. Deduct Raw Materials (Calculate new state)
          const updatedRawMaterials = rawMaterials.map(m => {
              const input = batchInputs.find(i => i.id === m.id);
              if (input) {
                  return { ...m, currentStock: Math.max(0, m.currentStock - input.amount) };
              }
              return m;
          });
          
          updatedRawMaterials.forEach(m => updateRawMaterial(m));

          // 2. Add to Product Stock (Calculate new state)
          const addedStock = currentProduct.unit === UnitType.KG ? outputNum * 1000 : outputNum;
          const updatedProduct = { 
              ...currentProduct, 
              stock: (currentProduct.stock || 0) + addedStock
          };
          updateProduct(updatedProduct);
          const updatedProducts = products.map(p => p.id === currentProduct.id ? updatedProduct : p);

          // 3. Log Batch
          const batch: ProductionBatch = {
              id: Math.random().toString(36).substr(2, 9),
              finalProductId: currentProduct.id,
              finalProductName: currentProduct.name,
              date: new Date().toISOString(),
              ingredients: batchInputs.map(i => {
                  const m = rawMaterials.find(rm => rm.id === i.id);
                  return {
                      rawMaterialId: i.id,
                      rawMaterialName: m?.name || 'Unknown',
                      quantityUsed: i.amount,
                      costAtTime: m?.averageCost || 0
                  };
              }),
              inputWeight: totalInputWeight,
              outputWeight: outputNum,
              yieldPercent,
              costPerUnit: costPerOutputUnit,
              notes: batchNotes
          };
          addProductionBatch(batch);
          const updatedBatches = [batch, ...productionBatches];

          logActivity('PRODUCTION', `Produced ${outputNum}${currentProduct.unit} of ${currentProduct.name}. Yield: ${yieldPercent.toFixed(1)}%`);

          // 4. SYNC EVERYTHING
          syncToSheet({ 
              rawMaterials: updatedRawMaterials,
              products: updatedProducts,
              productionBatches: updatedBatches
          });

          // Reset
          setBatchInputs([]);
          setFinalOutputWeight('');
          setSelectedProduct('');
          setActiveTab('HISTORY');
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 -mx-4 px-4 pb-20 space-y-8 pt-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2"><ChefHat className="text-red-600"/> Production Manager</h1>
            <p className="text-gray-500 text-sm">Manage ingredients, track batches, and calculate yields</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-gray-100 shadow-sm">
            {['INVENTORY', 'MANUFACTURE', 'HISTORY'].map(tab => (
                <button 
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-black text-white shadow-md' : 'text-gray-400 hover:text-black'}`}
                >
                    {tab}
                </button>
            ))}
        </div>
      </div>

      {/* Tab: Raw Inventory */}
      {activeTab === 'INVENTORY' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                      <div className="flex justify-between items-center mb-6">
                          <h2 className="text-xl font-bold text-gray-900">Raw Materials</h2>
                          {!isAddingMaterial && (
                              <button onClick={startAddMaterial} className="bg-[#f4d300] text-black px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform">
                                  <Plus size={16} /> Add Material
                              </button>
                          )}
                      </div>

                      {isAddingMaterial && (
                          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 mb-6 animate-in slide-in-from-top-4">
                              <div className="flex justify-between items-center mb-4">
                                  <h3 className="font-bold text-gray-700">{newMaterial.id ? 'Edit Material' : 'New Material'}</h3>
                                  <button onClick={() => setIsAddingMaterial(false)} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                  <input className="p-3 rounded-xl border border-gray-200 outline-none" placeholder="Item Name (e.g. Beef)" value={newMaterial.name} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} />
                                  <select className="p-3 rounded-xl border border-gray-200 outline-none" value={newMaterial.unit} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value})}>
                                      <option value="kg">kg</option>
                                      <option value="liter">liter</option>
                                      <option value="unit">unit</option>
                                      <option value="pack">pack</option>
                                  </select>
                                  <input type="number" className="p-3 rounded-xl border border-gray-200 outline-none" placeholder="Current Stock" value={newMaterial.currentStock || ''} onChange={e => setNewMaterial({...newMaterial, currentStock: parseFloat(e.target.value)})} />
                                  <input type="number" className="p-3 rounded-xl border border-gray-200 outline-none" placeholder="Cost per Unit" value={newMaterial.averageCost || ''} onChange={e => setNewMaterial({...newMaterial, averageCost: parseFloat(e.target.value)})} />
                              </div>
                              <button onClick={handleSaveMaterial} className="w-full bg-black text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors">
                                  {newMaterial.id ? 'Update Material' : 'Save Material'}
                              </button>
                          </div>
                      )}

                      <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
                          {rawMaterials.map(mat => (
                              <div key={mat.id} className="p-4 rounded-2xl border border-gray-100 flex items-center justify-between hover:border-gray-300 transition-colors bg-white group">
                                  <div>
                                      <h3 className="font-bold text-gray-900">{mat.name}</h3>
                                      <p className="text-xs text-gray-500">Avg Cost: R{mat.averageCost.toFixed(2)} / {mat.unit}</p>
                                  </div>
                                  <div className="flex items-center gap-6">
                                      <div className="text-right">
                                          <span className={`block font-bold text-lg ${mat.currentStock < 10 ? 'text-red-500' : 'text-green-600'}`}>{mat.currentStock} {mat.unit}</span>
                                          <span className="text-[10px] text-gray-400 uppercase tracking-widest">In Stock</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => setRestockId(mat.id)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100" title="Restock"><Plus size={18} /></button>
                                          <button onClick={() => startEditMaterial(mat)} className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 hover:text-black" title="Edit"><Edit2 size={18} /></button>
                                          <button onClick={() => { if(window.confirm(`Delete ${mat.name} permanently?`)) deleteRawMaterial(mat.id) }} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100" title="Delete"><Trash2 size={18} /></button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {rawMaterials.length === 0 && <p className="text-center text-gray-400 py-10">No raw materials added yet.</p>}
                      </div>
                  </div>
              </div>

              {/* Restock Panel */}
              <div className="space-y-6">
                  <div className={`bg-white p-8 rounded-[32px] shadow-lg border border-gray-100 sticky top-24 transition-all ${restockId ? 'opacity-100 translate-x-0' : 'opacity-50 translate-x-4 pointer-events-none'}`}>
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Package className="text-blue-500"/> Restock Item</h2>
                      {restockId ? (
                          <div className="space-y-4">
                              <p className="text-sm text-gray-600">Adding stock to: <span className="font-bold">{rawMaterials.find(m => m.id === restockId)?.name}</span></p>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quantity Bought</label>
                                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Amount" value={restockAmount} onChange={e => setRestockAmount(e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Invoice Cost (R)</label>
                                  <input type="number" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Total Cost" value={restockCost} onChange={e => setRestockCost(e.target.value)} />
                              </div>
                              <button onClick={handleRestock} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-blue-700">Confirm Purchase</button>
                              <button onClick={() => setRestockId(null)} className="w-full text-gray-400 text-xs py-2 hover:text-gray-600">Cancel</button>
                          </div>
                      ) : (
                          <p className="text-gray-400 text-sm">Select an item on the left to restock.</p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Tab: Manufacturer */}
      {activeTab === 'MANUFACTURE' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-2">
              <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                      <h2 className="text-xl font-bold text-gray-900">1. Select Target Product</h2>
                      <select 
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none text-lg font-bold text-gray-900"
                          value={selectedProduct}
                          onChange={e => setSelectedProduct(e.target.value)}
                      >
                          <option value="">-- Choose Product to Make --</option>
                          {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name} ({p.stock} in stock)</option>
                          ))}
                      </select>
                  </div>

                  <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
                      <h2 className="text-xl font-bold text-gray-900">2. Add Ingredients</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar border p-2 rounded-2xl border-gray-100">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Available Raw Materials</p>
                              {rawMaterials.map(mat => (
                                  <button 
                                    key={mat.id} 
                                    onClick={() => toggleIngredient(mat.id)}
                                    className={`w-full p-3 rounded-xl text-left text-sm font-bold flex justify-between items-center transition-all ${batchInputs.find(i => i.id === mat.id) ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                                  >
                                      <span>{mat.name}</span>
                                      <span className="text-[10px] opacity-70">{mat.currentStock} {mat.unit} avail</span>
                                  </button>
                              ))}
                          </div>
                          
                          <div className="space-y-3">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Selected Inputs</p>
                              {batchInputs.length === 0 && <p className="text-gray-400 text-xs italic">No ingredients selected.</p>}
                              {batchInputs.map(input => {
                                  const mat = rawMaterials.find(m => m.id === input.id);
                                  if (!mat) return null;
                                  return (
                                      <div key={input.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl">
                                          <span className="text-xs font-bold w-24 truncate">{mat.name}</span>
                                          <input 
                                            type="number" 
                                            className="flex-1 p-2 bg-white rounded-lg text-sm outline-none border border-gray-200" 
                                            placeholder={`Amount (${mat.unit})`}
                                            value={input.amount || ''}
                                            onChange={e => updateIngredientAmount(input.id, parseFloat(e.target.value))}
                                          />
                                          <span className="text-[10px] text-gray-500 font-bold">{mat.unit}</span>
                                          <button onClick={() => toggleIngredient(mat.id)} className="text-red-500 p-1"><Trash2 size={14}/></button>
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Analysis Panel */}
              <div className="space-y-6">
                  <div className="bg-gray-900 text-white p-8 rounded-[32px] shadow-xl border border-gray-800 sticky top-24">
                      <h2 className="text-lg font-bold text-[#f4d300] mb-6 flex items-center gap-2"><Scale size={20}/> Batch Analysis</h2>
                      
                      <div className="space-y-6">
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Input Weight</label>
                              <p className="text-2xl font-bold">{totalInputWeight.toFixed(2)} units</p>
                          </div>
                          <div>
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Input Cost</label>
                              <p className="text-2xl font-bold text-red-400">R{totalInputCost.toFixed(2)}</p>
                          </div>
                          
                          <div className="border-t border-gray-800 pt-4">
                              <label className="text-[10px] font-bold text-[#f4d300] uppercase tracking-widest mb-2 block">3. Final Output ({currentProduct?.unit || 'units'})</label>
                              <input 
                                type="number" 
                                className="w-full p-4 bg-gray-800 border border-gray-700 rounded-2xl outline-none text-xl font-bold text-white focus:border-[#f4d300]" 
                                placeholder="Enter Amount Produced"
                                value={finalOutputWeight}
                                onChange={e => setFinalOutputWeight(e.target.value)}
                              />
                          </div>

                          {outputNum > 0 && (
                              <div className="bg-gray-800 p-4 rounded-2xl space-y-2 animate-in fade-in">
                                  <div className="flex justify-between">
                                      <span className="text-xs text-gray-400">Yield</span>
                                      <span className={`text-xs font-bold ${yieldPercent < 100 ? 'text-orange-400' : 'text-green-400'}`}>{yieldPercent.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex justify-between">
                                      <span className="text-xs text-gray-400">True Cost</span>
                                      <span className="text-xs font-bold text-white">R{costPerOutputUnit.toFixed(2)} / {currentProduct?.unit}</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t border-gray-700">
                                      <span className="text-xs text-gray-400">Suggested Price</span>
                                      <span className="text-sm font-bold text-[#f4d300]">R{suggestedSellingPrice.toFixed(2)}</span>
                                  </div>
                              </div>
                          )}
                          
                          <textarea 
                              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-xs text-gray-300 outline-none"
                              placeholder="Batch notes (optional)"
                              value={batchNotes}
                              onChange={e => setBatchNotes(e.target.value)}
                          />

                          <button 
                            onClick={handleCommitBatch}
                            disabled={!selectedProduct || outputNum <= 0}
                            className="w-full bg-[#f4d300] text-black py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                          >
                              <Save size={16} /> Commit Batch
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Tab: History */}
      {activeTab === 'HISTORY' && (
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mx-2">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2"><History size={20} /> Production Log</h2>
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead>
                          <tr className="border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest">
                              <th className="py-4 px-2">Date</th>
                              <th className="py-4 px-2">Product</th>
                              <th className="py-4 px-2">Output</th>
                              <th className="py-4 px-2">Yield</th>
                              <th className="py-4 px-2">Unit Cost</th>
                              <th className="py-4 px-2">Ingredients</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                          {productionBatches.map(batch => (
                              <tr key={batch.id} className="hover:bg-gray-50">
                                  <td className="py-4 px-2">{new Date(batch.date).toLocaleDateString()}</td>
                                  <td className="py-4 px-2 font-bold text-gray-900">{batch.finalProductName}</td>
                                  <td className="py-4 px-2">{batch.outputWeight}</td>
                                  <td className="py-4 px-2">
                                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${batch.yieldPercent < 50 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                          {batch.yieldPercent.toFixed(1)}%
                                      </span>
                                  </td>
                                  <td className="py-4 px-2 font-bold text-gray-700">R{batch.costPerUnit.toFixed(2)}</td>
                                  <td className="py-4 px-2 text-xs text-gray-500 max-w-xs truncate">
                                      {batch.ingredients.map(i => `${i.rawMaterialName} (${i.quantityUsed})`).join(', ')}
                                  </td>
                              </tr>
                          ))}
                          {productionBatches.length === 0 && (
                              <tr>
                                  <td colSpan={6} className="text-center py-10 text-gray-400 italic">No batches recorded yet.</td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProductionManager;
