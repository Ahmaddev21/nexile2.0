import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { db } from '../services/db';
import { UserRole } from '../types';
import { 
  Activity, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle, 
  Lock, 
  Store,
  User,
  Mail,
  ArrowRight,
  Code,
  Cpu,
  Pill,
  Sparkles
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RESET';

// --- 3D Art: Cheerful Edition (Sunrise Gradient) ---
const AbstractBuildersArt = () => (
  <svg className="w-full h-full max-h-[85vh]" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
    <defs>
      {/* Cheerful Gradients */}
      <radialGradient id="grad-sun" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#fbbf24" /> {/* Amber */}
        <stop offset="100%" stopColor="#f59e0b" />
      </radialGradient>

      <linearGradient id="grad-pawn-body" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#a78bfa" /> {/* Soft Violet */}
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>

      <linearGradient id="grad-pawn-head" x1="0%" y1="0%" x2="0%" y2="100%">
         <stop offset="0%" stopColor="#f472b6" /> {/* Pink */}
         <stop offset="100%" stopColor="#e879f9" />
      </linearGradient>

      <linearGradient id="grad-beam" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6"/>
        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0"/>
      </linearGradient>

      <filter id="glow-soft" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="6" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* Floating Background Bubbles */}
    <g opacity="0.4">
       <circle cx="200" cy="200" r="40" fill="#fcd34d">
         <animate attributeName="cy" values="200;180;200" dur="6s" repeatCount="indefinite" />
       </circle>
       <circle cx="800" cy="150" r="20" fill="#67e8f9">
         <animate attributeName="cy" values="150;170;150" dur="5s" repeatCount="indefinite" />
       </circle>
       <circle cx="850" cy="800" r="60" fill="#f9a8d4">
         <animate attributeName="cy" values="800;780;800" dur="7s" repeatCount="indefinite" />
       </circle>
    </g>

    {/* Floating Medical Icons (White with Soft Shadow) */}
    <g opacity="0.8">
       <g transform="translate(150, 750) rotate(-15)">
          <rect x="-25" y="-10" width="50" height="20" rx="10" fill="#fff" filter="url(#glow-soft)" />
          <animateTransform attributeName="transform" type="rotate" values="-15;0;-15" dur="5s" repeatCount="indefinite" />
       </g>
       <g transform="translate(850, 300)">
          <path d="M-15,0 L15,0 M0,-15 L0,15" stroke="#fff" strokeWidth="8" strokeLinecap="round" filter="url(#glow-soft)">
             <animateTransform attributeName="transform" type="rotate" values="0;45;0" dur="4s" repeatCount="indefinite" />
          </path>
       </g>
    </g>

    {/* Floor Shadow */}
    <ellipse cx="500" cy="820" rx="300" ry="40" fill="#4c1d95" opacity="0.1" />

    {/* CENTER CORE (Cube) */}
    <g transform="translate(500, 550)">
       {/* Glow behind */}
       <circle r="100" fill="#c4b5fd" opacity="0.3" filter="url(#glow-soft)">
          <animate attributeName="r" values="100;120;100" dur="3s" repeatCount="indefinite" />
       </circle>
       {/* Cube */}
       <g stroke="#8b5cf6" strokeWidth="4" fill="rgba(255,255,255,0.8)">
         <path d="M0,-50 L45,-25 L45,25 L0,50 L-45,25 L-45,-25 Z" />
         <path d="M0,-50 L0,0 M0,0 L45,25 M0,0 L-45,25" opacity="0.5"/>
         <animateTransform attributeName="transform" type="rotate" values="0 0 0; 360 0 0" dur="20s" repeatCount="indefinite" />
       </g>
    </g>

    {/* LEFT CHARACTER (Programmer) */}
    <g transform="translate(280, 650)">
       {/* Screen */}
       <path d="M30,-80 L120,-100 L120,0 L30,20 Z" fill="url(#grad-beam)" />
       {/* Body */}
       <path d="M-40,120 L-20,-20 L20,-20 L40,120 Z" fill="url(#grad-pawn-body)" />
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-pawn-head)">
         <animate attributeName="cy" values="-50;-55;-50" dur="3s" repeatCount="indefinite" />
       </circle>
    </g>

    {/* TOP CHARACTER (Thinker) */}
    <g transform="translate(500, 320) scale(0.9)">
       <ellipse cx="0" cy="120" rx="50" ry="10" fill="#4c1d95" opacity="0.1" />
       {/* Halo */}
       <circle cx="0" cy="-60" r="50" fill="none" stroke="#fcd34d" strokeWidth="2" strokeDasharray="4,8">
          <animateTransform attributeName="transform" type="rotate" values="0 0 -60; 360 0 -60" dur="10s" repeatCount="indefinite" />
       </circle>
       {/* Body */}
       <path d="M-40,120 L-20,-20 L20,-20 L40,120 Z" fill="url(#grad-pawn-body)" />
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-pawn-head)" />
    </g>

    {/* RIGHT CHARACTER (Solver) */}
    <g transform="translate(720, 650)">
       <path d="M-30,-50 L-220,-100" stroke="#f472b6" strokeWidth="4" strokeDasharray="10,10" strokeLinecap="round">
         <animate attributeName="stroke-dashoffset" values="0;20" dur="1s" repeatCount="indefinite" />
       </path>
       {/* Body */}
       <path d="M-40,120 L-20,-20 L20,-20 L40,120 Z" fill="url(#grad-pawn-body)" />
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-pawn-head)">
          <animate attributeName="cx" values="0;5;0" dur="4s" repeatCount="indefinite" />
       </circle>
    </g>
  </svg>
);

export default function Login() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [mode, setMode] = useState<AuthMode>('LOGIN');
  const [role, setRole] = useState<UserRole>(UserRole.OWNER);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [branches, setBranches] = useState(db.branches);
  
  React.useEffect(() => {
    setBranches(db.branches);
  }, [mode]);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearForm = () => {
    setError('');
    setSuccessMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setBranchId('');
    setAccessCode('');
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    clearForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'RESET') {
         if (!email) throw new Error("Please enter your email address.");
         setTimeout(() => {
           setSuccessMsg("If an account exists, a reset link has been sent.");
         }, 1000);
         return;
      }

      if (mode === 'LOGIN') {
         let user;
         if (role === UserRole.MANAGER) {
           if (!email || !accessCode) throw new Error("Email and Access Code are required.");
           if (accessCode.length !== 4) throw new Error("Access Code must be 4 digits.");
           user = db.authenticateUser(email, undefined, accessCode, UserRole.MANAGER);
         } else {
           if (!email || !password) throw new Error("Email and password are required.");
           if (role === UserRole.PHARMACIST && !branchId) throw new Error("Please select your branch context.");
           
           user = db.authenticateUser(email, password, undefined, role);
           
           if (user && role === UserRole.PHARMACIST && user.branchId !== branchId) {
             throw new Error("You are not registered for this branch.");
           }
         }

         if (user) {
           if (role === UserRole.PHARMACIST && branchId) {
             user = { ...user, branchId };
           }
           login(user);
           navigate('/');
         } else {
           throw new Error("Invalid credentials. Please check and try again.");
         }
      }

      if (mode === 'SIGNUP') {
        if (role === UserRole.MANAGER) {
           throw new Error("Managers cannot self-register. Please ask the Owner for an Access Code.");
        }
        
        if (!name || !email || !password) throw new Error("All fields are required.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (role === UserRole.PHARMACIST && !branchId) throw new Error("Please select a branch to join.");

        const newUser = db.addUser({
           id: '', 
           name,
           email,
           password,
           role,
           branchId: role === UserRole.PHARMACIST ? branchId : undefined,
           subscriptionStatus: 'active',
           trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

        login(newUser);
        navigate('/');
      }

    } catch (err: any) {
      setError(err.message || "An error occurred.");
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans overflow-hidden">
      
      {/* --- LEFT PANEL: CHEERFUL ART --- */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.3),transparent_50%)]"></div>
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-12">
           {/* Logo */}
           <div className="absolute top-10 left-10 flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center backdrop-blur-md shadow-lg">
               <Activity className="text-white h-7 w-7" strokeWidth={3} />
             </div>
             <div>
                <span className="text-2xl font-black text-white tracking-tight block leading-none">Nexile</span>
                <span className="text-[10px] uppercase tracking-widest text-white/80 font-bold">Systems</span>
             </div>
           </div>

           {/* Art */}
           <div className="w-full flex-1 flex items-center justify-center max-w-3xl transform scale-110 translate-y-8">
              <AbstractBuildersArt />
           </div>

           {/* Text */}
           <div className="text-center max-w-md -mt-12 mb-12 relative z-20">
             <h1 className="text-5xl font-black text-white mb-4 tracking-tight drop-shadow-sm">
               The Pharmacy OS
             </h1>
             <p className="text-lg text-white/90 font-medium tracking-wide">
               Simple, smart control for modern networks.
             </p>
             <div className="flex justify-center gap-6 mt-8">
                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 text-white shadow-inner">
                      <Code size={16} />
                   </div>
                   <span className="text-[10px] text-white uppercase font-bold">Secure</span>
                </div>
                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 text-white shadow-inner">
                      <Sparkles size={16} />
                   </div>
                   <span className="text-[10px] text-white uppercase font-bold">Smart</span>
                </div>
                <div className="flex flex-col items-center">
                   <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-2 text-white shadow-inner">
                      <Pill size={16} />
                   </div>
                   <span className="text-[10px] text-white uppercase font-bold">Care</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* --- RIGHT PANEL: CLEAN WHITE FORM --- */}
      <div className="relative flex flex-col items-center justify-center p-6 lg:p-24 bg-white">
        {/* Background Decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50 rounded-bl-full -z-0 opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-sky-50 rounded-tr-full -z-0 opacity-50"></div>

        {/* Mobile Logo */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
           <div className="w-14 h-14 rounded-3xl bg-brand-500 flex items-center justify-center mb-3 text-white shadow-xl shadow-brand-200">
              <Activity size={32} />
           </div>
           <span className="text-3xl font-black text-slate-800">Nexile</span>
        </div>

        <div className="w-full max-w-md relative z-10">
            {/* Toggle */}
            {mode !== 'RESET' && (
              <div className="flex p-1.5 gap-1 bg-slate-100 rounded-2xl mb-8">
                <button 
                  onClick={() => handleModeSwitch('LOGIN')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'LOGIN' ? 'bg-white text-brand-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => handleModeSwitch('SIGNUP')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'SIGNUP' ? 'bg-white text-brand-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            <div className="bg-white border border-slate-100 rounded-[2rem] p-8 shadow-2xl shadow-slate-200/50">
              {mode === 'RESET' ? (
                 <div className="animate-fadeIn">
                   <button onClick={() => handleModeSwitch('LOGIN')} className="flex items-center text-sm text-slate-400 hover:text-brand-600 transition-colors mb-8 group font-bold">
                     <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Login
                   </button>
                   <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-4 text-sky-500">
                      <Lock size={28} />
                   </div>
                   <h2 className="text-2xl font-black text-slate-800 mb-2">Reset Password</h2>
                   <p className="text-sm text-slate-500 mb-6">Enter your email address and we'll send you instructions.</p>
                 </div>
              ) : (
                <div className="mb-8">
                  <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">{mode === 'LOGIN' ? 'Welcome Back!' : 'Get Started'}</h2>
                  <p className="text-slate-500 font-medium">{mode === 'LOGIN' ? 'Fill in your information here.' : 'Create your free account today.'}</p>
                </div>
              )}

              {/* Roles */}
              {mode !== 'RESET' && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setError(''); }}
                      className={`py-3 px-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border-2 transition-all duration-200 ${
                        role === r 
                        ? 'bg-brand-50 border-brand-500 text-brand-600' 
                        : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {r === UserRole.OWNER ? 'Owner' : r === UserRole.MANAGER ? 'Manager' : 'Pharm'}
                    </button>
                  ))}
                </div>
              )}

              {mode === 'SIGNUP' && role === UserRole.MANAGER ? (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center animate-fadeIn">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
                     <AlertCircle size={24} />
                  </div>
                  <h3 className="text-amber-800 font-bold mb-2">Invitation Required</h3>
                  <p className="text-sm text-amber-700/80 leading-relaxed mb-4">
                    Managers need an Access Code from the Owner to join.
                  </p>
                  <button onClick={() => handleModeSwitch('LOGIN')} className="text-brand-600 font-bold text-sm hover:underline">
                    Have a code? Log In
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                  {mode === 'SIGNUP' && (
                    <div className="group">
                      <div className="relative">
                        <User className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                          placeholder="Full Name"
                        />
                      </div>
                    </div>
                  )}

                  {(mode === 'RESET' || role === UserRole.OWNER || role === UserRole.PHARMACIST || (role === UserRole.MANAGER && mode === 'LOGIN')) && (
                    <div className="group">
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                          placeholder="Email Address"
                        />
                      </div>
                    </div>
                  )}

                  {role === UserRole.PHARMACIST && mode !== 'RESET' && (
                    <div className="group">
                      <div className="relative">
                        <Store className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <select 
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 outline-none appearance-none cursor-pointer"
                        >
                          <option value="">Select Branch...</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {role === UserRole.MANAGER && mode === 'LOGIN' && (
                    <div className="group">
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input
                          type="password"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all font-mono tracking-widest"
                          placeholder="4-DIGIT CODE"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  )}

                  {role !== UserRole.MANAGER && mode !== 'RESET' && (
                    <div className="group">
                      <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-brand-500 rounded-xl py-3.5 pl-12 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-all"
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  )}
                  
                  {mode === 'LOGIN' && role !== UserRole.MANAGER && (
                    <div className="flex justify-end">
                       <button type="button" onClick={() => handleModeSwitch('RESET')} className="text-xs font-bold text-slate-400 hover:text-brand-600 transition-colors">Forgot Password?</button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center p-4 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold animate-shake">
                      <AlertCircle size={16} className="mr-2 flex-shrink-0" /> {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex items-center p-4 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-bold animate-fadeIn">
                      <CheckCircle size={16} className="mr-2 flex-shrink-0" /> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-4 rounded-xl shadow-xl shadow-brand-200 transition-all transform hover:-translate-y-1 active:scale-[0.98] flex items-center justify-center group"
                  >
                    {mode === 'LOGIN' ? 'Log In' : mode === 'SIGNUP' ? 'Create Account' : 'Send Email'}
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}