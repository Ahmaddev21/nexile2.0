import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { User, UserRole } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import POS from './pages/POS';
import Layout from './components/Layout';
import Reports from './pages/Reports';
import ExecutiveAnalysis from './pages/ExecutiveAnalysis';

// Auth Context Helper
export const AuthContext = React.createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}>({
  user: null,
  login: () => {},
  logout: () => {},
});

const PrivateRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = React.useContext(AuthContext);
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const AppContent = () => {
  const location = useLocation();
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
      <Route path="/inventory" element={<PrivateRoute><Layout><Inventory /></Layout></PrivateRoute>} />
      <Route path="/pos" element={<PrivateRoute><Layout><POS /></Layout></PrivateRoute>} />
      <Route path="/reports" element={<PrivateRoute><Layout><Reports /></Layout></PrivateRoute>} />
      
      {/* Executive Analysis Route - Only for Owners */}
      <Route path="/executive-analysis" element={
        <PrivateRoute>
          <Layout>
             <ExecutiveAnalysis />
          </Layout>
        </PrivateRoute>
      } />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('nexile_auth_user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (u: User) => {
    setUser(u);
    localStorage.setItem('nexile_auth_user', JSON.stringify(u));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('nexile_auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthContext.Provider>
  );
}