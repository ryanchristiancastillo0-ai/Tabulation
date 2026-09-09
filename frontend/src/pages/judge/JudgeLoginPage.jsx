import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { USALoader } from '../../components/index';
import { setActiveSchoolId } from '../../utils/getSchoolId';
import { setJudgeToken, getJudgePageUrl } from '../../utils/judge';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const LOGO_SRC = '/img/USAL_LOGO.png';
const BG_IMAGE_SRC = '/img/right-panel.png';

const JudgeLoginPage = () => {
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
      const response = await fetch(`${API_BASE}/auth/judge-login`, {
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
        const schoolId = data.school?.id;
        localStorage.setItem('judgeToken', data.token);
        setJudgeToken(schoolId, data.token);
        localStorage.setItem('judgeSchool', JSON.stringify(data.school));
        localStorage.setItem('auth', JSON.stringify({
          token: data.token,
          school: data.school,
          role: 'judge',
        }));
        setActiveSchoolId(schoolId);
        navigate(getJudgePageUrl('/judge', schoolId));
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
      className="relative h-screen w-full flex overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {loading && (
        <div className="fixed inset-0 z-[999]">
          <USALoader fullScreen prompt="Signing in…" />
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Left: image panel (hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/2 relative h-full bg-[#1B4332]">
        <img
          src={BG_IMAGE_SRC}
          alt="Judge scoring"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Theme-matching gradient wash so the panel reads as one piece with the green/gold palette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(18,48,36,0.15) 0%, rgba(18,48,36,0.35) 55%, rgba(10,26,20,0.9) 100%)',
          }}
        />

        {/* Subtle top-down vignette for edge cohesion */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(120% 90% at 50% 0%, rgba(0,0,0,0) 40%, rgba(10,26,20,0.55) 100%)',
          }}
        />

        {/* Thin gold border seam separating the two panels */}
        <div className="absolute right-0 top-0 h-full w-[3px] bg-gradient-to-b from-[#C9A227]/0 via-[#C9A227]/70 to-[#C9A227]/0" />

        <div className="relative z-10 h-full flex flex-col justify-end p-12 xl:p-16">
          {/* Bottom copy block */}
          <div>
            <div className="w-14 h-[3px] bg-[#C9A227] mb-6" />
            <h2
              className="text-white text-3xl xl:text-4xl font-bold leading-tight mb-4"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Expert Evaluation<br />Made Seamless
            </h2>
            <p className="text-white/75 text-sm max-w-md">
              Score contestants in real time with a distraction-free judging environment.
            </p>
          </div>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 h-full flex items-center justify-center bg-[#FBFCF9] p-6 sm:p-10 relative overflow-y-auto">
        {/* Faint decorative corner accents to echo the theme without competing with the form */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-64 h-64 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at top right, #1B4332 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 w-64 h-64 opacity-[0.04]"
          style={{ background: 'radial-gradient(circle at bottom left, #C9A227 0%, transparent 70%)' }}
        />

        <div className="w-full max-w-[420px] xl:max-w-[480px] 2xl:max-w-[560px] relative z-10 my-auto">
          {/* Top row: back button + logo */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 rounded-sm transition-colors hover:bg-[#F3F6F1] text-[#4B5A4D]"
            >
              <ArrowLeft size={20} />
            </button>

            <img
              src={LOGO_SRC}
              alt="Logo"
              className="h-14 w-14 object-contain"
            />

            <div className="w-8" />
          </div>

          {/* Heading */}
          <div className="mb-7">
            <span className="inline-block px-3 py-1 bg-[#1B4332]/10 text-[#1B4332] text-[10px] font-bold uppercase tracking-widest mb-3 rounded-sm border border-[#1B4332]/20">
              Judge Access
            </span>
            <h2
              className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-[#14201A]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Sign in to the Judging Portal
            </h2>
            <p className="text-sm mt-1 text-[#4B5A4D]">
              Enter the school email and your judge password to start scoring.
            </p>
          </div>

          <div className="h-px mb-7 bg-[#E1E8DE]" />

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-sm text-xs font-medium mb-5 border border-red-200 bg-red-50 text-red-700">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                School Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7A71]" />
                <input
                  type="email"
                  required
                  placeholder="info@school.edu.ph"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-3 rounded-sm text-sm outline-none transition-all border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                Judge Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7A71]" />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  disabled={loading}
                  className="w-full pl-10 pr-11 py-3 rounded-sm text-sm outline-none transition-all border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-sm text-[#6C7A71]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-sm font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1 bg-[#1B4332] hover:bg-[#123024] tracking-wide"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Sign In to Judge</span>
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

export default JudgeLoginPage;