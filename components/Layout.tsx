import React, { useState, useEffect } from 'react';
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
  Sparkles
} from 'lucide-react';
import { AuthContext } from '../App';
import { UserRole } from '../types';

export default function Layout({ children }: { children?: React.ReactNode }) {
  const { user, logout } = React.useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [darkMode, setDarkMode] = React.useState(true); // Default to dark
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showWelcomeToast, setShowWelcomeToast] = useState(false);

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
    // Check if we've already shown the toast in this session
    const hasShown = sessionStorage.getItem('nexile_welcome_toast');
    if (!hasShown && user) {
      const timer = setTimeout(() => {
        setShowWelcomeToast(true);
        sessionStorage.setItem('nexile_welcome_toast', 'true');
      }, 3000); // Show after 3 seconds
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: [UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST] },
    { path: '/pos', label: 'POS / Scan', icon: ScanBarcode, roles: [UserRole.PHARMACIST] },
    { path: '/reports', label: 'Reports & AI', icon: FileBarChart, roles: [UserRole.OWNER, UserRole.MANAGER] },
  ];

  const filteredMenu = menuItems.filter(item => user && item.roles.includes(user.role));

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col shadow-xl lg:shadow-none`}>
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-dark-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
               <Activity className="h-5 w-5 text-brand-500" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Nexile</span>
          </div>
        </div>

        {/* Clock Widget (Sidebar) */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-dark-border bg-gray-50/50 dark:bg-black/20">
          <div className="flex items-center text-brand-600 dark:text-brand-400 mb-1">
             <Clock size={14} className="mr-2 animate-pulse" />
             <span className="text-xs font-bold uppercase tracking-wider">System Time</span>
          </div>
          <div className="font-mono text-2xl font-bold text-gray-800 dark:text-white tracking-tight">
             {formatTime(currentTime)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
             {formatDate(currentTime)}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredMenu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-dark-border">
           <div className="flex items-center mb-4 px-2">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-zinc-800 flex items-center justify-center mr-3">
                 <UserCircle className="h-6 w-6 text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500 truncate capitalize flex items-center">
                   <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user?.role === UserRole.OWNER ? 'bg-purple-500' : user?.role === UserRole.MANAGER ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                   {user?.role.toLowerCase()}
                </p>
              </div>
           </div>
           <button 
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg mb-2 transition-colors"
           >
             <span className="mr-2">{darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
           </button>
           <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
           >
             <LogOut className="h-4 w-4 mr-2" />
             Sign Out
           </button>
        </div>
        <div className="px-6 py-4 text-xs text-center text-gray-400 border-t border-gray-100 dark:border-dark-border">
          © 2025 Nexile Systems Inc.
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden relative">
        <header className="h-16 lg:hidden flex items-center justify-between px-4 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center">
               <Activity className="h-5 w-5 text-brand-500" />
            </div>
            <span className="font-bold text-lg">Nexile</span>
          </div>
          
          {/* Mobile Clock */}
          <div className="text-xs font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-black/50 px-2 py-1 rounded">
             {formatTime(currentTime)}
          </div>

          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2">
             {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>

        {/* Welcome Notification Toast */}
        {showWelcomeToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-slideInRight">
            <div className="bg-white dark:bg-dark-card border border-brand-500/30 shadow-2xl rounded-xl p-4 flex items-start max-w-sm relative overflow-hidden">
               <div className="absolute inset-0 bg-brand-500/5 pointer-events-none" />
               <button onClick={() => setShowWelcomeToast(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                 <X size={14} />
               </button>
               <div className="mr-4 bg-brand-100 dark:bg-brand-900/30 p-2 rounded-full text-brand-600">
                 <Sparkles size={20} className="animate-pulse" />
               </div>
               <div className="pr-6">
                 <h4 className="font-bold text-sm text-gray-900 dark:text-white">Hello, {user?.name.split(' ')[0]}!</h4>
                 <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    Hope you are doing well with Nexile services.
                 </p>
               </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}