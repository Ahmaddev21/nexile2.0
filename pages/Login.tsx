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
  Pill
} from 'lucide-react';

type AuthMode = 'LOGIN' | 'SIGNUP' | 'RESET';

// --- 3D Art Component: The Architects (Programmer, Thinker, Solver) ---
// Enhanced with Medical/Pharmacy Elements
const AbstractBuildersArt = () => (
  <svg className="w-full h-full max-h-[85vh]" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
    <defs>
      {/* 3D Sphere Gradient for Heads */}
      <radialGradient id="grad-head-3d" cx="30%" cy="30%" r="70%" fx="30%" fy="30%">
        <stop offset="0%" stopColor="#6ee7b7" />
        <stop offset="50%" stopColor="#10b981" />
        <stop offset="100%" stopColor="#065f46" />
      </radialGradient>

      {/* 3D Cylinder Gradient for Bodies */}
      <linearGradient id="grad-body-3d" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="50%" stopColor="#34d399" />
        <stop offset="100%" stopColor="#047857" />
      </linearGradient>

      {/* Hologram Screen Gradient */}
      <linearGradient id="grad-hologram" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34d399" stopOpacity="0.1"/>
        <stop offset="50%" stopColor="#34d399" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#34d399" stopOpacity="0.1"/>
      </linearGradient>

      <filter id="glow-3d" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    {/* --- Background Medical Elements (Floating) --- */}
    <g opacity="0.15">
       {/* Floating Crosses */}
       <g transform="translate(200, 200)">
          <path d="M-20,0 L20,0 M0,-20 L0,20" stroke="#fff" strokeWidth="8">
             <animateTransform attributeName="transform" type="rotate" values="0 0 0; 360 0 0" dur="20s" repeatCount="indefinite" />
          </path>
       </g>
       <g transform="translate(800, 300)">
          <path d="M-15,0 L15,0 M0,-15 L0,15" stroke="#fff" strokeWidth="6">
             <animateTransform attributeName="transform" type="rotate" values="0 0 0; -360 0 0" dur="25s" repeatCount="indefinite" />
          </path>
       </g>
       {/* Floating Pills */}
       <g transform="translate(850, 800) rotate(45)">
          <rect x="-30" y="-10" width="60" height="20" rx="10" stroke="#fff" strokeWidth="2" fill="none">
             <animate attributeName="opacity" values="0.5;1;0.5" dur="5s" repeatCount="indefinite" />
          </rect>
          <line x1="0" y1="-10" x2="0" y2="10" stroke="#fff" strokeWidth="2" />
       </g>
       <g transform="translate(150, 750) rotate(-30)">
          <rect x="-20" y="-8" width="40" height="16" rx="8" stroke="#fff" strokeWidth="2" fill="none" />
          <line x1="0" y1="-8" x2="0" y2="8" stroke="#fff" strokeWidth="2" />
       </g>
    </g>

    {/* --- Floor Shadow --- */}
    <ellipse cx="500" cy="800" rx="350" ry="60" fill="#000" opacity="0.3" filter="url(#glow-3d)" />

    {/* --- CENTER: The Nexile Core (Abstract Medical Cube) --- */}
    <g transform="translate(500, 550)">
       {/* Core Energy Field */}
       <circle r="90" fill="rgba(16, 185, 129, 0.05)" filter="url(#glow-3d)">
          <animate attributeName="r" values="90;110;90" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
       </circle>
       {/* Isometric Cube Wireframe */}
       <g stroke="#ecfdf5" strokeWidth="3" fill="rgba(5, 150, 105, 0.2)">
         <path d="M0,-45 L40,-22 L40,22 L0,45 L-40,22 L-40,-22 Z" />
         <path d="M0,-45 L0,0 M0,0 L40,22 M0,0 L-40,22" />
         <animateTransform attributeName="transform" type="rotate" values="0 0 0; 360 0 0" dur="30s" repeatCount="indefinite" />
       </g>
       {/* Inner Medical Cross */}
       <g opacity="0.8" filter="url(#glow-3d)">
         <path d="M0,-15 L0,15 M-15,0 L15,0" stroke="#fff" strokeWidth="4" strokeLinecap="round">
             <animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite" />
         </path>
       </g>
    </g>

    {/* --- LEFT PAWN: The Programmer (Logic/Code) --- */}
    <g transform="translate(250, 680)">
       <ellipse cx="0" cy="110" rx="60" ry="15" fill="#000" opacity="0.4" filter="url(#glow-3d)" />
       
       {/* Holographic Screen */}
       <path d="M30,-70 L110,-90 L110,10 L30,30 Z" fill="url(#grad-hologram)" stroke="#34d399" strokeWidth="1" opacity="0.8">
         <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
       </path>
       {/* Binary Code Stream */}
       <g fill="#ecfdf5" opacity="0.8" fontSize="10" fontFamily="monospace">
          <text x="40" y="-60">10101</text>
          <text x="40" y="-45">01100</text>
          <text x="40" y="-30">11010</text>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" />
       </g>

       {/* Body */}
       <path d="M-45,100 L-20,-20 L20,-20 L45,100 Z" fill="url(#grad-body-3d)" />
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-head-3d)">
         <animate attributeName="cy" values="-50;-48;-50" dur="2s" repeatCount="indefinite" />
       </circle>
    </g>

    {/* --- TOP PAWN: The Thinker (Strategy/Analysis) --- */}
    <g transform="translate(500, 320) scale(0.9)">
       <ellipse cx="0" cy="110" rx="60" ry="15" fill="#000" opacity="0.4" filter="url(#glow-3d)" />
       
       {/* Orbiting Data Nodes */}
       <g>
         <ellipse rx="80" ry="25" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.5" transform="rotate(-10)">
           <animateTransform attributeName="transform" type="rotate" values="0 0 0; 360 0 0" dur="10s" repeatCount="indefinite" additive="sum"/>
         </ellipse>
         <circle r="6" fill="#fff">
            <animateMotion dur="10s" repeatCount="indefinite" path="M-78,13 A80,25 0 1,0 78,-13 A80,25 0 1,0 -78,13" />
         </circle>
       </g>

       {/* Body */}
       <path d="M-45,100 L-20,-20 L20,-20 L45,100 Z" fill="url(#grad-body-3d)" />
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-head-3d)">
          <animate attributeName="cy" values="-50;-60;-50" dur="4s" repeatCount="indefinite" />
       </circle>
       {/* Neural Halo */}
       <circle cx="0" cy="-60" r="50" fill="none" stroke="#fff" strokeWidth="1" strokeDasharray="2,4" opacity="0.4">
          <animateTransform attributeName="transform" type="rotate" values="0 0 -60; -360 0 -60" dur="12s" repeatCount="indefinite" />
       </circle>
    </g>

    {/* --- RIGHT PAWN: The Solver (Execution/Care) --- */}
    <g transform="translate(750, 680)">
       <ellipse cx="0" cy="110" rx="60" ry="15" fill="#000" opacity="0.4" filter="url(#glow-3d)" />
       
       {/* Connection Beam to Core */}
       <path d="M-30,-50 L-250,-130" stroke="url(#grad-hologram)" strokeWidth="3" opacity="0.6" strokeDasharray="10,5">
          <animate attributeName="stroke-dashoffset" values="0;100" dur="2s" repeatCount="indefinite" />
       </path>

       {/* Body */}
       <path d="M-45,100 L-20,-20 L20,-20 L45,100 Z" fill="url(#grad-body-3d)">
          <animateTransform attributeName="transform" type="skewX" values="0;3;0" dur="4s" repeatCount="indefinite" />
       </path>
       {/* Head */}
       <circle cx="0" cy="-50" r="35" fill="url(#grad-head-3d)">
          <animate attributeName="cx" values="0;3;0" dur="4s" repeatCount="indefinite" />
       </circle>
       {/* Floating Plus Icon (Pharmacy Symbol) */}
       <g transform="translate(40, -80)">
          <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="#fff" strokeWidth="3" opacity="0.8">
             <animateTransform attributeName="transform" type="scale" values="0.8;1.2;0.8" dur="2s" repeatCount="indefinite" />
          </path>
       </g>
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
  
  // Helper to check if branches update has propagated
  const [branches, setBranches] = useState(db.branches);
  
  // Fetch latest branches on mount/tab switch to ensure new branches appear
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
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 font-sans selection:bg-brand-500 selection:text-white overflow-hidden">
      
      {/* --- Left Panel: Art & Storytelling --- */}
      <div className="hidden lg:flex flex-col items-center justify-center relative bg-[#02040a] overflow-hidden border-r border-white/5">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand-900/20 via-[#02040a] to-[#02040a] z-0"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.15),transparent_70%)] z-0"></div>
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 xl:p-12">
           {/* Branding Top Left - Prominent Logo */}
           <div className="absolute top-10 left-10 flex items-center gap-3 z-20">
             <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center backdrop-blur-md shadow-lg shadow-brand-500/20">
               <Activity className="text-brand-400 h-7 w-7" strokeWidth={2.5} />
             </div>
             <div>
                <span className="text-2xl font-bold text-white tracking-tight block leading-none">Nexile</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-400 font-bold">Systems</span>
             </div>
           </div>

           {/* The Art */}
           <div className="w-full flex-1 flex items-center justify-center max-w-3xl">
              <AbstractBuildersArt />
           </div>

           {/* Narrative Text - Moved Up */}
           <div className="text-center max-w-md -mt-16 mb-12 animate-fadeIn relative z-20">
             <h1 className="text-5xl font-black text-white mb-3 tracking-tight">
               The Pharmacy OS
             </h1>
             <p className="text-lg text-gray-400 font-medium tracking-wide">
               Precision control for modern networks.
             </p>
             <div className="flex justify-center gap-4 mt-6">
                <div className="flex flex-col items-center">
                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 text-brand-400">
                      <Code size={14} />
                   </div>
                   <span className="text-[10px] text-gray-500 uppercase font-bold">Secure</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 text-blue-400">
                      <Cpu size={14} />
                   </div>
                   <span className="text-[10px] text-gray-500 uppercase font-bold">Smart</span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col items-center">
                   <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-1 text-green-400">
                      <Pill size={14} />
                   </div>
                   <span className="text-[10px] text-gray-500 uppercase font-bold">Care</span>
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* --- Right Panel: Login Form --- */}
      <div className="relative flex flex-col items-center justify-center p-6 lg:p-24 bg-[#050505]">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        {/* Mobile Branding */}
        <div className="lg:hidden mb-10 flex flex-col items-center">
           <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mb-3">
              <Activity className="text-brand-500 h-8 w-8" />
           </div>
           <span className="text-3xl font-bold text-white">Nexile</span>
        </div>

        <div className="w-full max-w-md relative z-10">
            {/* Header Tab Switcher */}
            {mode !== 'RESET' && (
              <div className="flex p-1.5 gap-1 bg-white/5 rounded-2xl mb-8 border border-white/5">
                <button 
                  onClick={() => handleModeSwitch('LOGIN')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'LOGIN' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  Log In
                </button>
                <button 
                  onClick={() => handleModeSwitch('SIGNUP')}
                  className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'SIGNUP' ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/20' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                >
                  Sign Up
                </button>
              </div>
            )}

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
              {mode === 'RESET' ? (
                 <div className="animate-fadeIn">
                   <button onClick={() => handleModeSwitch('LOGIN')} className="flex items-center text-sm text-gray-400 hover:text-white transition-colors mb-8 group">
                     <ArrowLeft size={16} className="mr-1 group-hover:-translate-x-1 transition-transform" /> Back to Login
                   </button>
                   <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 text-brand-400 border border-brand-500/20">
                      <Lock size={24} />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
                   <p className="text-sm text-gray-400 mb-6">Enter your email address and we'll send you instructions to reset your password.</p>
                 </div>
              ) : (
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{mode === 'LOGIN' ? 'Welcome Back' : 'Join Nexile'}</h2>
                  <p className="text-gray-500 text-sm">{mode === 'LOGIN' ? 'Access your pharmacy dashboard.' : 'Initialize your new account.'}</p>
                </div>
              )}

              {/* Role Select */}
              {mode !== 'RESET' && (
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[UserRole.OWNER, UserRole.MANAGER, UserRole.PHARMACIST].map((r) => (
                    <button
                      key={r}
                      onClick={() => { setRole(r); setError(''); }}
                      className={`py-2.5 px-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-xl border transition-all duration-200 ${
                        role === r 
                        ? 'bg-brand-500/10 border-brand-500 text-brand-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : 'bg-transparent border-white/10 text-gray-500 hover:bg-white/5 hover:border-white/20'
                      }`}
                    >
                      {r === UserRole.OWNER ? 'Owner' : r === UserRole.MANAGER ? 'Manager' : 'Pharm'}
                    </button>
                  ))}
                </div>
              )}

              {/* Manager Signup Block */}
              {mode === 'SIGNUP' && role === UserRole.MANAGER ? (
                <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-6 text-center animate-fadeIn">
                  <AlertCircle className="text-yellow-500 mx-auto mb-3" size={32} />
                  <h3 className="text-white font-bold mb-2">Restricted Access</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Manager accounts must be provisioned by the Owner. Use your generated Access Code to log in.
                  </p>
                  <button onClick={() => handleModeSwitch('LOGIN')} className="mt-4 text-brand-400 font-bold text-sm hover:text-brand-300 transition-colors">
                    Switch to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 animate-fadeIn">
                  {mode === 'SIGNUP' && (
                    <div className="group">
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          placeholder="Full Name"
                        />
                      </div>
                    </div>
                  )}

                  {(mode === 'RESET' || role === UserRole.OWNER || role === UserRole.PHARMACIST || (role === UserRole.MANAGER && mode === 'LOGIN')) && (
                    <div className="group">
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          placeholder="Email Address"
                        />
                      </div>
                    </div>
                  )}

                  {role === UserRole.PHARMACIST && mode !== 'RESET' && (
                    <div className="group">
                      <div className="relative">
                        <Store className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                        <select 
                          value={branchId}
                          onChange={(e) => setBranchId(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none appearance-none cursor-pointer"
                        >
                          <option value="" className="bg-[#09090b] text-gray-500">Select Branch...</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id} className="bg-[#09090b]">{b.name} ({b.location})</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-4 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-500 pointer-events-none"></div>
                      </div>
                    </div>
                  )}

                  {role === UserRole.MANAGER && mode === 'LOGIN' && (
                    <div className="group">
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                        <input
                          type="password"
                          value={accessCode}
                          onChange={(e) => setAccessCode(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all font-mono tracking-widest"
                          placeholder="ACCESS CODE"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  )}

                  {role !== UserRole.MANAGER && mode !== 'RESET' && (
                    <div className="group">
                      <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-gray-500 group-focus-within:text-brand-400 transition-colors" size={18} />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                          placeholder="Password"
                        />
                      </div>
                    </div>
                  )}
                  
                  {mode === 'LOGIN' && role !== UserRole.MANAGER && (
                    <div className="flex justify-end">
                       <button type="button" onClick={() => handleModeSwitch('RESET')} className="text-xs text-gray-500 hover:text-brand-400 transition-colors">Forgot Password?</button>
                    </div>
                  )}

                  {error && (
                    <div className="flex items-center p-3 rounded-lg bg-red-500/10 text-red-400 text-xs border border-red-500/20 animate-shake">
                      <AlertCircle size={14} className="mr-2 flex-shrink-0" /> {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="flex items-center p-3 rounded-lg bg-green-500/10 text-green-400 text-xs border border-green-500/20 animate-fadeIn">
                      <CheckCircle size={14} className="mr-2 flex-shrink-0" /> {successMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)] transition-all transform hover:-translate-y-0.5 active:scale-[0.98] flex items-center justify-center group"
                  >
                    {mode === 'LOGIN' ? 'Access System' : mode === 'SIGNUP' ? 'Initialize Account' : 'Send Reset Link'}
                    <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </form>
              )}
            </div>
        </div>
      </div>
    </div>
  );
}