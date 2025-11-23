import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../services/db';
import { getStatisticalInsights } from '../services/aiService';
import { UserRole, Insight } from '../types';
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
  HeartPulse,
  MapPin,
  Plus,
  Trash2,
  Key,
  Shield,
  BrainCircuit,
  X,
  CheckCircle,
  RefreshCw,
  Flame
} from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- COMPONENTS ---

const SignalIndicator = ({ status }: { status: 'good' | 'warning' | 'critical' }) => {
  const colors = {
    good: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]',
    warning: 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]',
    critical: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse',
  };
  return <div className={`w-3 h-3 rounded-full ${colors[status]} mr-2`} />;
};

const StatCard = ({ title, value, trend, icon: Icon, trendUp, status }: any) => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
    {status && <div className={`absolute top-0 right-0 w-1 h-full ${status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`} />}
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl shadow-inner">
        <Icon className="h-6 w-6 text-brand-600 dark:text-brand-400" />
      </div>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center ${trendUp ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'}`}>
        {trendUp ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
        {trend}
      </span>
    </div>
    <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium tracking-wide">{title}</h3>
    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">{value}</p>
  </div>
);

const TopSellingWidget = ({ topSelling, title }: { topSelling: any[], title: string }) => (
  <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden h-full transition-all duration-300 hover:shadow-lg">
    <div className="p-6 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
      <h3 className="font-bold text-lg flex items-center">
        <Flame className="text-orange-500 mr-2 drop-shadow-sm" size={20} />
        {title}
      </h3>
      <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">Volume</span>
    </div>
    <div className="p-4">
      {topSelling.length === 0 ? (
         <p className="text-gray-500 text-sm text-center py-8">No sales data available.</p>
      ) : (
        <div className="space-y-3">
          {topSelling.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900/30 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors group">
               <div className="flex items-center overflow-hidden">
                  <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-xs mr-3 ${idx === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-500' : 'bg-gray-200 dark:bg-zinc-800 text-gray-600 dark:text-gray-400'}`}>
                    #{idx + 1}
                  </div>
                  <div className="min-w-0">
                     <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{item.name}</p>
                     <p className="text-xs text-gray-500 truncate">{item.category} • ${item.price}</p>
                  </div>
               </div>
               <div className="text-right pl-2">
                  <p className="font-bold text-gray-900 dark:text-white">{item.sold}</p>
                  <div className="w-16 bg-gray-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1">
                    <div className="bg-orange-500 h-1.5 rounded-full shadow-[0_0_5px_orange]" style={{ width: `${Math.min((item.sold / topSelling[0].sold) * 100, 100)}%` }}></div>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// --- SUB-DASHBOARDS ---

const PharmacistDashboard = ({ stats, insights, topSelling, user }: any) => {
  // Workflow State
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
    setWorkflowStatus('PROCESSING');
    setTimeout(() => {
      // Mock validation
      if (txIdInput.length < 3) {
         setWorkflowStatus('ERROR');
         setStatusMsg('Invalid Transaction ID format.');
      } else {
         setWorkflowStatus('SUCCESS');
         setStatusMsg(`Refund authorized for Tx #${txIdInput}. Inventory updated.`);
      }
    }, 1000);
  };

  const handleCheckInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    setWorkflowStatus('PROCESSING');
    setTimeout(() => {
       setWorkflowStatus('SUCCESS');
       // Mock logic
       if (drugA.toLowerCase().includes('ibuprofen') && drugB.toLowerCase().includes('aspirin')) {
          setStatusMsg('⚠️ MODERATE RISK: Increased bleeding risk detected.');
       } else {
          setStatusMsg('✅ LOW RISK: No significant interaction found in database.');
       }
    }, 1200);
  };

  return (
    <div className="space-y-8 animate-fadeIn relative">
      
      {/* WORKFLOW MODALS */}
      {activeModal !== 'NONE' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-dark-border p-6 animate-scaleIn">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold flex items-center">
                   {activeModal === 'RETURN' ? <RefreshCw className="mr-2 text-brand-500"/> : <Activity className="mr-2 text-brand-500"/>}
                   {activeModal === 'RETURN' ? 'Process Return' : 'Interaction Checker'}
                 </h3>
                 <button onClick={resetWorkflow} className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors">
                   <X size={20} />
                 </button>
              </div>

              {activeModal === 'RETURN' && (
                <form onSubmit={handleProcessReturn} className="space-y-4">
                   <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Transaction ID</label>
                     <input 
                       type="text" 
                       value={txIdInput}
                       onChange={(e) => setTxIdInput(e.target.value)}
                       className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm shadow-inner"
                       placeholder="e.g. tx-1708..."
                       autoFocus
                     />
                   </div>
                   
                   {workflowStatus === 'IDLE' && (
                     <button type="submit" className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl transition-colors shadow-lg">
                       Verify & Refund
                     </button>
                   )}
                </form>
              )}

              {activeModal === 'INTERACTION' && (
                <form onSubmit={handleCheckInteraction} className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Drug A</label>
                        <input 
                          type="text" 
                          value={drugA}
                          onChange={(e) => setDrugA(e.target.value)}
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500 outline-none text-sm shadow-inner"
                          placeholder="e.g. Warfarin"
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Drug B</label>
                        <input 
                          type="text" 
                          value={drugB}
                          onChange={(e) => setDrugB(e.target.value)}
                          className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500 outline-none text-sm shadow-inner"
                          placeholder="e.g. Aspirin"
                        />
                     </div>
                   </div>
                   {workflowStatus === 'IDLE' && (
                     <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg">
                       Analyze Safety
                     </button>
                   )}
                </form>
              )}

              {/* FEEDBACK STATE */}
              {workflowStatus === 'PROCESSING' && (
                <div className="py-8 flex flex-col items-center justify-center text-gray-500">
                   <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full mb-3"></div>
                   <p className="text-sm font-medium">Processing Request...</p>
                </div>
              )}

              {workflowStatus === 'SUCCESS' && (
                 <div className="py-4 text-center animate-fadeIn">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-green-500/20">
                       <CheckCircle size={24} />
                    </div>
                    <p className={`text-sm font-medium mb-6 ${statusMsg.includes('RISK') && !statusMsg.includes('LOW') ? 'text-yellow-500' : 'text-gray-700 dark:text-gray-200'}`}>
                      {statusMsg}
                    </p>
                    <button onClick={resetWorkflow} className="px-6 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors">
                      Close
                    </button>
                 </div>
              )}

              {workflowStatus === 'ERROR' && (
                 <div className="py-4 text-center animate-shake">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-red-500/20">
                       <AlertTriangle size={24} />
                    </div>
                    <p className="text-sm text-red-500 font-medium mb-6">{statusMsg}</p>
                    <button onClick={() => setWorkflowStatus('IDLE')} className="px-6 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors">
                      Try Again
                    </button>
                 </div>
              )}
           </div>
        </div>
      )}

      {/* Performance Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400 shadow-inner">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full shadow-sm">
              Revenue
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Total Sales</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${stats.revenue.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400 shadow-inner">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full shadow-sm">
              Net Profit
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Earnings</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">${stats.profit.toLocaleString()}</p>
        </div>

        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-100 dark:border-dark-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-purple-600 dark:text-purple-400 shadow-inner">
              <Package className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full shadow-sm">
              Volume
            </span>
          </div>
          <h3 className="text-gray-500 text-sm font-medium">Items Sold</h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{stats.itemsSold}</p>
        </div>
      </div>

      {/* Digital Signal Header & Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-gradient-to-r from-brand-600 to-brand-500 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:shadow-brand-500/40">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="flex items-center mb-4">
               <Scan className="w-6 h-6 mr-2 text-brand-100" />
               <span className="font-medium text-brand-100">Quick Action</span>
            </div>
            <h2 className="text-2xl font-bold mb-4">Point of Sale</h2>
            <Link to="/pos" className="inline-flex items-center justify-center w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 rounded-xl font-bold transition-all">
              Launch POS System
            </Link>
         </div>

         <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <SignalIndicator status={stats.lowStock > 0 ? 'critical' : 'good'} />
                Stock Health
              </h3>
              <span className="text-xs text-gray-500">Real-time</span>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Low Stock Items</span>
                <span className={`font-mono font-bold ${stats.lowStock > 0 ? 'text-red-500' : 'text-green-500'}`}>{stats.lowStock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Expiring Soon</span>
                <span className="font-mono font-bold text-yellow-500">3</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-zinc-800 rounded-full h-2 mt-2 shadow-inner">
                <div className="bg-green-500 h-2 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" style={{ width: '85%' }}></div>
              </div>
            </div>
         </div>

         <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center">
                <HeartPulse className="w-4 h-4 mr-2 text-brand-500" />
                Workflow
              </h3>
            </div>
            <div className="space-y-3">
               <button 
                  onClick={() => setActiveModal('RETURN')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left border border-transparent hover:border-brand-500/30"
               >
                  <span className="text-sm font-medium">Process Return</span>
                  <ArrowUpRight size={16} className="text-gray-400" />
               </button>
               <button 
                  onClick={() => setActiveModal('INTERACTION')}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-900/50 rounded-xl hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors text-left border border-transparent hover:border-brand-500/30"
               >
                  <span className="text-sm font-medium">Check Drug Interaction</span>
                  <Activity size={16} className="text-gray-400" />
               </button>
            </div>
         </div>
      </div>

      {/* Recent Alerts & Trending */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
           <TopSellingWidget topSelling={topSelling} title="Products On Demand" />
        </div>

        <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden h-fit transition-all duration-300 hover:shadow-xl">
          <div className="p-6 border-b border-gray-200 dark:border-dark-border">
            <h3 className="font-bold text-lg">Priority Signals</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {insights.filter((i: any) => i.type === 'warning').length === 0 && (
               <div className="p-8 text-center text-gray-500 text-sm">All systems nominal. No priority alerts.</div>
            )}
            {insights.filter((i: any) => i.type === 'warning').map((insight: any, idx: number) => (
              <div key={idx} className="p-4 flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-zinc-900/30 transition-colors">
                 <div className="mt-1 p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 shadow-sm">
                   <AlertTriangle size={18} />
                 </div>
                 <div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white">{insight.metric}</h4>
                   <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{insight.message}</p>
                 </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ManagerDashboard = ({ stats, insights, user, topSelling }: any) => {
  const assignedBranches = db.branches.filter(b => user.assignedBranchIds?.includes(b.id));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${stats.revenue.toLocaleString()}`} trend="Aggregate" trendUp={true} icon={DollarSign} status="good" />
        <StatCard title="Low Stock SKUs" value={stats.lowStock} trend="Needs Attention" trendUp={false} icon={Package} status={stats.lowStock > 0 ? 'warning' : 'good'} />
        <StatCard title="Total Transactions" value={stats.transactions} trend="Network Wide" trendUp={true} icon={ShoppingCart} />
        <StatCard title="Inventory Value" value={`$${stats.totalStock.toLocaleString()}`} trend="Estimated" trendUp={true} icon={Activity} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm transition-all duration-300 hover:shadow-xl">
          <h3 className="font-bold text-lg mb-6">Branch Performance Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Branch Name</th>
                  <th className="px-4 py-3">Revenue</th>
                  <th className="px-4 py-3">Stock Value</th>
                  <th className="px-4 py-3 rounded-r-lg">Alerts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                {assignedBranches.map(branch => {
                   const perf = db.getBranchPerformance(branch.id);
                   return (
                     <tr key={branch.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                       <td className="px-4 py-4 font-medium">{branch.name}</td>
                       <td className="px-4 py-4 text-green-600 font-bold">${perf.revenue.toLocaleString()}</td>
                       <td className="px-4 py-4">${perf.stockValue.toLocaleString()}</td>
                       <td className="px-4 py-4">
                         {perf.lowStockCount > 0 ? (
                           <span className="text-red-500 flex items-center font-bold"><AlertTriangle size={12} className="mr-1"/> {perf.lowStockCount} Low Stock</span>
                         ) : (
                           <span className="text-green-500 flex items-center"><Zap size={12} className="mr-1"/> Healthy</span>
                         )}
                       </td>
                     </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Top Selling for Manager Context */}
        <div className="h-full">
           <TopSellingWidget topSelling={topSelling} title="Region Top Sellers" />
        </div>
      </div>
      
      <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm transition-all duration-300 hover:shadow-xl">
          <h3 className="font-bold text-lg mb-4 flex items-center"><BrainCircuit className="mr-2 text-brand-500" /> Intelligence & Alerts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {insights.map((insight: any, i: number) => (
               <div key={i} className="p-4 bg-gray-50 dark:bg-zinc-900/50 rounded-xl border border-gray-100 dark:border-zinc-800 flex items-start hover:bg-white/5 transition-colors">
                  <div className={`p-2 rounded-lg mr-3 ${insight.type === 'warning' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'} shadow-sm`}>
                    {insight.type === 'warning' ? <AlertTriangle size={18} /> : <Zap size={18} />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">{insight.metric}</h4>
                    <p className="text-sm text-gray-500 mt-1">{insight.message}</p>
                  </div>
               </div>
             ))}
          </div>
      </div>

    </div>
  );
};

const OwnerDashboard = ({ stats, insights, topSelling }: any) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BRANCHES' | 'STAFF'>('OVERVIEW');
  const [branches, setBranches] = useState(db.branches);
  const [managers, setManagers] = useState(db.getManagers());
  
  // Branch Form
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchLoc, setNewBranchLoc] = useState('');

  // Staff Actions
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string | null>(null);
  
  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName || !newBranchLoc) return;
    db.createBranch(newBranchName, newBranchLoc);
    setBranches(db.branches); // Refresh
    setNewBranchName('');
    setNewBranchLoc('');
  };

  const handleDeleteBranch = (id: string) => {
    if (confirm("Are you sure you want to delete this branch? This action is irreversible.")) {
      db.deleteBranch(id);
      setBranches(db.branches);
    }
  };

  const handleGenerateCode = (userId: string) => {
    const code = db.generateAccessCode();
    const user = managers.find(u => u.id === userId);
    if (user) {
      const updated = { ...user, accessCode: code };
      db.updateUser(updated);
      setManagers(db.getManagers());
      setGeneratedCode(code);
      setSelectedManagerId(userId);
      // Hide code after 10 seconds
      setTimeout(() => {
         setGeneratedCode(null);
         setSelectedManagerId(null);
      }, 10000);
    }
  };

  const handleAssignManager = (managerId: string, branchId: string) => {
    db.assignManagerToBranch(managerId, branchId);
    setManagers(db.getManagers());
    alert("Manager assigned successfully.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-border mb-6">
        <button onClick={() => setActiveTab('OVERVIEW')} className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'OVERVIEW' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500'}`}>Overview</button>
        <button onClick={() => setActiveTab('BRANCHES')} className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'BRANCHES' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500'}`}>Network & Branches</button>
        <button onClick={() => setActiveTab('STAFF')} className={`pb-2 px-4 font-medium text-sm transition-colors ${activeTab === 'STAFF' ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500'}`}>Staff & Access</button>
      </div>

      {activeTab === 'OVERVIEW' && (
        <>
          {/* High Level Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-brand-900 to-gray-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl">
              <div className="relative z-10">
                <p className="text-brand-200 text-sm font-medium mb-1">Total Network Profit</p>
                <h2 className="text-4xl font-bold mb-2">$128,492</h2>
                <div className="flex items-center text-sm text-brand-300">
                  <TrendingUp size={16} className="mr-1" /> +18.2% vs last month
                </div>
              </div>
              <Activity className="absolute right-4 bottom-4 text-white/5 w-32 h-32" />
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-center group hover:border-brand-500 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl relative overflow-hidden">
               <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-500 text-sm font-medium">Active Branches</span>
                      <MapPin className="text-brand-500 w-5 h-5" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{branches.length} Regions</h2>
                  <button 
                    onClick={() => setActiveTab('BRANCHES')}
                    className="mt-3 text-sm text-brand-600 dark:text-brand-400 font-bold flex items-center hover:underline"
                  >
                    Manage Network <ArrowUpRight size={14} className="ml-1" />
                  </button>
               </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-2xl p-6 border border-gray-200 dark:border-dark-border shadow-sm flex flex-col justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm font-medium">Inventory Value</span>
                  <Package className="text-blue-500 w-5 h-5" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">${stats.totalStock.toLocaleString()}</h2>
              <p className="text-sm text-gray-500 mt-1">Across all locations</p>
            </div>
          </div>

           {/* Strategic Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm p-6 transition-all duration-300 hover:shadow-xl">
              <h3 className="font-bold text-lg mb-6 flex items-center">
                <TrendingUp className="mr-2 text-brand-500 w-5 h-5" /> Growth Trajectory
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[
                      { name: 'Jan', val: 4000 }, { name: 'Feb', val: 3000 }, { name: 'Mar', val: 5000 },
                      { name: 'Apr', val: 4780 }, { name: 'May', val: 5890 }, { name: 'Jun', val: 7390 }
                    ]}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} stroke="#9ca3af" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }} />
                      <Area type="monotone" dataKey="val" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Enhanced AI Insights Widget */}
            <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-inner text-white flex flex-col transition-all duration-300 hover:shadow-2xl hover:border-zinc-700">
              <h3 className="font-bold text-lg mb-4 flex items-center text-brand-400">
                <BrainCircuit className="mr-2 w-5 h-5" /> Nexile AI Predictions
              </h3>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {insights.map((insight: any, i: number) => (
                  <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                      <div className="flex justify-between mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                           insight.type === 'warning' ? 'bg-red-500/20 text-red-300' : 
                           insight.type === 'prediction' ? 'bg-blue-500/20 text-blue-300' : 
                           'bg-green-500/20 text-green-300'
                        }`}>
                          {insight.metric}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 leading-snug mt-1.5">{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Global Top Selling */}
          <div className="h-80">
             <TopSellingWidget topSelling={topSelling} title="Global High Demand Products" />
          </div>
        </>
      )}

      {activeTab === 'BRANCHES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Branch Network Performance</h2>
            {branches.map(branch => {
              const perf = db.getBranchPerformance(branch.id);
              // Find assigned manager
              const assignedManager = managers.find(m => m.assignedBranchIds?.includes(branch.id));
              
              return (
                <div key={branch.id} className="bg-white dark:bg-dark-card p-5 rounded-xl border border-gray-200 dark:border-dark-border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                  <div>
                    <div className="flex items-center">
                      <MapPin size={18} className="text-gray-400 mr-2"/>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">{branch.name}</h3>
                    </div>
                    <p className="text-sm text-gray-500 ml-6 mb-2 sm:mb-0">{branch.location}</p>
                    <div className="ml-6 flex gap-4 text-sm mt-2 mb-2">
                      <span className="text-green-600 font-medium">Rev: ${perf.revenue.toLocaleString()}</span>
                      <span className="text-gray-500">Stock: ${perf.stockValue.toLocaleString()}</span>
                    </div>
                    {/* Manager Display */}
                    <div className="ml-6 flex items-center text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-900/50 px-2 py-1 rounded w-fit shadow-sm">
                       <Users size={12} className="mr-1.5" />
                       {assignedManager ? (
                         <span>Manager: <span className="font-bold text-gray-700 dark:text-gray-200">{assignedManager.name}</span></span>
                       ) : (
                         <span className="text-yellow-600 dark:text-yellow-500">No Manager Assigned</span>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-6 sm:ml-0 w-full sm:w-auto justify-between sm:justify-end mt-4 sm:mt-0">
                     <div className="text-right mr-4">
                        <p className="text-xs text-gray-400 uppercase font-bold">Transactions</p>
                        <p className="font-mono text-lg">{perf.transactionCount}</p>
                     </div>
                     <button 
                       onClick={() => handleDeleteBranch(branch.id)}
                       className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                       title="Delete Branch"
                     >
                       <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-gray-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-gray-200 dark:border-dark-border h-fit">
             <h3 className="font-bold text-lg mb-4 flex items-center"><Plus className="mr-2"/> Add New Branch</h3>
             <form onSubmit={handleCreateBranch} className="space-y-4">
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Branch Name</label>
                 <input 
                   type="text" 
                   value={newBranchName}
                   onChange={e => setNewBranchName(e.target.value)}
                   className="w-full p-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500 outline-none shadow-inner"
                   placeholder="e.g. Northside Clinic"
                 />
               </div>
               <div>
                 <label className="block text-xs font-medium text-gray-500 mb-1">Location / Region</label>
                 <input 
                   type="text" 
                   value={newBranchLoc}
                   onChange={e => setNewBranchLoc(e.target.value)}
                   className="w-full p-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-dark-border focus:ring-2 focus:ring-brand-500 outline-none shadow-inner"
                   placeholder="e.g. Chicago, IL"
                 />
               </div>
               <button type="submit" className="w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg shadow-lg shadow-brand-500/20 transition-all transform hover:-translate-y-0.5">
                 Deploy Branch
               </button>
             </form>
          </div>
        </div>
      )}

      {activeTab === 'STAFF' && (
         <div className="grid grid-cols-1 gap-6">
           <h2 className="text-lg font-bold text-gray-900 dark:text-white">Manager Access & Assignments</h2>
           <div className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-xl overflow-hidden shadow-sm">
             <table className="w-full text-sm text-left">
               <thead className="bg-gray-50 dark:bg-zinc-900/50">
                 <tr>
                   <th className="px-6 py-3">Name / Email</th>
                   <th className="px-6 py-3">Assigned Branches</th>
                   <th className="px-6 py-3">Access Status</th>
                   <th className="px-6 py-3 text-right">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
                 {managers.map(manager => (
                   <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                     <td className="px-6 py-4">
                       <div className="font-bold text-gray-900 dark:text-white">{manager.name}</div>
                       <div className="text-xs text-gray-500">{manager.email}</div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                         {manager.assignedBranchIds?.length ? manager.assignedBranchIds.map(bid => {
                           const b = branches.find(br => br.id === bid);
                           return b ? <span key={bid} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs border border-blue-200 dark:border-blue-800">{b.name}</span> : null;
                         }) : <span className="text-gray-400 italic">Unassigned</span>}
                       </div>
                     </td>
                     <td className="px-6 py-4">
                       <div className="flex items-center">
                         {generatedCode && selectedManagerId === manager.id ? (
                           <div className="bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 px-3 py-1 rounded font-mono font-bold animate-pulse border border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]">
                             {generatedCode}
                           </div>
                         ) : (
                           <span className="text-gray-500 flex items-center">
                             <Shield size={14} className="mr-1 text-green-500"/> Secured
                           </span>
                         )}
                       </div>
                     </td>
                     <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                       <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1 shadow-inner">
                          <select 
                             className="bg-transparent text-xs border-none focus:ring-0 text-gray-600 dark:text-gray-300 cursor-pointer outline-none"
                             onChange={(e) => handleAssignManager(manager.id, e.target.value)}
                             value=""
                          >
                             <option value="" disabled>+ Assign Branch</option>
                             {branches.map(b => (
                               <option key={b.id} value={b.id}>{b.name}</option>
                             ))}
                          </select>
                       </div>
                       <button 
                         onClick={() => handleGenerateCode(manager.id)}
                         className="flex items-center px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-brand-500/20 hover:-translate-y-0.5"
                         title="Generate AI Secure Code"
                       >
                         <Key size={14} className="mr-1" /> Gen Code
                       </button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
             {managers.length === 0 && (
               <div className="p-8 text-center text-gray-500">No managers found. Create users with 'Manager' role manually in DB seed for demo.</div>
             )}
           </div>
         </div>
      )}

    </div>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState<any>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [topSelling, setTopSelling] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const allProducts = db.products;
    const allTxs = db.transactions;

    let scopeProducts = allProducts;
    let scopeTxs = allTxs;

    if (user.role === UserRole.MANAGER) {
       const branches = user.assignedBranchIds || [];
       scopeProducts = allProducts.filter(p => branches.includes(p.branchId));
       scopeTxs = allTxs.filter(t => branches.includes(t.branchId));
    } else if (user.role === UserRole.PHARMACIST) {
       scopeProducts = allProducts.filter(p => p.branchId === user.branchId);
       scopeTxs = allTxs.filter(t => t.branchId === user.branchId);
    }

    const revenue = scopeTxs.reduce((acc, t) => acc + t.total, 0);
    const transactions = scopeTxs.length;
    const itemsSold = scopeTxs.reduce((acc, t) => acc + t.items.reduce((sum, i) => sum + i.quantity, 0), 0);
    
    // Profit estimation: Revenue - Cost of Goods Sold
    let cogs = 0;
    scopeTxs.forEach(t => {
      t.items.forEach(i => {
         const p = allProducts.find(prod => prod.id === i.productId);
         if (p) cogs += (p.cost * i.quantity);
      });
    });
    const profit = revenue - cogs;

    const lowStock = scopeProducts.filter(p => p.stock <= p.minStockLevel).length;
    const totalStock = scopeProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);

    setStats({ revenue, profit, itemsSold, transactions, lowStock, totalStock });

    // Insights
    const branchIdForInsights = user.role === UserRole.PHARMACIST ? user.branchId : undefined;
    setInsights(getStatisticalInsights(branchIdForInsights));

    // Top Selling
    const salesMap = new Map<string, number>();
    scopeTxs.forEach(t => {
       t.items.forEach(i => {
          salesMap.set(i.productId, (salesMap.get(i.productId) || 0) + i.quantity);
       });
    });
    
    const sorted = Array.from(salesMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pid, sold]) => {
         const p = scopeProducts.find(prod => prod.id === pid);
         return p ? { ...p, sold } : null;
      })
      .filter(Boolean);
      
    setTopSelling(sorted);

  }, [user]);

  if (!user) return <div className="p-8 text-center">Redirecting...</div>;
  if (!stats) return <div className="p-8 text-center animate-pulse">Loading Dashboard...</div>;

  if (user.role === UserRole.OWNER) {
    return <OwnerDashboard stats={stats} insights={insights} topSelling={topSelling} />;
  } 
  
  if (user.role === UserRole.MANAGER) {
    return <ManagerDashboard stats={stats} insights={insights} user={user} topSelling={topSelling} />;
  }

  return <PharmacistDashboard stats={stats} insights={insights} topSelling={topSelling} user={user} />;
}
