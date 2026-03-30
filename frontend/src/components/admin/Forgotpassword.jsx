import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KeyRound, ArrowLeft, Mail, Lock, Eye, 
  EyeOff, RefreshCw, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Front-end Validation
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/admin/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Reset failed.');
      }

      // Show success state
      setIsSuccess(true);
      
      // Wait 2 seconds so they can see the checkmark, then go to login
      setTimeout(() => navigate('/login'), 2000); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#f8fafc] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30" 
           style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      
      <div className="relative z-10 w-full max-w-[380px] animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-white rounded-[20px] p-6 md:p-8 border border-slate-200 shadow-xl text-center">
          
          <div className="flex items-center justify-between mb-5">
            <button 
              onClick={() => navigate('/login')}
              className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <KeyRound size={22} strokeWidth={2.5} />
            </div>
            <div className="w-8" />
          </div>

          {!isSuccess ? (
            <>
              <div className="mb-5 text-center">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">Update admin credentials</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600 p-2.5 rounded-lg text-xs font-medium mb-4 text-left">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 ml-1">Email Address</label>
                  <div className="relative group">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="admin@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 ml-1">New Password</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showPw ? "text" : "password"}
                      required
                      className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPw(!showPw)}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1 ml-1">Confirm Password</label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70 mt-3 shadow-md bg-slate-900 hover:bg-slate-800"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <><span className="text-sm">Update Password</span> <RefreshCw size={16} /></>}
                </button>
              </form>
            </>
          ) : (
            <div className="py-8 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Password Updated!</h3>
              <p className="text-sm text-slate-500 mt-2">Redirecting you to login...</p>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button 
              onClick={() => navigate('/login')}
              className="text-[11px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-tight"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;