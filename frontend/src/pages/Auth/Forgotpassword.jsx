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

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Reset failed.');
      }

      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input focus/blur handlers ── */
  const onFocus = (e) => {
    e.target.style.borderColor = '#10b981';
    e.target.style.background = '#fff';
    e.target.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
  };
  const onBlur = (e) => {
    e.target.style.borderColor = '#e0e3e5';
    e.target.style.background = '#f2f4f6';
    e.target.style.boxShadow = 'none';
  };

  const inputBase = {
    background: '#f2f4f6',
    border: '1.5px solid #e0e3e5',
    color: '#191c1e',
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden"
      style={{ background: '#f7f9fb', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Dot-grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #bbcabf 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#e0e3e5',
            boxShadow: '0 8px 40px rgba(30,41,59,0.07)',
          }}
        >
          {/* Top row */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/login')}
              className="p-2 -ml-2 rounded-lg transition-colors hover:bg-[#f2f4f6]"
              style={{ color: '#6c7a71' }}
            >
              <ArrowLeft size={20} />
            </button>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: '#f2f4f6', color: '#006c49' }}
            >
              <KeyRound size={22} strokeWidth={2.2} />
            </div>

            <div className="w-8" />
          </div>

          {!isSuccess ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <span
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ background: 'rgba(16,185,129,0.08)', color: '#006c49' }}
                >
                  Credential Recovery
                </span>
                <h2
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: '#191c1e' }}
                >
                  Reset Password
                </h2>
                <p className="text-sm mt-1" style={{ color: '#6c7a71' }}>
                  Update your administrator credentials below.
                </p>
              </div>

              {/* Divider */}
              <div className="h-px mb-7" style={{ background: '#e0e3e5' }} />

              {/* Error */}
              {error && (
                <div
                  className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium mb-5 border"
                  style={{ background: '#fff1f2', borderColor: '#fecdd3', color: '#be123c' }}
                >
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div>
                  <label
                    className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#3c4a42' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: '#6c7a71' }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="admin@email.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label
                    className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#3c4a42' }}
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: '#6c7a71' }}
                    />
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-11 py-3 rounded-lg text-sm outline-none transition-all"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded transition-colors"
                      style={{ color: '#6c7a71' }}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    className="block text-[11px] font-bold uppercase tracking-wider mb-1.5"
                    style={{ color: '#3c4a42' }}
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={15}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2"
                      style={{ color: '#6c7a71' }}
                    />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                      style={inputBase}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
                  style={{ background: '#006c49', boxShadow: '0 4px 14px rgba(0,108,73,0.25)' }}
                  onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#10b981'; }}
                  onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#006c49'; }}
                >
                  {loading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Update Password</span>
                      <RefreshCw size={16} />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            /* ── Success state ── */
            <div className="py-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(16,185,129,0.1)', color: '#006c49' }}
              >
                <CheckCircle2 size={38} />
              </div>
              <span
                className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#006c49' }}
              >
                Success
              </span>
              <h3
                className="text-xl font-bold tracking-tight"
                style={{ color: '#191c1e' }}
              >
                Password Updated!
              </h3>
              <p className="text-sm mt-2" style={{ color: '#6c7a71' }}>
                Redirecting you to sign in...
              </p>
              {/* Progress bar */}
              <div
                className="mt-6 h-1 rounded-full overflow-hidden"
                style={{ background: '#e0e3e5' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    background: '#10b981',
                    width: '100%',
                    animation: 'shrink 2s linear forwards',
                  }}
                />
              </div>
              <style>{`
                @keyframes shrink {
                  from { width: 100%; }
                  to   { width: 0%; }
                }
              `}</style>
            </div>
          )}

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: '#e0e3e5' }}>
            <button
              onClick={() => navigate('/login')}
              className="w-full text-[11px] font-bold uppercase tracking-wider transition-colors"
              style={{ color: '#6c7a71' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#006c49')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6c7a71')}
            >
              ← Back to Sign In
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: '#6c7a71' }}>
          Secure access · Lumina Enterprise v1.0
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;