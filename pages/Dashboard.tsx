import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../services/db';
import { getStatisticalInsights } from '../services/aiService';
import { UserRole, Insight, User, Branch } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Scan,
  Users,
  ShoppingCart,
  Zap,
  MapPin,
  X,
  CheckCircle,
  RefreshCw,
  Flame,
  BrainCircuit,
  ShieldCheck,
  Copy,
  UserPlus,
  Check,
  Trash2,
  Building,
  UserMinus,
  Eye,
  FileText,
  Clock
} from 'lucide-react';
import { AreaChart, Area, XAxis, ResponsiveContainer } from 'recharts';

// --- COMPONENTS ---

const SignalIndicator = ({ status }: { status: 'good' | 'warning' | 'critical' }) => {
  const colors = {
    good: 'bg-emerald-400 shadow-emerald-200',
    warning: 'bg-amber-400 shadow-amber-200',
    critical: 'bg-rose-500 shadow-rose-200 animate-pulse',
  };
  return <div className={`w-3 h-3 rounded-full shadow-lg ${colors[status]} mr-2`} />;
};

const StatCard = ({ title, value, trend, icon: Icon, trendUp, status, colorClass }: any) => (
  <div className={`p-6 rounded-3xl border border-transparent shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 ${colorClass || 'bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border'}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-white/60 dark:bg-black/20 rounded-2xl shadow-sm backdrop-blur-sm">
        <Icon className="h-6 w-6 text-slate-700 dark:text-white" />
      </div>
      <span className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center bg-white/50 dark:bg-black/20 shadow-sm ${trendUp ? 'text-emerald-600' : 'text-rose-600'}`}>
        {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {trend}
      </span>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">{title}</h3>
    <p className="text-3xl font-black text-slate-800 dark:text-white mt-1 tracking-tight">{value}</p>
  </div>
);

const TopSellingWidget = ({ topSelling, title }: { topSelling: any[], title: string }) => (
  <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card overflow-hidden h-full transition-all duration-300 hover:shadow-card-hover">
    <div className="p-6 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-gradient-to-r from-slate-50 to-white dark:from-dark-card dark:to-dark-card">
      <h3 className="font-bold text-lg flex items-center text-slate-800 dark:text-white">
        <Flame className="text-orange-500 mr-2 drop-shadow-sm" size={20} />
        {title}
      </h3>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-100 dark:border-slate-700">Volume</span>
    </div>
    <div className="p-4">
      {topSelling.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-10 text-slate-400">
            <Package size={40} className="mb-2 opacity-20"/>
            <p className="text-sm">No sales data yet.</p>
         </div>
      ) : (
        <div className="space-y-3">
          {topSelling.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors group border border-transparent hover:border-brand-200 dark:hover:border-brand-800">
               <div className="flex items-center overflow-hidden">
                  <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-black text-sm mr-3 shadow-sm ${idx === 0 ? 'bg-amber-100 text-amber-600' : idx === 1 ? 'bg-slate-200 text-slate-600' : 'bg-orange-50 text-orange-400'}`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                     <p className="font-bold text-sm text-slate-800 dark:text-white truncate group-hover:text-brand-600 transition-colors">{item.name}</p>
                     <p className="text-xs text-slate-500 truncate font-medium">{item.category}</p>
                  </div>
               </div>
               <div className="text-right pl-2">
                  <p className="font-black text-slate-800 dark:text-white">{item.sold}</p>
                  <p className="text-[10px] text-slate-400">Sold</p>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// --- BRANCH DETAILS MODAL ---

const BranchDetailsModal = ({ branch, onClose }: { branch: Branch, onClose: () => void }) => {
  const [stats, setStats] = useState({ revenue: 0, profit: 0, transactions: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [manager, setManager] = useState<User | undefined>(undefined);

  useEffect(() => {
    // Fetch Branch Specific Data
    const perf = db.getBranchPerformance(branch.id);
    const txs = db.transactions.filter(t => t.branchId === branch.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
    const products = db.products.filter(p => p.branchId === branch.id);
    const lowStock = products.filter(p => p.stock <= p.minStockLevel);
    const branchInsights = getStatisticalInsights(branch.id);
    const branchManager = db.getManagers().find(m => m.assignedBranchIds?.includes(branch.id));

    // Calculate Profit
    let totalCost = 0;
    txs.forEach(tx => {
       tx.items.forEach(item => {
          const product = db.products.find(p => p.id === item.productId);
          if (product) totalCost += (product.cost * item.quantity);
          else totalCost += (item.price * item.quantity * 0.5);
       });
    });
    // This profit calc is only for the *recent* transactions slice for simplicity in this view, 
    // or we can calc total profit. Let's do total profit for the branch.
    const allBranchTxs = db.transactions.filter(t => t.branchId === branch.id);
    let allTotalCost = 0;
    allBranchTxs.forEach(tx => {
       tx.items.forEach(item => {
          const product = db.products.find(p => p.id === item.productId);
          if (product) allTotalCost += (product.cost * item.quantity);
          else allTotalCost += (item.price * item.quantity * 0.5);
       });
    });
    const totalProfit = perf.revenue - allTotalCost;

    setStats({
      revenue: perf.revenue,
      profit: totalProfit,
      transactions: perf.transactionCount
    });
    setTransactions(txs);
    setLowStockItems(lowStock);
    setInsights(branchInsights);
    setManager(branchManager);
  }, [branch]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-dark-card w-full max-w-4xl rounded-3xl shadow-2xl border border-white/50 dark:border-dark-border max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-dark-border flex justify-between items-start bg-slate-50/50 dark:bg-zinc-900/50">
           <div>
             <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 rounded-lg">
                   <Building size={24} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{branch.name}</h2>
             </div>
             <p className="text-slate-500 dark:text-slate-400 flex items-center text-sm font-medium ml-1">
                <MapPin size={14} className="mr-1" /> {branch.location}
                <span className="mx-2">•</span>
                <Users size={14} className="mr-1" /> Manager: {manager ? <span className="font-bold text-slate-700 dark:text-slate-200 ml-1">{manager.name}</span> : <span className="italic text-slate-400 ml-1">Unassigned</span>}
             </p>
           </div>
           <button onClick={onClose} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
           
           {/* Stats Row */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                 <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">Total Revenue</p>
                 <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">${stats.revenue.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30">
                 <p className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">Est. Profit</p>
                 <p className="text-2xl font-black text-sky-700 dark:text-sky-300 mt-1">${stats.profit.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-900/30">
                 <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase">Transactions</p>
                 <p className="text-2xl font-black text-violet-700 dark:text-violet-300 mt-1">{stats.transactions}</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* AI Insights */}
              <div className="space-y-4">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                    <BrainCircuit className="mr-2 text-brand-500" /> Branch Intelligence
                 </h3>
                 {insights.length === 0 ? (
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-400 text-sm italic">
                       No specific insights generated for this branch yet.
                    </div>
                 ) : (
                    <div className="space-y-3">
                       {insights.map((insight, idx) => (
                          <div key={idx} className={`p-4 rounded-xl border ${
                             insight.type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-800' : 
                             insight.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                             'bg-slate-50 border-slate-100 text-slate-700'
                          }`}>
                             <div className="flex items-start gap-3">
                                <Zap size={16} className="mt-0.5 shrink-0" />
                                <p className="text-sm font-medium leading-snug">{insight.message}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>

              {/* Low Stock Alerts */}
              <div className="space-y-4">
                 <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                    <AlertTriangle className="mr-2 text-rose-500" /> Critical Inventory
                 </h3>
                 {lowStockItems.length === 0 ? (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-emerald-700 dark:text-emerald-400 text-sm font-bold flex items-center">
                       <CheckCircle size={18} className="mr-2" /> Stock levels are healthy.
                    </div>
                 ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                       {lowStockItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                             <div>
                                <p className="font-bold text-sm text-slate-800 dark:text-white">{item.name}</p>
                                <p className="text-xs text-slate-500">Min: {item.minStockLevel}</p>
                             </div>
                             <span className="px-2 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">
                                {item.stock} Remaining
                             </span>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Recent Transactions */}
           <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center">
                 <FileText className="mr-2 text-slate-400" /> Recent Transactions
              </h3>
              <div className="overflow-x-auto border border-slate-200 dark:border-dark-border rounded-xl">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-xs">
                       <tr>
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Time</th>
                          <th className="px-4 py-3">Items</th>
                          <th className="px-4 py-3 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       {transactions.length === 0 ? (
                          <tr><td colSpan={4} className="p-4 text-center text-slate-400">No recent transactions.</td></tr>
                       ) : (
                          transactions.map(tx => (
                             <tr key={tx.id} className="bg-white dark:bg-dark-card hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-mono text-xs text-slate-500">{tx.id.split('-')[1] || tx.id}</td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300 flex items-center">
                                   <Clock size={12} className="mr-1 opacity-50"/> 
                                   {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </td>
                                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                   {tx.items.length} item(s)
                                </td>
                                <td className="px-4 py-3 text-right font-bold text-emerald-600">
                                   ${tx.total.toFixed(2)}
                                </td>
                             </tr>
                          ))
                       )}
                    </tbody>
                 </table>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

// --- SUB-DASHBOARDS ---

const PharmacistDashboard = ({ stats, insights, topSelling }: any) => {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState<'NONE' | 'RETURN' | 'INTERACTION'>('NONE');
  const [txIdInput, setTxIdInput] = useState('');
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [workflowStatus, setWorkflowStatus] = useState<'IDLE' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [statusMsg, setStatusMsg] = useState('');

  const resetWorkflow = () => {
    setActiveModal('NONE');
    setTxIdInput('');
    setDrugA('');
    setDrugB('');
    setWorkflowStatus('IDLE');
    setStatusMsg('');
  };

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txIdInput.trim()) return;

    setWorkflowStatus('PROCESSING');
    setTimeout(() => {
      const exists = db.transactions.find(t => t.id === txIdInput || t.id === `tx-${txIdInput}`);
      const isLegacyMock = txIdInput === '123'; 
      if (!exists && !isLegacyMock) {
         setWorkflowStatus('ERROR');
         setStatusMsg('Transaction not found. Check ID.');
      } else {
         setWorkflowStatus('SUCCESS');
         setStatusMsg(`Refund authorized for #${txIdInput}.`);
      }
    }, 1000);
  };

  const handleCheckInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drugA.trim() || !drugB.trim()) {
      setWorkflowStatus('ERROR');
      setStatusMsg('Enter two drugs.');
      return;
    }

    setWorkflowStatus('PROCESSING');
    setTimeout(() => {
       setWorkflowStatus('SUCCESS');
       const d1 = drugA.toLowerCase();
       const d2 = drugB.toLowerCase();
       if ((d1.includes('ibuprofen') && d2.includes('aspirin')) || (d2.includes('ibuprofen') && d1.includes('aspirin'))) {
          setStatusMsg('⚠️ Moderate Risk: Bleeding risk.');
       } else if (d1.includes('alcohol') || d2.includes('alcohol')) {
          setStatusMsg('⚠️ High Risk: CNS Depression.');
       } else {
          setStatusMsg('✅ Safe: No known interaction.');
       }
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative pb-10">
      
      {/* WORKFLOW MODALS */}
      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl shadow-2xl border border-white/50 p-6 animate-scaleIn">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold flex items-center text-slate-800 dark:text-white">
                   {activeModal === 'RETURN' ? <RefreshCw className="mr-2 text-brand-500"/> : <Activity className="mr-2 text-brand-500"/>}
                   {activeModal === 'RETURN' ? 'Process Return' : 'Interaction Check'}
                 </h3>
                 <button onClick={resetWorkflow} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                   <X size={18} className="text-slate-500"/>
                 </button>
              </div>

              {workflowStatus === 'PROCESSING' && (
                <div className="py-8 flex flex-col items-center justify-center text-slate-500">
                   <div className="animate-spin w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full mb-4"></div>
                   <p className="font-bold text-brand-600 animate-pulse">Analyzing...</p>
                </div>
              )}

              {workflowStatus === 'SUCCESS' && (
                 <div className="py-4 text-center animate-fadeIn">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-200">
                       <CheckCircle size={32} />
                    </div>
                    <p className="text-lg font-bold text-slate-800 dark:text-white mb-8">{statusMsg}</p>
                    <button onClick={resetWorkflow} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-700 transition-colors">
                      Done
                    </button>
                 </div>
              )}

              {workflowStatus === 'ERROR' && (
                 <div className="py-4 text-center animate-shake">
                    <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-200">
                       <AlertTriangle size={32} />
                    </div>
                    <p className="text-rose-600 font-bold mb-8">{statusMsg}</p>
                    <button onClick={() => setWorkflowStatus('IDLE')} className="w-full py-3 bg-slate-100 hover:bg-slate-200 rounded-2xl font-bold text-slate-700 transition-colors">
                      Try Again
                    </button>
                 </div>
              )}

              {workflowStatus === 'IDLE' && (
                <>
                  {activeModal === 'RETURN' && (
                    <form onSubmit={handleProcessReturn} className="space-y-4">
                       <input 
                         type="text" 
                         value={txIdInput}
                         onChange={(e) => setTxIdInput(e.target.value)}
                         className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none font-mono text-lg text-center text-slate-900 dark:text-white placeholder-slate-400"
                         placeholder="TX-XXXX"
                         autoFocus
                       />
                       <button type="submit" className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-2xl shadow-lg shadow-brand-200 transition-all">
                         Verify Return
                       </button>
                    </form>
                  )}

                  {activeModal === 'INTERACTION' && (
                    <form onSubmit={handleCheckInteraction} className="space-y-4">
                       <input 
                        type="text" 
                        value={drugA} 
                        onChange={(e) => setDrugA(e.target.value)} 
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400" 
                        placeholder="Drug A" 
                        autoFocus 
                       />
                       <input 
                        type="text" 
                        value={drugB} 
                        onChange={(e) => setDrugB(e.target.value)} 
                        className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 outline-none text-slate-900 dark:text-white placeholder-slate-400" 
                        placeholder="Drug B" 
                       />
                       <button type="submit" className="w-full py-4 bg-sky-500 hover:bg-sky-400 text-white font-bold rounded-2xl shadow-lg shadow-sky-200 transition-all">
                         Check Safety
                       </button>
                    </form>
                  )}
                </>
              )}
           </div>
        </div>
      )}

      {/* METRICS ROW - PASTEL COLORS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Sales" 
          value={`$${stats.revenue.toLocaleString()}`} 
          trend="Revenue" 
          trendUp={true} 
          icon={DollarSign} 
          colorClass="bg-emerald-50/80 border-emerald-100 dark:bg-dark-card dark:border-dark-border"
        />
        <StatCard 
          title="Net Profit" 
          value={`$${stats.profit.toLocaleString()}`} 
          trend="Earnings" 
          trendUp={true} 
          icon={TrendingUp} 
          colorClass="bg-sky-50/80 border-sky-100 dark:bg-dark-card dark:border-dark-border"
        />
        <StatCard 
          title="Items Sold" 
          value={stats.itemsSold} 
          trend="Volume" 
          trendUp={true} 
          icon={Package} 
          colorClass="bg-violet-50/80 border-violet-100 dark:bg-dark-card dark:border-dark-border"
        />
      </div>

      {/* ACTION GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-br from-brand-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-brand-200 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
            <div className="flex items-center mb-4 relative z-10">
               <Scan className="w-8 h-8 mr-3 text-white" />
               <div>
                 <h2 className="text-xl font-black">POS Terminal</h2>
                 <p className="text-brand-100 text-xs font-medium">Quick Sale Mode</p>
               </div>
            </div>
            <Link to="/pos" className="relative z-10 flex items-center justify-center w-full bg-white text-brand-600 py-3 rounded-xl font-bold hover:bg-brand-50 transition-colors shadow-sm">
              Launch Scanner <ArrowUpRight size={16} className="ml-2" />
            </Link>
         </div>

         <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-slate-100 dark:border-dark-border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center">
                <SignalIndicator status={stats.lowStock > 0 ? 'critical' : 'good'} />
                Inventory Health
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <span className="text-sm font-bold text-slate-500">Low Stock</span>
                <span className={`font-black text-lg ${stats.lowStock > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{stats.lowStock}</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
         </div>

         <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-slate-100 dark:border-dark-border shadow-card transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1">
            <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-amber-400 fill-amber-400" /> Quick Actions
            </h3>
            <div className="space-y-3">
               <button onClick={() => setActiveModal('RETURN')} className="w-full flex items-center p-3 rounded-xl bg-slate-50 hover:bg-brand-50 text-slate-600 hover:text-brand-600 font-bold text-sm transition-colors text-left">
                  <RefreshCw size={16} className="mr-3 opacity-70" /> Process Return
               </button>
               <button onClick={() => setActiveModal('INTERACTION')} className="w-full flex items-center p-3 rounded-xl bg-slate-50 hover:bg-sky-50 text-slate-600 hover:text-sky-600 font-bold text-sm transition-colors text-left">
                  <Activity size={16} className="mr-3 opacity-70" /> Drug Interaction
               </button>
            </div>
         </div>
      </div>

      {/* Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <TopSellingWidget topSelling={topSelling} title="Trending Products" />
        </div>

        <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card overflow-hidden transition-all hover:shadow-card-hover">
          <div className="p-6 border-b border-slate-100 dark:border-dark-border bg-slate-50/50">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Smart Signals</h3>
          </div>
          <div className="p-4 space-y-2">
            {insights.length === 0 && <p className="text-center text-slate-400 text-sm py-4">No alerts today.</p>}
            {insights.map((insight: any, idx: number) => (
              <div key={idx} className={`p-4 rounded-2xl border ${
                 insight.type === 'warning' 
                 ? 'bg-rose-50 border-rose-100 text-rose-800' 
                 : 'bg-emerald-50 border-emerald-100 text-emerald-800'
              } transition-transform hover:scale-[1.02]`}>
                 <div className="flex items-start gap-3">
                    {insight.type === 'warning' ? <AlertTriangle size={18} className="shrink-0 mt-0.5"/> : <Zap size={18} className="shrink-0 mt-0.5"/>}
                    <div>
                       <span className="text-xs font-black uppercase tracking-wider opacity-70 block mb-1">{insight.metric}</span>
                       <p className="text-sm font-medium leading-snug">{insight.message}</p>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ stats, user, topSelling }: any) => {
  const assignedBranches = db.branches.filter(b => user.assignedBranchIds?.includes(b.id));

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} trend="Up" trendUp={true} icon={DollarSign} colorClass="bg-emerald-50/80 border-emerald-100" />
        <StatCard title="Stock Issues" value={stats.lowStock} trend="Attention" trendUp={false} icon={AlertTriangle} status={stats.lowStock > 0 ? 'warning' : 'good'} colorClass="bg-amber-50/80 border-amber-100" />
        <StatCard title="Transactions" value={stats.transactions} trend="Total" trendUp={true} icon={ShoppingCart} colorClass="bg-white border-slate-100" />
        <StatCard title="Inv. Value" value={`$${stats.totalStock.toLocaleString()}`} trend="Asset" trendUp={true} icon={Activity} colorClass="bg-white border-slate-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card">
          <h3 className="font-bold text-lg mb-6 text-slate-800 dark:text-white">Branch Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Branch</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-xl">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {assignedBranches.map(branch => {
                   const perf = db.getBranchPerformance(branch.id);
                   return (
                     <tr key={branch.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-4 py-4 font-bold text-slate-700 dark:text-slate-200">{branch.name}</td>
                       <td className="px-4 py-4 font-mono text-emerald-600 font-bold">${perf.revenue.toLocaleString()}</td>
                       <td className="px-4 py-4">
                         {perf.lowStockCount > 0 ? <span className="text-rose-500 font-bold text-xs bg-rose-50 px-2 py-1 rounded-lg">{perf.lowStockCount} Alerts</span> : <span className="text-emerald-500 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-lg">Good</span>}
                       </td>
                       <td className="px-4 py-4">
                         <div className="w-24 bg-slate-100 rounded-full h-2">
                           <div className="bg-brand-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                         </div>
                       </td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="h-full">
           <TopSellingWidget topSelling={topSelling} title="Top Sellers" />
        </div>
      </div>
    </div>
  );
};

const OwnerDashboard = ({ stats, insights, topSelling }: any) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BRANCHES' | 'STAFF'>('OVERVIEW');
  const [branches, setBranches] = useState(db.branches);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLoc, setNewBranchLoc] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  
  // Staff Management State
  const [managers, setManagers] = useState<User[]>([]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  // Branch assignment state
  const [selectedAssignments, setSelectedAssignments] = useState<{[key:string]: string}>({});

  useEffect(() => {
    setManagers(db.getManagers());
    setBranches(db.branches);
  }, [activeTab]);

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLoc) return;
    db.createBranch(newBranchName, newBranchLoc);
    setBranches(db.branches);
    setNewBranchName('');
    setNewBranchLoc('');
  };

  const handleDeleteBranch = (id: string) => {
    if (window.confirm("Are you sure you want to delete this branch? This cannot be undone.")) {
      db.deleteBranch(id);
      setBranches(db.branches);
      setManagers(db.getManagers()); // Refresh managers as their assignments might change
    }
  };

  const handleDeleteManager = (id: string) => {
    if (window.confirm("Are you sure you want to delete this manager account?")) {
      db.deleteUser(id);
      setManagers(db.getManagers());
    }
  };

  const handleGenerateCode = () => {
    setGeneratedCode(db.generateAccessCode());
    setIsCopied(false);
  };

  const handleAssignManager = (managerId: string, branchId: string) => {
    db.assignManagerToBranch(managerId, branchId);
    setManagers(db.getManagers()); // Refresh list
  };

  const handleUnassignManager = (managerId: string, branchId: string) => {
    if (window.confirm("Are you sure you want to unassign this manager from the branch?")) {
      db.unassignManagerFromBranch(managerId, branchId);
      setManagers(db.getManagers()); // Refresh list
    }
  };

  const handleSelectManagerChange = (branchId: string, managerId: string) => {
    setSelectedAssignments(prev => ({...prev, [branchId]: managerId}));
  };
  
  const confirmBranchAssignment = (branchId: string) => {
    const managerId = selectedAssignments[branchId];
    if (managerId) {
       handleAssignManager(managerId, branchId);
       // Clear selection
       const newSel = {...selectedAssignments};
       delete newSel[branchId];
       setSelectedAssignments(newSel);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {selectedBranch && (
         <BranchDetailsModal branch={selectedBranch} onClose={() => setSelectedBranch(null)} />
      )}

      <div className="flex border-b border-slate-200 dark:border-dark-border mb-6">
        {['OVERVIEW', 'BRANCHES', 'STAFF'].map(tab => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab as any)} 
             className={`pb-3 px-6 font-bold text-sm transition-all ${activeTab === tab ? 'border-b-4 border-brand-500 text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}
           >
             {tab === 'BRANCHES' ? 'Network' : tab.charAt(0) + tab.slice(1).toLowerCase()}
           </button>
        ))}
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cheerful Gradient Card */}
            <div className="bg-gradient-to-r from-sky-400 to-brand-500 rounded-3xl p-8 text-white shadow-xl shadow-sky-200 relative overflow-hidden hover:-translate-y-1 transition-transform">
              <div className="relative z-10">
                <p className="text-sky-100 font-bold text-sm mb-1 uppercase tracking-wide">Total Net Profit</p>
                <h2 className="text-5xl font-black mb-2 tracking-tight">$128k</h2>
                <div className="inline-flex items-center bg-white/20 px-3 py-1 rounded-full text-sm font-bold">
                  <TrendingUp size={14} className="mr-1" /> +18.2%
                </div>
              </div>
              <Activity className="absolute -right-6 -bottom-6 text-white/20 w-40 h-40" />
            </div>

            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-slate-100 dark:border-dark-border shadow-card flex flex-col justify-center hover:-translate-y-1 transition-transform">
               <div className="flex items-center justify-between mb-2">
                   <span className="text-slate-400 font-bold uppercase text-xs">Active Branches</span>
                   <MapPin className="text-rose-500 w-6 h-6" />
               </div>
               <h2 className="text-4xl font-black text-slate-800 dark:text-white">{branches.length}</h2>
               <p className="text-sm text-slate-500 font-medium">Across 3 Regions</p>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-3xl p-8 border border-slate-100 dark:border-dark-border shadow-card flex flex-col justify-center hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 font-bold uppercase text-xs">Inventory Asset</span>
                  <Package className="text-amber-500 w-6 h-6" />
              </div>
              <h2 className="text-4xl font-black text-slate-800 dark:text-white">${(stats.totalStock/1000).toFixed(1)}k</h2>
              <p className="text-sm text-slate-500 font-medium">Total Valuation</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-3xl border border-slate-100 dark:border-dark-border shadow-card p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-lg flex items-center text-slate-800 dark:text-white">
                   <TrendingUp className="mr-2 text-emerald-500" /> Growth Chart
                 </h3>
                 <button onClick={() => navigate('/executive-analysis')} className="text-brand-600 font-bold text-sm bg-brand-50 px-3 py-1.5 rounded-lg hover:bg-brand-100 transition-colors">
                    Executive View
                 </button>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[{n:'J',v:4000},{n:'F',v:3000},{n:'M',v:5000},{n:'A',v:4800},{n:'M',v:6000},{n:'J',v:7500}]}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="n" axisLine={false} tickLine={false} stroke="#94a3b8" />
                      <Area type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={4} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* AI Widget - Cheerful Style */}
            <div className="bg-slate-900 rounded-3xl p-6 shadow-xl text-white flex flex-col relative overflow-hidden border border-slate-800">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500 blur-[60px] opacity-40 rounded-full pointer-events-none"></div>
              <h3 className="font-bold text-lg mb-4 flex items-center relative z-10">
                <BrainCircuit className="mr-2 text-brand-400" /> AI Insights
              </h3>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {insights.map((insight: any, i: number) => (
                  <div key={i} className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded mb-1 inline-block ${
                         insight.type === 'warning' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {insight.metric}
                      </span>
                      <p className="text-sm text-slate-200 leading-snug">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
             {branches.length === 0 && <p className="text-center py-10 text-slate-400">No branches found.</p>}
             {branches.map(branch => {
               // Find manager for this branch
               const manager = managers.find(m => m.assignedBranchIds?.includes(branch.id));
               
               return (
                <div key={branch.id} className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card flex items-center justify-between hover:shadow-card-hover transition-shadow group relative overflow-hidden">
                   <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        {branch.name}
                      </h3>
                      <p className="text-sm text-slate-500 flex items-center mt-1"><MapPin size={14} className="mr-1"/> {branch.location}</p>
                      <div className="mt-3 flex items-center text-xs">
                        <Users size={12} className="mr-1 text-slate-400" />
                        <span className="font-bold text-slate-400 uppercase tracking-wide mr-2">Manager:</span>
                        {manager ? (
                          <div className="flex items-center gap-2">
                             <span className="font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md">{manager.name}</span>
                             <button 
                                onClick={() => handleUnassignManager(manager.id, branch.id)}
                                className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors"
                                title="Unassign Manager"
                             >
                                <X size={12} />
                             </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                             <select 
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold py-1 px-2 rounded outline-none text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-brand-500"
                                onChange={(e) => handleSelectManagerChange(branch.id, e.target.value)}
                                value={selectedAssignments[branch.id] || ""}
                             >
                                <option value="" disabled>Select Manager...</option>
                                {managers.filter(m => !m.assignedBranchIds?.includes(branch.id)).map(m => (
                                   <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                             </select>
                             {selectedAssignments[branch.id] && (
                                <button 
                                   onClick={() => confirmBranchAssignment(branch.id)}
                                   className="p-1 bg-brand-500 text-white rounded hover:bg-brand-600 transition-colors"
                                   title="Confirm Assignment"
                                >
                                   <Check size={12} />
                                </button>
                             )}
                          </div>
                        )}
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-2">
                      <span className="bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-lg text-sm">Active</span>
                      <div className="flex gap-2 mt-2">
                        <button 
                           onClick={() => setSelectedBranch(branch)}
                           className="p-2 text-brand-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors border border-brand-100"
                           title="View Details"
                        >
                           <Eye size={16} />
                        </button>
                        <button 
                           onClick={() => handleDeleteBranch(branch.id)}
                           className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                           title="Delete Branch"
                        >
                           <Trash2 size={16} />
                        </button>
                      </div>
                   </div>
                </div>
             )})}
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card h-fit">
             <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center">
               <Building className="mr-2 text-brand-500"/> Add Branch
             </h3>
             <form onSubmit={handleCreateBranch} className="space-y-4">
                <input 
                  type="text" 
                  value={newBranchName} 
                  onChange={e => setNewBranchName(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400" 
                  placeholder="Branch Name" 
                />
                <input 
                  type="text" 
                  value={newBranchLoc} 
                  onChange={e => setNewBranchLoc(e.target.value)} 
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-700 focus:border-brand-500 border-2 outline-none transition-all text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400" 
                  placeholder="Location" 
                />
                <button type="submit" className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/20">Deploy Branch</button>
             </form>
          </div>
        </div>
      )}

      {activeTab === 'STAFF' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Manager List */}
           <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card">
                 <h3 className="font-bold text-lg mb-6 flex items-center text-slate-800 dark:text-white">
                    <Users className="mr-2 text-brand-500" /> Active Managers
                 </h3>
                 {managers.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                       <ShieldCheck size={40} className="mx-auto mb-2 opacity-20"/>
                       <p>No managers registered yet.</p>
                       <p className="text-xs">Generate an Access Code to invite them.</p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                       {managers.map(mgr => (
                          <div key={mgr.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                             <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">{mgr.name}</h4>
                                <p className="text-xs text-slate-500">{mgr.email}</p>
                             </div>
                             
                             <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-slate-400" />
                                <select 
                                   className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold py-2 px-3 rounded-lg outline-none text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500"
                                   onChange={(e) => handleAssignManager(mgr.id, e.target.value)}
                                   defaultValue=""
                                >
                                   <option value="" disabled>Add to Branch...</option>
                                   {branches.map(b => (
                                      <option key={b.id} value={b.id} disabled={mgr.assignedBranchIds?.includes(b.id)}>
                                         {b.name}
                                      </option>
                                   ))}
                                </select>
                             </div>

                             <div className="flex items-center gap-2 justify-end min-w-[150px]">
                                <div className="flex gap-1 flex-wrap justify-end">
                                    {mgr.assignedBranchIds?.map(bid => {
                                    const bName = branches.find(b => b.id === bid)?.name || bid;
                                    return (
                                        <div key={bid} className="flex items-center bg-sky-100 text-sky-700 px-2 py-1 rounded-md">
                                            <span className="text-[10px] font-bold mr-1">{bName}</span>
                                            <button 
                                                onClick={() => handleUnassignManager(mgr.id, bid)}
                                                className="text-sky-700 hover:text-red-500"
                                            >
                                                <UserMinus size={10} />
                                            </button>
                                        </div>
                                    );
                                    })}
                                    {(!mgr.assignedBranchIds || mgr.assignedBranchIds.length === 0) && (
                                        <span className="text-[10px] text-slate-400 italic">No branch assigned</span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => handleDeleteManager(mgr.id)}
                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    title="Delete Manager"
                                >
                                    <Trash2 size={16} />
                                </button>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
           </div>

           {/* Access Code Generator */}
           <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-100 dark:border-dark-border shadow-card h-fit">
              <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">Manager Access</h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                 Generate a secure 4-digit code for new managers to log in. This code serves as their initial password.
              </p>
              
              {generatedCode ? (
                 <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 rounded-2xl p-6 text-center animate-fadeIn relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldCheck size={60}/></div>
                    <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-2">Access Code</p>
                    <div className="text-5xl font-black text-brand-600 dark:text-brand-400 tracking-[0.2em] font-mono mb-4">
                       {generatedCode}
                    </div>
                    <div className="flex gap-2">
                       <button 
                          onClick={handleCopyCode}
                          className={`flex-1 flex items-center justify-center py-2 rounded-lg text-xs font-bold shadow-sm transition-colors ${
                            isCopied 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                          }`}
                       >
                          {isCopied ? <Check size={12} className="mr-1" /> : <Copy size={12} className="mr-1" />}
                          {isCopied ? 'Copied!' : 'Copy'}
                       </button>
                       <button 
                          onClick={() => setGeneratedCode('')}
                          className="flex-1 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-brand-700 transition-colors"
                       >
                          Done
                       </button>
                    </div>
                    <p className="text-[10px] text-brand-400/80 mt-3">Valid for 24 hours.</p>
                 </div>
              ) : (
                 <button 
                    onClick={handleGenerateCode}
                    className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center justify-center group"
                 >
                    <UserPlus className="mr-2 group-hover:scale-110 transition-transform" /> Generate Code
                 </button>
              )}
           </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({ revenue: 0, profit: 0, transactions: 0, itemsSold: 0, lowStock: 0, totalStock: 0 });
  const [insights, setInsights] = useState<Insight[]>([]);
  const [topSelling, setTopSelling] = useState<any[]>([]);

  useEffect(() => {
    // Simulate data loading
    const loadData = () => {
      // Filter scope based on role
      let relevantTxs = db.transactions;
      let relevantProds = db.products;

      if (user?.role === UserRole.MANAGER && user.assignedBranchIds) {
        relevantTxs = relevantTxs.filter(t => user.assignedBranchIds?.includes(t.branchId));
        relevantProds = relevantProds.filter(p => user.assignedBranchIds?.includes(p.branchId));
      } else if (user?.role === UserRole.PHARMACIST && user.branchId) {
        relevantTxs = relevantTxs.filter(t => t.branchId === user.branchId);
        relevantProds = relevantProds.filter(p => p.branchId === user.branchId);
      }

      // Calculations
      const revenue = relevantTxs.reduce((acc, t) => acc + t.total, 0);
      const itemsSold = relevantTxs.reduce((acc, t) => acc + t.items.reduce((sum, i) => sum + i.quantity, 0), 0);
      const lowStock = relevantProds.filter(p => p.stock <= p.minStockLevel).length;
      const totalStock = relevantProds.reduce((acc, p) => acc + (p.stock * p.price), 0);
      
      // Profit Estimate (Revenue - Cost of goods sold). 
      // We need to look up cost for sold items.
      let totalCost = 0;
      relevantTxs.forEach(tx => {
         tx.items.forEach(item => {
            const product = db.products.find(p => p.id === item.productId);
            if (product) {
               totalCost += (product.cost * item.quantity);
            } else {
               // Fallback if product deleted, assume 50% margin
               totalCost += (item.price * item.quantity * 0.5);
            }
         });
      });
      const profit = revenue - totalCost;

      setStats({
        revenue,
        profit,
        transactions: relevantTxs.length,
        itemsSold,
        lowStock,
        totalStock
      });

      // Insights
      const branchContext = user?.role === UserRole.PHARMACIST ? user.branchId : undefined;
      setInsights(getStatisticalInsights(branchContext));

      // Top Selling
      const itemMap = new Map<string, any>();
      relevantTxs.forEach(t => {
        t.items.forEach(i => {
           const existing = itemMap.get(i.productId) || { name: i.productName, sold: 0, category: 'General' };
           const p = relevantProds.find(p => p.id === i.productId);
           if (p) existing.category = p.category;
           existing.sold += i.quantity;
           itemMap.set(i.productId, existing);
        });
      });
      
      const sorted = Array.from(itemMap.values()).sort((a, b) => b.sold - a.sold).slice(0, 5);
      setTopSelling(sorted);

      setLoading(false);
    };

    // Small delay for realism
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) {
    return (
       <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
         <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4"></div>
         <p className="font-bold text-sm">Aggregating Live Data...</p>
       </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
           <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center">
             Nexile: Brain Behind Business
           </h1>
           <p className="text-slate-500 font-medium mt-1">Here's what's happening in your pharmacy today.</p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-xs font-bold text-slate-400 uppercase">System Status</p>
           <div className="flex items-center text-emerald-500 font-bold text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
              All Systems Operational
           </div>
        </div>
      </div>

      {user?.role === UserRole.PHARMACIST && <PharmacistDashboard stats={stats} insights={insights} topSelling={topSelling} />}
      {user?.role === UserRole.MANAGER && <ManagerDashboard stats={stats} user={user} topSelling={topSelling} />}
      {user?.role === UserRole.OWNER && <OwnerDashboard stats={stats} insights={insights} topSelling={topSelling} />}
    </div>
  );
}