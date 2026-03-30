import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  ArrowLeft, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState(''); 
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Ensure this matches your Vite config or fallback to your local port
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Correct endpoint based on your server.js: app.use('/api/admin', authRoutes)
      const response = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // If password mismatch or user not found
        setPassword(''); // Clear password field on failure
        throw new Error(data.error || 'Login failed. Please try again.');
      }
      
      if (data.token) {
        // Store token for your 'protect' middleware to use later
        localStorage.setItem('adminToken', data.token);
        // Optional: store basic user info if needed
        localStorage.setItem('adminUser', JSON.stringify(data.admin)); 
        
        navigate('/admin/dashboard');
      } else {
        throw new Error('No token received from server.');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden">
      {/* Background stays the same */}
      <div className="absolute inset-0 pointer-events-none opacity-30" 
           style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="relative z-10 w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-slate-200 shadow-xl">
          
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck size={22} strokeWidth={2.5} />
            </div>
            <div className="w-8" />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin Login</h2>
            <p className="text-xs text-slate-500 mt-1">Enter credentials to manage dashboard</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 p-3 rounded-lg text-xs font-medium mb-4">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1">
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <button 
                  onClick={() => navigate('/forgot-password')}
                  type="button" 
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-2 shadow-md bg-slate-900 hover:bg-slate-800"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span className="text-sm">Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;