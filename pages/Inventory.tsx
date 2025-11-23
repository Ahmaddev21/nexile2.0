import React, { useState, useContext } from 'react';
import { db } from '../services/db';
import { AuthContext } from '../App';
import { UserRole, Product } from '../types';
import { Search, Plus, AlertCircle, CheckCircle2, TrendingUp, AlertTriangle, MapPin } from 'lucide-react';

export default function Inventory() {
  const { user } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  // Calculate colspan dynamically
  const showBranchCol = user?.role !== UserRole.PHARMACIST;
  const showCostCol = user?.role !== UserRole.PHARMACIST;
  let colSpanCount = 7; // Base columns (Details, Stock, Price, Sold, Revenue, Expiry, Status)
  if (showBranchCol) colSpanCount++;
  if (showCostCol) colSpanCount++;

  return (
    <div className="space-y-6">
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
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-dark-border rounded-lg bg-white dark:bg-dark-card text-sm focus:ring-2 focus:ring-brand-500 outline-none w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.role !== UserRole.PHARMACIST && (
            <button className="flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-sm font-medium transition-colors">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </button>
          )}
        </div>
      </div>

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
                <th className="px-6 py-3 text-center">Sold Qty</th>
                <th className="px-6 py-3 text-right">Total Revenue</th>
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