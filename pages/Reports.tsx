import React, { useState, useContext } from 'react';
import { FileText, Download, Sparkles, BrainCircuit, Filter } from 'lucide-react';
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
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
    </div>
  );
}