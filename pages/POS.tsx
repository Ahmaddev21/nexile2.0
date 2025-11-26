import React, { useState, useRef, useContext, useEffect } from 'react';
import { db } from '../services/db';
import { AuthContext } from '../App';
import { Product, Transaction } from '../types';
import { Scan, Trash2, Receipt, Plus, Minus, Camera, AlertTriangle, CheckCircle, Power, Zap, Search } from 'lucide-react';

export default function POS() {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState<{product: Product, qty: number}[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success' | 'info'} | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // Visual Feedback State
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // --- Audio Logic (Subtle Dot Sound) ---
  const playBeep = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // "Dot" sound profile: Sine wave, 1000Hz, very short decay
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime); // Low volume
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1); // 100ms duration

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  // --- Camera Logic ---

  const startCamera = async () => {
    try {
      setCameraError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      setIsCameraActive(true); // Triggers render -> Mounts <video> -> useEffect attaches stream
    } catch (err: any) {
      console.error("Camera Error:", err);
      let msg = "Camera access denied or unavailable.";
      if (err.name === 'NotAllowedError') msg = "Permission denied. Please allow camera access.";
      if (err.name === 'NotFoundError') msg = "No camera device found.";
      setCameraError(msg);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [isCameraActive]);

  useEffect(() => {
    // Focus input for USB scanners on mount
    if(inputRef.current) inputRef.current.focus();
    return () => stopCamera();
  }, []);

  // --- Identification Logic ---

  const identifyProduct = (term: string): Product | undefined => {
    const normalized = term.trim().toLowerCase();
    
    // 1. Exact SKU Match (Highest Priority - Barcode Scanner Behavior)
    let match = db.products.find(p => 
      p.sku.toLowerCase() === normalized && 
      (user?.branchId ? p.branchId === user.branchId : true)
    );
    
    // 2. Exact Name Match
    if (!match) {
       match = db.products.find(p => 
        p.name.toLowerCase() === normalized && 
        (user?.branchId ? p.branchId === user.branchId : true)
      );
    }
    
    // 3. Fuzzy Name Search (Fallback)
    if (!match) {
      match = db.products.find(p => 
        p.name.toLowerCase().includes(normalized) && 
        (user?.branchId ? p.branchId === user.branchId : true)
      );
    }
    
    return match;
  };

  // --- Scanning Logic ---

  const simulateScanDetection = () => {
    // 1. Get available products for this branch context
    const availableProducts = db.products.filter(p => 
       user?.branchId ? p.branchId === user.branchId : true
    );
    
    if (availableProducts.length > 0) {
       // Pick a random product
       const randomProduct = availableProducts[Math.floor(Math.random() * availableProducts.length)];
       
       // 2. Visual feedback using the SKU to simulate a real barcode read
       setMessage({ text: `Scanning: ${randomProduct.sku}...`, type: 'info' });
       
       // 3. Delay to simulate processing and perform ACTUAL lookup by SKU
       // This ensures the identifyProduct logic is tested, not just the object passing
       setTimeout(() => {
         const identified = identifyProduct(randomProduct.sku);
         if (identified) {
             handleProductScan(identified);
         } else {
             setMessage({ text: "Scan Error: Product exists but lookup failed.", type: 'error' });
         }
       }, 600);
    } else {
       setMessage({ text: "No products available in this branch to scan.", type: 'error' });
    }
  };

  const handleProductScan = (product: Product) => {
     // Mock Drug Interaction Check
     const interactionRisk = cart.some(item => item.product.category === 'Antibiotics' && product.category === 'Supplements'); 
     
     if (interactionRisk) {
        const proceed = window.confirm(`⚠️ DRUG INTERACTION ALERT ⚠️\n\nPotential risk between ${product.name} and items in cart.\n\nProceed anyway?`);
        if (!proceed) return;
     }

     if (product.stock <= 0) {
       setMessage({ text: `OUT OF STOCK: ${product.name}`, type: 'error' });
       return;
     }

     addToCart(product);
     
     // Success Feedback
     setMessage({ text: `✓ Added: ${product.name}`, type: 'success' });
     setScanSuccess(true);
     playBeep(); // Play subtle dot sound
     setTimeout(() => setScanSuccess(false), 800);
  };

  const handleManualScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    const product = identifyProduct(scanInput);

    if (product) {
      handleProductScan(product);
      setScanInput('');
    } else {
      setMessage({ text: `Product not found for "${scanInput}"`, type: 'error' });
    }
  };

  const addToCart = (product: Product) => {
    setHighlightedItemId(product.id);
    
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        if (existing.qty + 1 > product.stock) {
           setMessage({ text: `Max stock (${product.stock}) reached for ${product.name}`, type: 'error' });
           return prev;
        }
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product, qty: 1 }];
    });

    // Remove highlight after animation
    setTimeout(() => {
      setHighlightedItemId(null);
    }, 2000);
  };

  const updateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const newItem = { ...prev[idx], qty: prev[idx].qty + delta };
      if (newItem.qty <= 0) return prev.filter((_, i) => i !== idx);
      if (newItem.qty > newItem.product.stock) {
        setMessage({ text: `Only ${newItem.product.stock} units available.`, type: 'error' });
        return prev;
      }
      const newCart = [...prev];
      newCart[idx] = newItem;
      setHighlightedItemId(newCart[idx].product.id);
      setTimeout(() => setHighlightedItemId(null), 500);
      return newCart;
    });
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;

    const total = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      total,
      branchId: user?.branchId || 'unknown',
      pharmacistId: user?.id || 'unknown',
      items: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.qty
      }))
    };

    db.addTransaction(tx);
    cart.forEach(item => {
      db.updateStock(item.product.id, -item.qty);
    });

    setCart([]);
    setMessage({ text: 'Transaction Recorded. Receipt Sent.', type: 'success' });
  };

  const grandTotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col lg:flex-row gap-6">
      
      {/* LEFT PANEL - Scanner & Input */}
      <div className="flex-1 flex flex-col gap-6">
        
        {/* Scanner Area */}
        <div className="bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-bold flex items-center text-slate-900 dark:text-white">
                <Scan className="mr-2 text-brand-500" /> Barcode Scanner
             </h2>
             {isCameraActive && (
               <span className="flex items-center text-xs text-red-500 animate-pulse font-bold">
                 <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div> LIVE FEED
               </span>
             )}
          </div>
          
          {isCameraActive ? (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video mb-4 flex items-center justify-center group ring-1 ring-gray-800">
               <video 
                 ref={videoRef} 
                 className="absolute inset-0 w-full h-full object-cover opacity-80" 
                 autoPlay 
                 playsInline 
                 muted
               ></video>
               
               {/* Scanning Overlay UI */}
               <div className={`absolute inset-0 border-2 z-10 m-8 rounded-lg pointer-events-none transition-colors duration-300 ${scanSuccess ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.5)] bg-green-500/10' : 'border-brand-500/50'}`}>
                 <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-brand-500 -mt-1 -ml-1"></div>
                 <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-brand-500 -mt-1 -mr-1"></div>
                 <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-brand-500 -mb-1 -ml-1"></div>
                 <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-brand-500 -mb-1 -mr-1"></div>
                 {!scanSuccess && <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>}
               </div>

               {/* Success Icon Overlay */}
               {scanSuccess && (
                 <div className="absolute inset-0 flex items-center justify-center z-20 animate-scaleIn">
                    <div className="bg-green-500 rounded-full p-4 shadow-lg">
                      <CheckCircle size={48} className="text-white" />
                    </div>
                 </div>
               )}

               {/* Simulation Button */}
               <button 
                 onClick={simulateScanDetection}
                 className="absolute bottom-8 z-30 bg-white/90 hover:bg-white text-black px-6 py-3 rounded-full font-bold text-sm shadow-lg transform transition-all hover:scale-105 active:scale-95 flex items-center cursor-pointer"
               >
                 <Zap size={18} className="mr-2 text-yellow-600 fill-yellow-600"/> Simulate Barcode Scan
               </button>

               <button 
                onClick={stopCamera}
                className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 transition-colors z-30"
               >
                 <Power size={20} />
               </button>
            </div>
          ) : (
            <div className="mb-4 space-y-4">
               {cameraError && (
                 <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center animate-fadeIn">
                   <AlertTriangle className="mr-2 flex-shrink-0" size={18} />
                   {cameraError}
                 </div>
               )}
               
               <div className="flex gap-2">
                 <button 
                  onClick={startCamera}
                  className="flex-1 flex items-center justify-center py-12 bg-gray-50 dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all border-2 border-dashed border-gray-300 dark:border-zinc-700 group"
                 >
                   <div className="text-center">
                      <div className="w-16 h-16 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                         <Camera size={32} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                      </div>
                      <span className="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 block">Launch Camera Scanner</span>
                      <span className="text-xs text-gray-400 mt-1">Supports Webcam & Mobile Cam</span>
                   </div>
                 </button>
               </div>
            </div>
          )}
          
          {/* Manual Entry */}
          <div className="flex gap-2 mt-4">
               <form onSubmit={handleManualScan} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <input
                      ref={inputRef}
                      type="text"
                      autoFocus
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-zinc-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
                      placeholder="Scan Barcode or Type Name..."
                    />
                    <Scan className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  </div>
                  <button type="submit" className="bg-brand-600 hover:bg-brand-500 text-white px-6 rounded-xl font-bold shadow-lg shadow-brand-500/20 transition-transform active:scale-95 text-sm">
                    ADD
                  </button>
               </form>
          </div>

          {/* System Messages */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg flex items-center text-sm font-medium animate-fadeIn ${
              message.type === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
              message.type === 'info' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {message.type === 'error' && <AlertTriangle size={16} className="mr-2" />}
              {message.type === 'success' && <CheckCircle size={16} className="mr-2" />}
              {message.type === 'info' && <Scan size={16} className="mr-2 animate-spin-slow" />}
              {message.text}
            </div>
          )}
        </div>

        {/* Quick Access Grid */}
        <div className="flex-1 bg-white dark:bg-dark-card p-6 rounded-2xl border border-gray-200 dark:border-dark-border shadow-sm overflow-hidden flex flex-col">
           <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Fast Moving Items</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar">
             {db.products.filter(p => user?.branchId ? p.branchId === user.branchId : true).slice(0, 8).map(p => (
               <button 
                key={p.id}
                onClick={() => handleProductScan(p)}
                disabled={p.stock <= 0}
                className="p-3 rounded-xl border border-gray-100 dark:border-dark-border hover:border-brand-500 dark:hover:border-brand-500 bg-gray-50 dark:bg-zinc-900/30 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
               >
                 <div className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate relative z-10">{p.name}</div>
                 <div className="flex justify-between items-end mt-2 relative z-10">
                    <span className="text-xs text-gray-500">{p.sku}</span>
                    <span className="text-sm font-bold text-brand-600">${p.price}</span>
                 </div>
                 {p.stock <= 0 && (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 dark:bg-zinc-900/80 z-20">
                     <span className="text-[10px] font-bold text-red-500 uppercase transform -rotate-12 border-2 border-red-500 px-1 rounded">Out of Stock</span>
                   </div>
                 )}
               </button>
             ))}
           </div>
        </div>
      </div>

      {/* RIGHT PANEL - Cart */}
      <div className="w-full lg:w-96 bg-white dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-dark-border shadow-xl flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-zinc-900/50 rounded-t-2xl">
          <div className="flex justify-between items-start">
             <div>
               <h2 className="font-bold text-xl text-gray-900 dark:text-white">Current Sale</h2>
               <p className="text-xs text-gray-400 mt-1 font-mono">#TX-{Date.now().toString().slice(-6)}</p>
             </div>
             <div className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>
                ONLINE
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50 min-h-[200px]">
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                   <Scan size={32} strokeWidth={1.5}/>
                </div>
                <p className="text-sm font-medium">Cart is empty</p>
                <p className="text-xs">Scan item or select from grid</p>
             </div>
          ) : (
            cart.map((item, idx) => {
              const isHighlighted = item.product.id === highlightedItemId;
              return (
                <div 
                  key={idx} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-500 group ${
                    isHighlighted 
                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700 scale-[1.02] shadow-md z-10' 
                    : 'bg-gray-50 dark:bg-zinc-900/30 border-transparent hover:border-gray-200 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <p className={`font-bold text-sm truncate ${isHighlighted ? 'text-brand-700 dark:text-brand-300' : 'text-gray-800 dark:text-gray-200'}`}>
                      {item.product.name}
                    </p>
                    <p className="text-xs text-gray-500">${item.product.price.toFixed(2)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-zinc-700 shadow-sm">
                    <button onClick={() => updateQty(idx, -1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-l-lg text-gray-500"><Minus size={12}/></button>
                    <span className="text-sm font-bold w-8 text-center text-gray-800 dark:text-gray-200">{item.qty}</span>
                    <button onClick={() => updateQty(idx, 1)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-r-lg text-gray-500"><Plus size={12}/></button>
                  </div>
                  <div className="ml-3 font-bold text-brand-600 w-16 text-right">
                    ${(item.product.price * item.qty).toFixed(2)}
                  </div>
                  <button onClick={() => setCart(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                     <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-gray-200 dark:border-dark-border bg-gray-50/50 dark:bg-zinc-900/50 rounded-b-2xl space-y-3">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span>${grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Tax (8%)</span>
            <span>${(grandTotal * 0.08).toFixed(2)}</span>
          </div>
          <div className="h-px bg-gray-200 dark:bg-zinc-700 my-2"></div>
          <div className="flex justify-between text-2xl font-black text-gray-900 dark:text-white">
            <span>Total</span>
            <span>${(grandTotal * 1.08).toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center py-4 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-300 disabled:dark:bg-zinc-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-brand-500/20 transition-all active:scale-[0.98] mt-4"
          >
            <Receipt className="mr-2 h-5 w-5" /> 
            {cart.length === 0 ? 'Scan Items to Pay' : 'Finalize & Print'}
          </button>
        </div>
      </div>
    </div>
  );
}