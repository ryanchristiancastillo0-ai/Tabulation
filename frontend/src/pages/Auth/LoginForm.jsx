// pages/AdminLogin.jsx
// Unchanged UI — only the fetch endpoint and storage keys are updated to match
// the new JWT auth system. Token is stored as 'adminToken', admin info as 'adminUser'
// so anything already reading those keys keeps working.

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
  Loader2,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {   // ← updated endpoint
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setPassword('');
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      if (data.token) {
        // Store using the same keys your existing code already reads
        if (data.token) {
  localStorage.setItem('adminToken', data.token);           // for apiClient
  localStorage.setItem('adminUser', JSON.stringify(data.admin)); // for anything reading adminUser
  localStorage.setItem('auth', JSON.stringify({             // for AuthContext
    token: data.token,
    admin: data.admin,
  }));
  navigate('/admin/dashboard');
}
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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 overflow-hidden"
      style={{ background: '#f7f9fb', fontFamily: "'Inter', sans-serif" }}
    >
      {/* Subtle dot-grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #bbcabf 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      {/* Ambient green glow — top-right */}
      <div
        className="absolute top-0 right-0 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Card */}
        <div
          className="bg-white rounded-2xl border p-8 md:p-10"
          style={{
            borderColor: '#e0e3e5',
            boxShadow: '0 8px 40px rgba(30,41,59,0.07)',
          }}
        >
          {/* Top row: back button + shield icon */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-lg transition-colors hover:bg-[#f2f4f6]"
              style={{ color: '#6c7a71' }}
            >
              <ArrowLeft size={20} />
            </button>

            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: '#f2f4f6', color: '#006c49' }}
            >
              <ShieldCheck size={22} strokeWidth={2.2} />
            </div>

            {/* Spacer to keep icon centered */}
            <div className="w-8" />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3"
              style={{
                background: 'rgba(16,185,129,0.08)',
                color: '#006c49',
              }}
            >
              Administrator Access
            </span>
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#191c1e' }}
            >
              Sign in to Dashboard
            </h2>
            <p className="text-sm mt-1" style={{ color: '#6c7a71' }}>
              Enter your credentials to manage the competition.
            </p>
          </div>

          {/* Divider */}
          <div className="h-px mb-7" style={{ background: '#e0e3e5' }} />

          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium mb-5 border"
              style={{
                background: '#fff1f2',
                borderColor: '#fecdd3',
                color: '#be123c',
              }}
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
              <div className="relative group">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6c7a71' }}
                />
                <input
                  type="email"
                  required
                  placeholder="admin@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: '#f2f4f6',
                    border: '1.5px solid #e0e3e5',
                    color: '#191c1e',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.background  = '#fff';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(16,185,129,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e3e5';
                    e.target.style.background  = '#f2f4f6';
                    e.target.style.boxShadow   = 'none';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label
                  className="block text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: '#3c4a42' }}
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-[11px] font-bold hover:underline transition-colors"
                  style={{ color: '#006c49' }}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#6c7a71' }}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: '#f2f4f6',
                    border: '1.5px solid #e0e3e5',
                    color: '#191c1e',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#10b981';
                    e.target.style.background  = '#fff';
                    e.target.style.boxShadow   = '0 0 0 3px rgba(16,185,129,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e0e3e5';
                    e.target.style.background  = '#f2f4f6';
                    e.target.style.boxShadow   = 'none';
                  }}
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

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-lg font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1"
              style={{
                background:  loading ? '#10b981' : '#006c49',
                boxShadow:   '0 4px 14px rgba(0,108,73,0.25)',
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#10b981'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#006c49'; }}
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-[11px] mt-6" style={{ color: '#6c7a71' }}>
            Secure access · Lumina Enterprise v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;