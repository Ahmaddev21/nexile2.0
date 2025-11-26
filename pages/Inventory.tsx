import React, { useState, useContext } from 'react';
import { db } from '../services/db';
import { AuthContext } from '../App';
import { UserRole, Product } from '../types';
import { Search, Plus, AlertCircle, CheckCircle2, TrendingUp, AlertTriangle, MapPin, X, Save } from 'lucide-react';

export default function Inventory() {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Product Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProd, setNewProd] = useState<Partial<Product>>({
    name: '', sku: '', category: 'General', price: 0, cost: 0, stock: 0, minStockLevel: 10, expiryDate: ''
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProd.name || !newProd.sku || !newProd.price) return;

    // Determine Branch ID based on Role
    let targetBranchId = 'b1'; // Default fallback
    if (user?.role === UserRole.PHARMACIST && user.branchId) {
      targetBranchId = user.branchId;
    } else if (user?.role === UserRole.MANAGER && user.assignedBranchIds?.[0]) {
      targetBranchId = user.assignedBranchIds[0];
    }

    db.addProduct({
      id: `p-${Date.now()}`,
      name: newProd.name,
      sku: newProd.sku,
      category: newProd.category || 'General',
      price: Number(newProd.price),
      cost: Number(newProd.cost || 0),
      stock: Number(newProd.stock || 0),
      minStockLevel: Number(newProd.minStockLevel || 10),
      expiryDate: newProd.expiryDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
      branchId: targetBranchId
    } as Product);

    setShowAddModal(false);
    setNewProd({ name: '', sku: '', category: 'General', price: 0, cost: 0, stock: 0, minStockLevel: 10, expiryDate: '' });
  };
  
  // Advanced Filtering based on Role
  const products = db.products.filter(p => {
    if (user?.role === UserRole.PHARMACIST) return p.branchId === user.branchId;
    if (user?.role === UserRole.MANAGER) return user.assignedBranchIds?.includes(p.branchId);
    return true; // Owner sees all
  });

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = filteredProducts.filter(p => p.stock <= p.minStockLevel);

  // Calculate colspan dynamically
  const showBranchCol = user?.role !== UserRole.PHARMACIST;
  const showCostCol = user?.role !== UserRole.PHARMACIST;
  let colSpanCount = 7; // Base columns (Details, Stock, Price, Sold, Revenue, Expiry, Status)
  if (showBranchCol) colSpanCount++;
  if (showCostCol) colSpanCount++;

  return (
    <div className="space-y-6 relative">
      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 dark:border-dark-border p-6 animate-scaleIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Plus className="mr-2 text-brand-500" /> Add New Product
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                <X size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                  <input 
                    required
                    type="text" 
                    value={newProd.name}
                    onChange={e => setNewProd({...newProd, name: e.target.value})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                    placeholder="e.g. Amoxicillin 500mg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">SKU</label>
                  <input 
                    required
                    type="text" 
                    value={newProd.sku}
                    onChange={e => setNewProd({...newProd, sku: e.target.value})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                    placeholder="e.g. AMX-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                  <input 
                    type="text" 
                    value={newProd.category}
                    onChange={e => setNewProd({...newProd, category: e.target.value})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                    placeholder="Category"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price ($)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={newProd.price}
                    onChange={e => setNewProd({...newProd, price: parseFloat(e.target.value)})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cost ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={newProd.cost}
                    onChange={e => setNewProd({...newProd, cost: parseFloat(e.target.value)})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Initial Stock</label>
                  <input 
                    type="number" 
                    value={newProd.stock}
                    onChange={e => setNewProd({...newProd, stock: parseInt(e.target.value)})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Expiry Date</label>
                  <input 
                    type="date" 
                    value={newProd.expiryDate}
                    onChange={e => setNewProd({...newProd, expiryDate: e.target.value})}
                    className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none text-sm font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              
              <button type="submit" className="w-full py-3 mt-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all flex items-center justify-center">
                <Save className="mr-2" size={18} /> Save Product
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory & Stock Analysis</h1>
          <p className="text-gray-500 text-sm">Monitor stock levels, expiry dates, and sales performance.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input 
              type="text" 
              placeholder="Search medicines..." 
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start shadow-sm animate-fadeIn">
          <div className="p-2.5 bg-red-100 dark:bg-red-900/30 rounded-full mr-4 text-red-600 dark:text-red-400 flex-shrink-0">
             <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
             <h3 className="text-red-800 dark:text-red-400 font-bold text-lg mb-1 flex items-center">
               Critical Stock Alerts 
               <span className="ml-2 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">{lowStockItems.length} Items</span>
             </h3>
             <p className="text-red-700 dark:text-red-400 text-sm mb-3">
               The following items have fallen below minimum stock levels and require immediate reordering to prevent revenue loss.
             </p>
             <div className="flex flex-wrap gap-2">
               {lowStockItems.slice(0, 6).map(item => (
                 <div key={item.id} className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-black border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 shadow-sm">
                   <AlertTriangle size={10} className="mr-1.5" />
                   {item.name}
                   <span className="ml-1.5 text-red-500 dark:text-red-500/80 border-l border-red-200 dark:border-red-800 pl-1.5">
                     {item.stock} left
                   </span>
                 </div>
               ))}
               {lowStockItems.length > 6 && (
                 <span className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                   +{lowStockItems.length - 6} more items
                 </span>
               )}
             </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th className="px-6 py-3">Product Details</th>
                {showBranchCol && <th className="px-6 py-3">Branch</th>}
                <th className="px-6 py-3 text-center">Stock Health</th>
                <th className="px-6 py-3">Price</th>
                {showCostCol && <th className="px-6 py-3">Cost</th>}
                <th className="px-6 py-3 text-center">Total Sold Quantity</th>
                <th className="px-6 py-3 text-right">Total Revenue Generated</th>
                <th className="px-6 py-3">Expiry</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {filteredProducts.map((product) => {
                const salesData = db.getProductSales(product.id);
                const stockPercentage = Math.min((product.stock / (product.minStockLevel * 3)) * 100, 100);
                const isLow = product.stock <= product.minStockLevel;
                const isCritical = product.stock === 0;
                const branch = db.branches.find(b => b.id === product.branchId);

                return (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isLow ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{product.name}</div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <span className="bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-mono mr-2">{product.sku}</span>
                        {product.category}
                      </div>
                    </td>
                    {showBranchCol && (
                      <td className="px-6 py-4">
                         <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-400">
                           <MapPin size={12} className="mr-1"/>
                           {branch ? branch.name : 'Unknown'}
                         </div>
                      </td>
                    )}
                    <td className="px-6 py-4 w-48">
                      <div className="flex justify-between text-xs mb-1">
                        <span className={`${isLow ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                          {product.stock} units
                        </span>
                        <span className="text-gray-400">Min: {product.minStockLevel}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${isCritical ? 'bg-gray-400' : isLow ? 'bg-red-500' : 'bg-brand-500'}`} 
                          style={{ width: `${stockPercentage}%` }}
                        />
                      </div>
                      {isLow && !isCritical && (
                         <div className="text-[10px] text-red-500 mt-1 flex items-center font-bold">
                            <AlertTriangle size={10} className="mr-1"/> Low Stock
                         </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        ${product.price.toFixed(2)}
                      </span>
                    </td>
                    {showCostCol && (
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          ${product.cost.toFixed(2)}
                        </span>
                      </td>
                    )}
                    <td className="px-6 py-4 text-center">
                       <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-bold">
                          <TrendingUp size={14} className="mr-1.5" />
                          {salesData.totalSold}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="text-green-600 dark:text-green-400 font-bold">
                         ${salesData.totalRevenue.toFixed(2)}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{product.expiryDate}</td>
                    <td className="px-6 py-4 text-right">
                      {isCritical ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-400 border border-gray-200 dark:border-zinc-700">
                          Out of Stock
                        </span>
                      ) : isLow ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse">
                          Reorder Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="w-3 h-3 mr-1"/> Healthy
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={colSpanCount} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 mb-2 opacity-20"/>
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}