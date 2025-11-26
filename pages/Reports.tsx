import React, { useState, useContext, useMemo } from 'react';
import { FileText, Download, Sparkles, BrainCircuit, Filter, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { db } from '../services/db';
import { generateGeminiInsights } from '../services/aiService';
import { AuthContext } from '../App';
import { UserRole } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { user } = useContext(AuthContext);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'date', direction: 'desc' });

  // Determine accessible branches for the dropdown
  const availableBranches = db.branches.filter(b => {
    if (user?.role === UserRole.OWNER) return true;
    if (user?.role === UserRole.MANAGER) return user.assignedBranchIds?.includes(b.id);
    return false;
  });

  const getFilteredTransactions = () => {
    let txs = db.transactions;

    // 1. Restrict to User Scope
    if (user?.role === UserRole.MANAGER) {
      txs = txs.filter(t => user.assignedBranchIds?.includes(t.branchId));
    }

    // 2. Filter by Dropdown Selection
    if (selectedBranchId !== 'ALL') {
      txs = txs.filter(t => t.branchId === selectedBranchId);
    }

    return txs;
  };

  const sortedTransactions = useMemo(() => {
    let sortableItems = [...getFilteredTransactions()];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Derived values for sorting
        if (sortConfig.key === 'branch') {
           aValue = db.branches.find(br => br.id === a.branchId)?.name || '';
           bValue = db.branches.find(br => br.id === b.branchId)?.name || '';
        }
        if (sortConfig.key === 'itemsCount') {
            aValue = a.items.length;
            bValue = b.items.length;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [selectedBranchId, sortConfig, user]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredInventory = () => {
    let prods = db.products;
    
    if (user?.role === UserRole.MANAGER) {
      prods = prods.filter(p => user.assignedBranchIds?.includes(p.branchId));
    }

    if (selectedBranchId !== 'ALL') {
      prods = prods.filter(p => p.branchId === selectedBranchId);
    }
    return prods;
  };

  // PDF Generation
  const downloadPDF = () => {
    const doc = new jsPDF();
    const branchName = selectedBranchId === 'ALL' 
      ? 'All Network Locations' 
      : availableBranches.find(b => b.id === selectedBranchId)?.name || 'Unknown Branch';
    
    doc.setFontSize(18);
    doc.text('Nexile Financial Report', 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Scope: ${branchName}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()} by ${user?.name}`, 14, 27);

    const txs = getFilteredTransactions();

    if (txs.length === 0) {
      doc.text("No transaction data found for the selected criteria.", 14, 40);
    } else {
      const tableData = txs.map(t => {
        const bName = db.branches.find(b => b.id === t.branchId)?.name || t.branchId;
        return [t.id, t.date.split('T')[0], bName, `$${t.total.toFixed(2)}`];
      });

      autoTable(doc, {
        head: [['Tx ID', 'Date', 'Branch', 'Total Amount']],
        body: tableData,
        startY: 35,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] } // Brand color
      });

      const totalRevenue = txs.reduce((acc, t) => acc + t.total, 0);
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(`Total Revenue: $${totalRevenue.toFixed(2)}`, 14, (doc as any).lastAutoTable.finalY + 10);
    }

    doc.save(`nexile_report_${selectedBranchId}_${Date.now()}.pdf`);
  };

  // Mock Excel Generation
  const downloadExcel = () => {
    const inventory = getFilteredInventory();
    const branchLabel = selectedBranchId === 'ALL' ? 'All Branches' : availableBranches.find(b => b.id === selectedBranchId)?.name;
    alert(`Simulating Excel Export...\n\nScope: ${branchLabel}\nRows: ${inventory.length} Items\n\n(In production, this downloads a .xlsx file)`);
  };

  const handleGenerateInsights = async () => {
    setAiLoading(true);
    // We could pass the filtered context to the AI service here for more specific insights
    const results = await generateGeminiInsights(); 
    setAiInsights(results);
    setAiLoading(false);
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <div className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-30"><ChevronUp size={16}/></div>;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={16} className="ml-1 text-brand-500"/> 
      : <ChevronDown size={16} className="ml-1 text-brand-500"/>;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Intelligence</h1>
          <p className="text-gray-500 mt-1">Download financial data or run Nexile AI predictive models.</p>
        </div>
        
        {/* Branch Filter */}
        <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border p-1 rounded-lg flex items-center shadow-sm">
           <div className="px-3 text-gray-400">
             <Filter size={16} />
           </div>
           <select
             value={selectedBranchId}
             onChange={(e) => setSelectedBranchId(e.target.value)}
             className="bg-transparent border-none outline-none text-sm font-medium text-gray-700 dark:text-gray-200 pr-8 py-2 cursor-pointer"
           >
             <option value="ALL">All Branches</option>
             {availableBranches.map(b => (
               <option key={b.id} value={b.id}>{b.name}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Standard Reports */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm flex flex-col">
          <div>
            <h2 className="font-bold text-lg mb-4 flex items-center">
              <FileText className="mr-2 text-brand-500" /> Standard Exports
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Generate official reports for the selected scope: <span className="font-bold text-gray-700 dark:text-gray-300">{selectedBranchId === 'ALL' ? 'All Branches' : availableBranches.find(b => b.id === selectedBranchId)?.name}</span>.
            </p>
          </div>
          
          <div className="space-y-3 mt-auto">
            <button onClick={downloadPDF} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg border border-gray-200 dark:border-dark-border transition-colors group">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-red-100 text-red-600 rounded flex items-center justify-center mr-3">
                  <span className="text-xs font-bold">PDF</span>
                </div>
                <div>
                   <span className="font-medium text-sm block text-left">Sales & Transaction Log</span>
                   <span className="text-[10px] text-gray-400 block text-left">Includes revenue totals and timestamps</span>
                </div>
              </div>
              <Download className="h-4 w-4 text-gray-400 group-hover:text-brand-500" />
            </button>

            <button onClick={downloadExcel} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-zinc-900/50 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-lg border border-gray-200 dark:border-dark-border transition-colors group">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 text-green-600 rounded flex items-center justify-center mr-3">
                  <span className="text-xs font-bold">XLS</span>
                </div>
                 <div>
                   <span className="font-medium text-sm block text-left">Inventory Audit Export</span>
                   <span className="text-[10px] text-gray-400 block text-left">Current stock levels, value, and expiry</span>
                </div>
              </div>
              <Download className="h-4 w-4 text-gray-400 group-hover:text-brand-500" />
            </button>
          </div>
        </div>

        {/* AI Section */}
        <div className="bg-gradient-to-br from-brand-900 to-gray-900 p-6 rounded-xl text-white shadow-lg relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-brand-500 blur-3xl opacity-20 rounded-full"></div>
          
          <div>
            <h2 className="font-bold text-lg mb-2 flex items-center">
              <BrainCircuit className="mr-2 text-brand-400" /> Nexile AI Prediction Engine
            </h2>
            <p className="text-sm text-brand-100/80 mb-6">
              Proprietary deep-learning analysis for demand forecasting, profit maximization, and market trend prediction.
            </p>
          </div>

          <div className="flex-1 flex flex-col">
            {!aiInsights.length ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[192px] border-2 border-dashed border-white/10 rounded-lg bg-black/20">
                {aiLoading ? (
                  <div className="text-center">
                     <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                     <p className="text-xs text-brand-200">Running predictive models...</p>
                  </div>
                ) : (
                  <button 
                    onClick={handleGenerateInsights}
                    className="px-6 py-2 bg-white text-brand-900 font-bold rounded-full hover:bg-brand-50 transition-transform hover:scale-105 shadow-lg flex items-center"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-brand-600"/>
                    Run Prediction Analysis
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-black/20 rounded-lg p-4 flex-1 min-h-[192px] overflow-y-auto space-y-3 scrollbar-thin border border-white/5">
                {aiInsights.map((txt, i) => (
                  <div key={i} className="flex items-start animate-fadeIn">
                     <span className="mt-1.5 w-1.5 h-1.5 bg-brand-400 rounded-full mr-2 flex-shrink-0"></span>
                     <p className="text-sm leading-relaxed text-brand-50">{txt}</p>
                  </div>
                ))}
              </div>
            )}
            {aiInsights.length > 0 && (
              <div className="mt-3 text-right">
                <button 
                  onClick={() => setAiInsights([])} 
                  className="text-xs text-brand-400 hover:text-brand-300 underline"
                >
                  Clear & Regenerate Models
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">Transaction Log</h2>
          <div className="text-xs text-gray-500 font-medium">
             Showing {sortedTransactions.length} records
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 font-medium border-b border-gray-200 dark:border-dark-border">
              <tr>
                <th 
                  className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => requestSort('id')}
                >
                  <div className="flex items-center">
                    ID <SortIcon columnKey="id" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => requestSort('date')}
                >
                   <div className="flex items-center">
                    Date <SortIcon columnKey="date" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 cursor-pointer group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => requestSort('branch')}
                >
                   <div className="flex items-center">
                    Branch <SortIcon columnKey="branch" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-center cursor-pointer group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => requestSort('itemsCount')}
                >
                   <div className="flex items-center justify-center">
                    Items <SortIcon columnKey="itemsCount" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-right cursor-pointer group hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  onClick={() => requestSort('total')}
                >
                   <div className="flex items-center justify-end">
                    Total Amount <SortIcon columnKey="total" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {sortedTransactions.length === 0 ? (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-gray-500 flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 mb-2 opacity-20"/>
                      No transactions found for the selected scope.
                   </td>
                </tr>
              ) : (
                sortedTransactions.map(tx => {
                  const branchName = db.branches.find(b => b.id === tx.branchId)?.name || 'Unknown';
                  return (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-6 py-4 font-mono text-xs text-gray-500">{tx.id}</td>
                       <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                         {new Date(tx.date).toLocaleString()}
                       </td>
                       <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                         {branchName}
                       </td>
                       <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400">
                            {tx.items.length}
                          </span>
                       </td>
                       <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                         ${tx.total.toFixed(2)}
                       </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}