import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Scale, 
  ArrowLeft, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';

const LoginForm = ({ role, onBack, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = role === 'admin';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      setError('Please enter your credentials.');
      return;
    }

    setError('');
    setLoading(true);

    // Simulated Authentication Delay
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onLogin({ username, role });
    } catch (err) {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-auto max-w-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[24px] p-8 md:p-10 border border-slate-200 shadow-xl shadow-slate-200/50">
        
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="group flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Portal
        </button>

        {/* Header Icon */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 
          ${isAdmin ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isAdmin ? <ShieldCheck size={30} strokeWidth={2.5} /> : <Scale size={30} strokeWidth={2.5} />}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          {isAdmin ? 'Admin Access' : 'Judge Access'}
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-8">
          Authorized personnel only. Please enter your credentials to access the 
          {isAdmin ? ' management dashboard' : ' scoring panel'}.
        </p>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 animate-in zoom-in-95">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Username Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder={isAdmin ? "admin_id" : "judge_01"}
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type={showPw ? "text" : "password"}
                className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[15px] focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                disabled={loading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-lg
              ${isAdmin 
                ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-200' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}
          >
            {loading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 font-mono mt-8 uppercase tracking-widest">
          Secure Encryption Active
        </p>
      </div>
    </div>
  );
};

export default LoginForm;