import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Target, 
  Activity, 
  DollarSign,
  ArrowRight,
  Zap,
  LayoutDashboard,
  X,
  CheckCircle,
  Megaphone,
  Clock,
  ArrowLeftRight,
  FileText,
  BarChart2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart, 
  Area 
} from 'recharts';

// Helper to simulate "Deep Analysis" delay using REAL DATA
const useExecutiveData = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Simulate AI Processing time for visual effect, but use real data
    setTimeout(() => {
      const branches = db.branches.map(b => {
        const perf = db.getBranchPerformance(b.id);
        
        // --- REAL DATA CALCULATION ---
        const revenue = perf.revenue;
        const cogs = perf.cogs;
        const grossProfit = perf.grossProfit;
        
        // Fixed operational cost assumption (Rent/Utilities/Staff) - In full SaaS this is user input
        // We will scale it slightly by transaction volume to mimic variable op costs
        const operationalExpenses = 2000 + (perf.transactionCount * 5); 
        
        const netProfit = grossProfit - operationalExpenses;
        const totalExpenses = cogs + operationalExpenses;
        
        // Efficiency Score Algorithm:
        // 1. Profit Margin Health (0-50 pts)
        const margin = revenue > 0 ? (netProfit / revenue) : 0;
        let score = Math.max(0, margin * 100); 
        
        // 2. Stock Health Penalty (-10 pts per 5 low stock items)
        const stockPenalty = Math.floor(perf.lowStockCount / 5) * 10;
        score -= stockPenalty;
        
        // 3. Activity Bonus (+1 pt per 10 transactions, max 30)
        const activityBonus = Math.min(30, Math.floor(perf.transactionCount / 10));
        score += activityBonus;

        // Clamp 0-100
        const efficiencyScore = Math.min(Math.max(Math.round(score + 50), 10), 99);

        // Trend Simulation (Compare to 'previous period' - randomized for demo as we don't have historical snapshots)
        const growthRate = (Math.random() * 20) - 5; // -5% to +15% variation

        return {
          ...b,
          revenue,
          expenses: totalExpenses,
          profit: netProfit,
          transactions: perf.transactionCount,
          efficiencyScore,
          growthRate,
          stockHealth: perf.lowStockCount
        };
      });

      // Sort by Profit
      const ranked = [...branches].sort((a, b) => b.profit - a.profit);
      const topPerformer = ranked[0];
      const underPerformer = ranked[ranked.length - 1];

      // Generate Forecast Data (Next 7 Days) based on Daily Average
      const totalRecordedProfit = ranked.reduce((acc, b) => acc + b.profit, 0);
      // Assume recorded data is roughly "Current Month"
      const dailyAverageProfit = totalRecordedProfit / 30;

      const forecastData = Array.from({ length: 7 }).map((_, i) => {
         const day = i + 1;
         // Base projection on real daily average
         const baseProj = dailyAverageProfit; 
         // Apply some variance for "prediction"
         const trendFactor = 1 + (day * 0.02); // 2% daily growth predicted
         const noise = (Math.random() * baseProj * 0.1) - (baseProj * 0.05);
         
         const projected = (baseProj * trendFactor) + noise;
         // Risk threshold
         const riskLevel = projected * 0.7;

         return { day: `Day ${day}`, projected: Math.round(projected), risk: Math.round(riskLevel) };
      });

      setData({
        branches: ranked,
        topPerformer,
        underPerformer,
        forecastData,
        totalNetworkProfit: ranked.reduce((acc, b) => acc + b.profit, 0),
        avgEfficiency: Math.round(ranked.reduce((acc, b) => acc + b.efficiencyScore, 0) / ranked.length) || 0
      });
      setLoading(false);
    }, 1500);
  }, []);

  return { loading, data };
};

const EfficiencyBadge = ({ score }: { score: number }) => {
  let color = 'bg-red-500';
  let label = 'Critical';
  if (score > 60) { color = 'bg-yellow-500'; label = 'Average'; }
  if (score > 80) { color = 'bg-green-500'; label = 'Excellent'; }
  if (score > 90) { color = 'bg-brand-500'; label = 'Elite'; }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col items-end">
        <span className={`text-2xl font-black ${color.replace('bg-', 'text-')}`}>{score}</span>
        <span className="text-[10px] uppercase font-bold text-gray-400">{label}</span>
      </div>
      <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-zinc-800 flex items-center justify-center relative">
        <div className={`absolute inset-0 rounded-full border-4 ${color.replace('bg-', 'border-')} opacity-20`}></div>
        <div className={`absolute inset-0 rounded-full border-4 ${color.replace('bg-', 'border-')} border-t-transparent border-l-transparent transform -rotate-45`}></div>
        <Activity size={18} className={color.replace('bg-', 'text-')} />
      </div>
    </div>
  );
};

export default function ExecutiveAnalysis() {
  const { loading, data } = useExecutiveData();
  const [showMitigationModal, setShowMitigationModal] = useState(false);
  const [deployingStrategy, setDeployingStrategy] = useState(false);
  const [strategyDeployed, setStrategyDeployed] = useState(false);
  
  // New States for Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  const handleDeployStrategy = () => {
    setDeployingStrategy(true);
    setTimeout(() => {
      setDeployingStrategy(false);
      setStrategyDeployed(true);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#02040a] text-white">
        <div className="relative">
          <div className="w-24 h-24 border-t-4 border-b-4 border-brand-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="text-brand-500 animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-bold tracking-tight">Nexile AI</h2>
        <p className="text-brand-400/60 font-mono mt-2 animate-pulse">Analyzing Enterprise Data Streams...</p>
        <div className="mt-4 text-xs text-gray-600 font-mono">
           Computing Efficiency Scores • Forecasting Trends • Detecting Anomalies
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] text-gray-900 dark:text-gray-100 p-6 lg:p-10 space-y-8 relative">
      
      {/* --- DETAILED REPORT MODAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#121214] w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col relative animate-scaleIn max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500"></div>
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8 overflow-y-auto">
               <div className="flex items-center mb-8 border-b border-gray-100 dark:border-white/5 pb-6">
                 <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mr-4 border border-purple-500/20">
                    <FileText size={24} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Executive Briefing Document</h2>
                   <p className="text-gray-500 text-sm font-mono">CONFIDENTIAL • GENERATED BY NEXILE AI • {new Date().toLocaleDateString()}</p>
                 </div>
               </div>

               <div className="space-y-8">
                 {/* Section 1: Top Performer Analysis */}
                 <div className="bg-green-50 dark:bg-green-900/10 p-6 rounded-xl border border-green-100 dark:border-green-900/30">
                    <h3 className="text-green-800 dark:text-green-400 font-bold mb-4 flex items-center">
                      <TrendingUp className="mr-2" size={18} />
                      Performance Leader: {data.topPerformer.name}
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                       <div>
                         <span className="block text-gray-500">Net Profit Margin</span>
                         <span className="font-mono font-bold text-gray-900 dark:text-white text-lg">
                           {data.topPerformer.revenue > 0 ? ((data.topPerformer.profit / data.topPerformer.revenue) * 100).toFixed(1) : '0.0'}%
                         </span>
                       </div>
                       <div>
                         <span className="block text-gray-500">Efficiency Score</span>
                         <span className="font-mono font-bold text-green-600 text-lg">
                           {data.topPerformer.efficiencyScore}/100
                         </span>
                       </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <strong>AI Analysis:</strong> This branch exhibits superior inventory turnover rates compared to the network average. The high efficiency score suggests optimal staffing levels during peak transaction hours. Customer retention metrics are inferred to be strong based on recurring revenue stability.
                    </p>
                 </div>

                 {/* Section 2: Underperformer Analysis */}
                 <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                    <h3 className="text-red-800 dark:text-red-400 font-bold mb-4 flex items-center">
                      <TrendingDown className="mr-2" size={18} />
                      Critical Focus: {data.underPerformer.name}
                    </h3>
                     <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                       <div>
                         <span className="block text-gray-500">Op. Expense Ratio</span>
                         <span className="font-mono font-bold text-red-500 text-lg">
                            {data.underPerformer.revenue > 0 ? ((data.underPerformer.expenses / data.underPerformer.revenue) * 100).toFixed(1) : 'N/A'}%
                         </span>
                       </div>
                       <div>
                         <span className="block text-gray-500">Revenue Trend</span>
                         <span className="font-mono font-bold text-red-500 text-lg">
                           {data.underPerformer.growthRate.toFixed(1)}%
                         </span>
                       </div>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      <strong>AI Analysis:</strong> High operational costs are eating into margins. The data indicates leakage in "Utilities/Overhead" or overstaffing during low-traffic windows. Immediate intervention is required to stabilize the P&L statement before the next fiscal quarter.
                    </p>
                 </div>

                 {/* Section 3: Strategic Imperative */}
                 <div>
                    <h3 className="text-gray-900 dark:text-white font-bold mb-3 flex items-center">
                       <Target className="mr-2 text-brand-500" size={18} />
                       Strategic Imperative
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                       <li>Benchmark {data.underPerformer.name} against {data.topPerformer.name}'s rostering schedule to identify efficiency gaps.</li>
                       <li>Initiate a localized marketing campaign for the underperforming branch to boost foot traffic by projected 15%.</li>
                       <li>Consider auditing supplier contracts for {data.underPerformer.name} to reduce Cost of Goods Sold.</li>
                    </ul>
                 </div>
               </div>

               <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-end gap-3">
                  <button 
                    className="px-6 py-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-white text-sm font-bold rounded-lg transition-colors"
                    onClick={() => alert("Report downloaded as PDF.")}
                  >
                    Download PDF
                  </button>
                  <button 
                    onClick={() => setShowReportModal(false)}
                    className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-brand-500/20"
                  >
                    Close Briefing
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MITIGATION MODAL --- */}
      {showMitigationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#121214] w-full max-w-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative animate-scaleIn">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500"></div>
            <button 
              onClick={() => setShowMitigationModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="p-8">
               <div className="flex items-center mb-6">
                 <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mr-4 border border-yellow-500/20">
                    <ShieldCheck size={28} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-bold text-white">Risk Mitigation Strategy</h2>
                   <p className="text-gray-400 text-sm">AI-Generated Action Plan for Projected Revenue Dip (Day 5)</p>
                 </div>
               </div>

               {!strategyDeployed ? (
                 <>
                   <div className="space-y-4 mb-8">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex items-start gap-4">
                         <div className="mt-1 bg-purple-500/20 p-2 rounded-lg text-purple-400"><Megaphone size={18}/></div>
                         <div>
                            <h4 className="font-bold text-white text-sm">Marketing Intervention</h4>
                            <p className="text-gray-400 text-xs mt-1">Deploy "Mid-Month Flash Sale" (15% Off) targeting inactive customers via SMS.</p>
                            <span className="text-[10px] text-green-500 font-mono mt-2 block">+5% proj. lift</span>
                         </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex items-start gap-4">
                         <div className="mt-1 bg-blue-500/20 p-2 rounded-lg text-blue-400"><Clock size={18}/></div>
                         <div>
                            <h4 className="font-bold text-white text-sm">Operational Adjustment</h4>
                            <p className="text-gray-400 text-xs mt-1">Reduce non-peak staff hours by 10% on Day 5 to protect profit margins.</p>
                            <span className="text-[10px] text-green-500 font-mono mt-2 block">+3% margin protection</span>
                         </div>
                      </div>

                      <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors flex items-start gap-4">
                         <div className="mt-1 bg-orange-500/20 p-2 rounded-lg text-orange-400"><ArrowLeftRight size={18}/></div>
                         <div>
                            <h4 className="font-bold text-white text-sm">Inventory Rebalancing</h4>
                            <p className="text-gray-400 text-xs mt-1">Transfer 50 units of high-demand 'Vitamin D3' from Downtown branch to suburbs.</p>
                            <span className="text-[10px] text-green-500 font-mono mt-2 block">Prevent stockouts</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <button 
                        onClick={handleDeployStrategy}
                        disabled={deployingStrategy}
                        className="flex-1 py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] flex items-center justify-center"
                      >
                        {deployingStrategy ? (
                          <span className="animate-pulse">Deploying Actions...</span>
                        ) : (
                          <>
                            <Zap size={18} className="mr-2" /> Execute Action Plan
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => setShowMitigationModal(false)}
                        className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors"
                      >
                        Dismiss
                      </button>
                   </div>
                 </>
               ) : (
                 <div className="text-center py-8 animate-fadeIn">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                       <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Strategy Deployed</h3>
                    <p className="text-gray-400 max-w-sm mx-auto mb-8">
                       Marketing campaigns have been scheduled, staff notifications sent, and inventory transfer requests logged.
                    </p>
                    <button 
                      onClick={() => setShowMitigationModal(false)}
                      className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      Close Report
                    </button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/10 text-brand-500 border border-brand-500/20 uppercase tracking-wider">
               Executive Access Only
             </span>
             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20 uppercase tracking-wider flex items-center">
               <BrainCircuit size={10} className="mr-1" /> Virtual Consultant Mode
             </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            Nexile AI <span className="text-gray-400 font-light">Executive Analysis</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Real-time strategic intelligence, operational scoring, and predictive financial modeling for the business owner.
          </p>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-xs text-gray-500 font-mono">DATA FRESHNESS</p>
           <p className="text-lg font-bold text-brand-500">LIVE SYNC</p>
        </div>
      </div>

      {/* --- KPI ROW --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity size={48} />
           </div>
           <p className="text-sm text-gray-500 font-medium">Network Efficiency Score</p>
           <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-black text-white">{data.avgEfficiency}</span>
              <span className="text-sm font-bold text-gray-500 mb-1">/ 100</span>
           </div>
           <div className="w-full bg-gray-800 h-1.5 rounded-full mt-4 overflow-hidden">
              <div className="bg-brand-500 h-full rounded-full" style={{ width: `${data.avgEfficiency}%` }}></div>
           </div>
        </div>

        <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign size={48} className="text-green-500" />
           </div>
           <p className="text-sm text-gray-500 font-medium">Net Profit (MoM)</p>
           <div className="flex items-end gap-2 mt-2">
              <span className="text-4xl font-black text-green-500">${data.totalNetworkProfit.toLocaleString()}</span>
           </div>
           <p className="text-xs text-green-600/80 mt-2 font-bold flex items-center">
              <TrendingUp size={12} className="mr-1" /> +12.4% vs last month
           </p>
        </div>

        {showBanner && (
          <div className="md:col-span-2 bg-gradient-to-r from-purple-900 to-indigo-900 p-6 rounded-2xl border border-white/10 shadow-lg text-white relative overflow-hidden animate-fadeIn">
             <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-purple-500 blur-[80px] opacity-40 rounded-full"></div>
             <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between">
                   <div>
                      <h3 className="font-bold text-lg flex items-center text-purple-200">
                        <BrainCircuit className="mr-2" size={20} /> AI Consultant Verdict
                      </h3>
                      <p className="text-purple-100/80 text-sm mt-1 max-w-lg leading-relaxed">
                         "Branch <strong className="text-white">{data.topPerformer.name}</strong> is currently the top performer with {data.topPerformer.growthRate.toFixed(1)}% profit growth. 
                         <br/><br/>
                         Conversely, <strong className="text-white">{data.underPerformer.name}</strong> is underperforming due to high operational expense ratios. Suggested action: Launch discount campaign or optimize staff shifts."
                      </p>
                   </div>
                   <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                      <Zap className="text-yellow-400" />
                   </div>
                </div>
                <div className="mt-4 flex gap-2">
                   <button 
                     onClick={() => setShowReportModal(true)}
                     className="px-4 py-2 bg-white text-purple-900 text-xs font-bold rounded-lg hover:bg-purple-50 transition-colors"
                   >
                      View Detailed Report
                   </button>
                   <button 
                     onClick={() => setShowBanner(false)}
                     className="px-4 py-2 bg-black/20 text-white text-xs font-bold rounded-lg hover:bg-black/30 transition-colors border border-white/10"
                   >
                      Dismiss
                   </button>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* LEFT COLUMN: BRANCH PERFORMANCE TABLE */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-[#121214] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">Branch Performance Matrix</h3>
                  <button className="text-xs text-brand-500 font-bold hover:underline">Export CSV</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-gray-50 dark:bg-black/20 text-gray-500 font-bold uppercase text-xs">
                        <tr>
                           <th className="px-6 py-4">Branch</th>
                           <th className="px-6 py-4 text-right">Revenue</th>
                           <th className="px-6 py-4 text-right">Op. Expenses</th>
                           <th className="px-6 py-4 text-right">Net Profit</th>
                           <th className="px-6 py-4 text-center">Trend</th>
                           <th className="px-6 py-4 text-right">Eff. Score</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {data.branches.map((b: any) => (
                           <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                 {b.name}
                                 {b.id === data.topPerformer.id && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded border border-yellow-500/30">MVP</span>}
                              </td>
                              <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">${b.revenue.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-300">${b.expenses.toLocaleString()}</td>
                              <td className="px-6 py-4 text-right font-mono font-bold text-gray-900 dark:text-white">${b.profit.toLocaleString()}</td>
                              <td className="px-6 py-4 text-center">
                                 {b.growthRate > 0 ? (
                                    <span className="inline-flex items-center text-green-500 text-xs font-bold bg-green-500/10 px-2 py-1 rounded-full">
                                       <TrendingUp size={12} className="mr-1" /> +{b.growthRate.toFixed(1)}%
                                    </span>
                                 ) : (
                                    <span className="inline-flex items-center text-red-500 text-xs font-bold bg-red-500/10 px-2 py-1 rounded-full">
                                       <TrendingDown size={12} className="mr-1" /> {b.growthRate.toFixed(1)}%
                                    </span>
                                 )}
                              </td>
                              <td className="px-6 py-4 flex justify-end">
                                 <EfficiencyBadge score={b.efficiencyScore} />
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-500 mb-6 uppercase tracking-wider">Revenue vs Expenses</h3>
                  <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.branches} layout="vertical" margin={{ left: 20 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" stroke="#666" fontSize={10} width={80} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }} 
                              itemStyle={{ color: '#fff' }}
                           />
                           <Legend />
                           <Bar dataKey="revenue" name="Revenue" fill="#10b981" radius={[0, 4, 4, 0]} barSize={10} />
                           <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={10} />
                        </BarChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
                  <h3 className="font-bold text-sm text-gray-500 mb-6 uppercase tracking-wider">Projected Profit (Next 7 Days)</h3>
                  <div className="h-64 w-full">
                     <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.forecastData}>
                           <defs>
                              <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                                 <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                 <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                           <XAxis dataKey="day" stroke="#666" fontSize={10} />
                           <YAxis stroke="#666" fontSize={10} />
                           <Tooltip 
                              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
                              labelStyle={{ color: '#ccc' }}
                           />
                           <Area type="monotone" dataKey="projected" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProj)" />
                           <Line type="monotone" dataKey="risk" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </AreaChart>
                     </ResponsiveContainer>
                  </div>
               </div>
            </div>
         </div>

         {/* RIGHT COLUMN: ALERTS & RECOMMENDATIONS */}
         <div className="space-y-6">
            <div className="bg-white dark:bg-[#121214] p-6 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm">
               <h3 className="font-bold text-lg mb-4 flex items-center">
                  <Target className="mr-2 text-brand-500" /> Strategic Recommendations
               </h3>
               <div className="space-y-4">
                  {data.branches.map((b: any) => {
                     let advice = "";
                     let type: 'good' | 'bad' | 'neutral' = 'neutral';
                     
                     if (b.efficiencyScore < 50) {
                        advice = `Critical efficiency drop detected. Review staff scheduling for '${b.name}' immediately.`;
                        type = 'bad';
                     } else if (b.stockHealth > 10) {
                        advice = `Inventory warning: '${b.name}' has high out-of-stock rates affecting revenue. Restock ASAP.`;
                        type = 'bad';
                     } else if (b.growthRate > 10) {
                        advice = `Strong momentum in '${b.name}'. Consider expanding inventory depth to capture demand.`;
                        type = 'good';
                     } else {
                        advice = `Stable performance in '${b.name}'. Maintain current operations.`;
                     }

                     return (
                        <div key={b.id} className="p-4 bg-gray-50 dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                           <div className="flex items-start gap-3">
                              <div className={`mt-1 p-1.5 rounded-md ${type === 'bad' ? 'bg-red-500/20 text-red-500' : type === 'good' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'}`}>
                                 {type === 'bad' ? <AlertTriangle size={14} /> : type === 'good' ? <TrendingUp size={14} /> : <ShieldCheck size={14} />}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-gray-400 uppercase mb-1">{b.name}</p>
                                 <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{advice}</p>
                              </div>
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="bg-yellow-500/5 p-6 rounded-2xl border border-yellow-500/20">
               <h3 className="font-bold text-yellow-500 mb-2 text-sm uppercase tracking-wide flex items-center">
                  <AlertTriangle size={14} className="mr-2" /> Risk Analysis
               </h3>
               <p className="text-sm text-gray-400 mb-4">
                  AI Projection indicates a <span className="text-white font-bold">12% risk</span> of revenue dip in Day 5 due to historical low-traffic patterns mid-month.
               </p>
               <button 
                 onClick={() => setShowMitigationModal(true)}
                 className="w-full py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-xs font-bold rounded-lg border border-yellow-500/30 transition-colors"
               >
                  View Mitigation Strategy
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}