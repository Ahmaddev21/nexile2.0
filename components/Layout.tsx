import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ScanBarcode,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Activity,
  UserCircle,
  Clock,
  Sparkles,
  BrainCircuit,
  Sun,
  Moon,
  Search,
  ChevronRight
} from 'lucide-react';
import { AuthContext } from '../App';
import { UserRole, Product, Transaction } from '../types';
import { db } from '../services/db';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(false); // Default to Light Mode for "Cheerful" vibe
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: Product[], transactions: Transaction[] } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Real-time clock effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Welcome Notification Effect
  useEffect(() => {
    const hasShown = sessionStorage.getItem('nexile_welcome_toast');
    if (!hasShown && user) {
      const timer = setTimeout(() => {
        setShowWelcomeToast(true);
        sessionStorage.setItem('nexile_welcome_toast', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Search Logic
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const q = searchQuery.toLowerCase();

    // Filter accessible products
    const products = db.products.filter(p => {
      // Filter by role scope first
      if (user?.role === UserRole.PHARMACIST && p.branchId !== user.branchId) return false;
      if (user?.role === UserRole.MANAGER && !user.assignedBranchIds?.includes(p.branchId)) return false;
      return true;
    }).filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    ).slice(0, 5);

    // Filter accessible transactions
    const transactions = db.transactions.filter(t => {
      if (user?.role === UserRole.PHARMACIST && t.branchId !== user.branchId) return false;
      if (user?.role === UserRole.MANAGER && !user.assignedBranchIds?.includes(t.branchId)) return false;
      return true;
    }).filter(t =>
      t.id.toLowerCase().includes(q)
    ).slice(0, 5);

    if (products.length > 0 || transactions.length > 0) {
      setSearchResults({ products, transactions });
    } else {
      setSearchResults(null);
    }
  }, [searchQuery, user]);

  // Clear search on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search on navigation
  useEffect(() => {
    setSearchQuery('');
    setSearchResults(null);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResultClick = (path: string) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults(null);
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST] },
    { path: '/ai-pharmacist', label: 'Nexile AI', icon: BrainCircuit, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST] },
    { path: '/executive-analysis', label: 'Executive Analysis', icon: BrainCircuit, roles: [UserRole.OWNER] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST] },
    { path: '/pos', label: 'POS / Scan', icon: ScanBarcode, roles: [UserRole.PHARMACIST] },
    { path: '/reports', label: 'Reports & AI', icon: FileBarChart, roles: [UserRole.OWNER, UserRole.MANAGER] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-dark-bg text-slate-800 dark:text-slate-100 font-sans">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-white dark:bg-dark-card border-r border-slate-200 dark:border-dark-border flex flex-col shadow-2xl lg:shadow-none`}>
        {/* Logo Area */}
        <div className="h-20 flex items-center px-8 border-b border-slate-100 dark:border-dark-border">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-200 dark:shadow-none transform group-hover:rotate-6 transition-transform duration-300">
              <Activity className="h-6 w-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-800 dark:text-white block leading-none">Nexile</span>
              <span className="text-[10px] font-bold text-brand-500 tracking-widest uppercase">Systems</span>
            </div>
          </div>
        </div>

        {/* Clock Widget */}
        <div className="px-8 py-6">
          <div className="bg-gradient-to-r from-sky-50 to-brand-50 dark:from-slate-800 dark:to-slate-800 rounded-2xl p-4 border border-brand-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider flex items-center">
                <Clock size={12} className="mr-1" /> Local Time
              </span>
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            </div>
            <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
              {formatTime(currentTime)}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isExecutive = item.label === 'Executive Analysis';

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3.5 text-sm font-semibold rounded-2xl transition-all duration-200 group relative overflow-hidden ${isActive
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-200 dark:shadow-none'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-600 dark:hover:text-brand-300'
                  } ${isExecutive && !isActive ? 'border border-dashed border-brand-200 dark:border-brand-800' : ''}`}
              >
                {/* Hover Background Effect */}
                <div className={`absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 ${isActive ? 'block' : 'hidden'}`}></div>

                <Icon className={`h-5 w-5 mr-3 ${isActive ? 'text-white' : isExecutive ? 'text-brand-500' : 'text-slate-400 group-hover:text-brand-500'} transition-colors`} />
                <span className="relative z-10">{item.label}</span>
                {isActive && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full"></div>}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 m-4 mt-0 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700">
          <div className="flex items-center mb-4 px-1">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-sm flex items-center justify-center mr-3">
              <UserCircle className="h-6 w-6 text-slate-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center">
                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user?.role === UserRole.OWNER ? 'bg-brand-500' : user?.role === UserRole.MANAGER ? 'bg-sky-500' : 'bg-emerald-500'}`}></span>
                {user?.role}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center justify-center px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-brand-300 transition-colors"
            >
              {darkMode ? <Sun size={14} className="mr-1 text-amber-400" /> : <Moon size={14} className="mr-1 text-brand-500" />}
              {darkMode ? 'Light' : 'Dark'}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center px-3 py-2 text-xs font-bold text-rose-600 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:border-rose-200 transition-all"
            >
              <LogOut size={14} className="mr-1" />
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative bg-[#f8fafc] dark:bg-[#0f172a]">

        {/* Universal Header (Mobile + Global Search) */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-200 dark:border-dark-border sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-brand-200">
                <Activity className="h-5 w-5" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white">Nexile</span>
            </div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-lg mx-auto relative ml-4 lg:ml-0" ref={searchRef}>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search inventory, transactions..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-700 outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchResults && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-dark-card rounded-2xl shadow-2xl border border-slate-100 dark:border-dark-border overflow-hidden z-50 animate-scaleIn origin-top">

                {/* Products Section */}
                {searchResults.products.length > 0 && (
                  <div className="py-2">
                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <Package size={12} className="mr-1.5" /> Products
                    </h4>
                    {searchResults.products.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleResultClick('/inventory')}
                        className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center group transition-colors"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">{p.name}</p>
                          <p className="text-xs text-slate-500 font-mono">{p.sku}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Transactions Section */}
                {searchResults.transactions.length > 0 && (
                  <div className="py-2 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <FileBarChart size={12} className="mr-1.5" /> Transactions
                    </h4>
                    {searchResults.transactions.map(t => (
                      <button
                        key={t.id}
                        onClick={() => handleResultClick('/reports')}
                        className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-brand-900/10 flex justify-between items-center group transition-colors"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-800 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">Transaction #{t.id.split('-')[1] || t.id}</p>
                          <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString()} • ${t.total.toFixed(2)}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-brand-500" />
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.products.length === 0 && searchResults.transactions.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                    <Search size={24} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No results found.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="w-8 hidden lg:block"></div> {/* Spacer for symmetry */}
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          {children}
        </div>

        {/* Welcome Notification Toast (Cheerful Style) */}
        {showWelcomeToast && (
          <div className="fixed bottom-8 right-8 z-50 animate-slideInRight">
            <div className="bg-white dark:bg-slate-800 border-l-4 border-brand-500 shadow-2xl rounded-2xl p-5 flex items-start max-w-sm relative overflow-hidden ring-1 ring-black/5">
              <button onClick={() => setShowWelcomeToast(false)} className="absolute top-3 right-3 text-slate-300 hover:text-slate-500 dark:hover:text-white transition-colors">
                <X size={14} />
              </button>
              <div className="mr-4 bg-brand-100 dark:bg-brand-900/30 p-3 rounded-full text-brand-600">
                <Sparkles size={24} className="animate-bounce-slight" />
              </div>
              <div className="pr-4">
                <h4 className="font-bold text-base text-slate-900 dark:text-white">Welcome Back!</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  Hope you are doing well with Nexile services today. Let's make it a productive one! 🚀
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}