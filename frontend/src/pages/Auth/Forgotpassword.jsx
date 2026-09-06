import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Mail, MessageSquareCode, Lock, Eye, EyeOff,
  RefreshCw, AlertCircle, Loader2, CheckCircle2, Send, ShieldCheck
} from 'lucide-react';

const BG_IMAGE_SRC = 'https://images.unsplash.com/photo-1741061966372-8e7e2c221de7?fm=jpg&q=80&w=1600&auto=format&fit=crop';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

  const stepData = {
    1: {
      badge: 'Credential Recovery',
      title: 'Forgot Password',
      subtitle: 'Enter your account email and we will send a verification code.',
      description: 'Reset your administrator password securely and get back to managing your competition.',
    },
    2: {
      badge: 'Verify Identity',
      title: 'Enter Verification Code',
      subtitle: `A 6-digit code was sent to ${email || 'your email'}.`,
    },
    3: {
      badge: 'Create New Password',
      title: 'Choose a New Password',
      subtitle: 'Enter the new password you want to use for your account.',
    },
  };

  const requestCode = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/admin/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send the code.');
      }

      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    try {
      await requestCode();
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      await requestCode();
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/admin/verify-reset-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed.');
      }

      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
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
        body: JSON.stringify({ resetToken, newPassword }),
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

  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError('');
    } else {
      navigate('/login');
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      {/* Left: image panel (hidden on small screens) */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={BG_IMAGE_SRC}
          alt="University campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(27,67,50,0.15) 0%, rgba(18,48,36,0.65) 100%)' }}
        />
        <div className="relative z-10 h-full flex flex-col justify-end p-12 xl:p-16">
          <div className="w-14 h-[3px] bg-[#C9A227] mb-6" />
          <h2
            className="text-white text-3xl xl:text-4xl font-bold leading-tight mb-4"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Recover Access<br />To Your Workspace
          </h2>
          <p className="text-white/80 text-sm max-w-md">
            {isSuccess
              ? 'Your password was updated successfully.'
              : stepData[step].description || stepData[step].subtitle}
          </p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-[#FBFCF9] p-6 sm:p-10">
        <div className="w-full max-w-[420px] xl:max-w-[480px] 2xl:max-w-[560px]">
          {/* Top row: back button + logo */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={goBack}
              className="p-2 -ml-2 rounded-sm transition-colors hover:bg-[#F3F6F1] text-[#4B5A4D]"
            >
              <ArrowLeft size={20} />
            </button>

            <img
              src="/img/USAL_LOGO.png"
              alt="Logo"
              className="h-14 w-14 object-contain"
            />

            <div className="w-8" />
          </div>

          {!isSuccess ? (
            <>
              {/* Heading */}
              <div className="mb-7">
                <span className="inline-block px-3 py-1 bg-[#F3F6F1] text-[#C9A227] text-[10px] font-bold uppercase tracking-widest mb-3 rounded-sm border border-[#C9A227]/30">
                  {stepData[step].badge}
                </span>
                <h2
                  className="text-xl sm:text-2xl xl:text-3xl font-bold tracking-tight text-[#14201A]"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {stepData[step].title}
                </h2>
                <p className="text-sm mt-1 text-[#4B5A4D]">
                  {stepData[step].subtitle}
                </p>
              </div>

              <div className="h-px mb-7 bg-[#E1E8DE]" />

              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-7">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div
                      className={`flex items-center justify-center rounded-full transition-all ${
                        step >= s
                          ? 'bg-[#1B4332] text-white'
                          : 'bg-[#E1E8DE] text-[#6C7A71]'
                      }`}
                      style={{ width: 26, height: 26 }}
                    >
                      {step > s ? <CheckCircle2 size={14} /> : <span className="text-xs font-bold">{s}</span>}
                    </div>
                    {s < 3 && (
                      <div className={`h-0.5 flex-1 rounded-sm ${step > s ? 'bg-[#1B4332]' : 'bg-[#E1E8DE]'}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-sm text-xs font-medium mb-5 border border-red-200 bg-red-50 text-red-700">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* STEP 1: Email */}
              {step === 1 && (
                <form onSubmit={handleSendCode} className="space-y-5">
                  <div className="p-4 rounded-sm flex items-start gap-3 border border-[#E1E8DE] bg-[#F3F6F1]">
                    <ShieldCheck size={18} className="text-[#1B4332] shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-[#4B5A4D]">
                      We'll email a one-time verification code to confirm this account belongs to you.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7A71]" />
                      <input
                        type="email"
                        required
                        placeholder="admin@email.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 rounded-sm text-sm outline-none transition-all border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-sm font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1 bg-[#1B4332] hover:bg-[#123024] tracking-wide"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <span>Send Code</span>
                        <Send size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Code */}
              {step === 2 && (
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="p-4 rounded-sm flex items-start gap-3 border border-[#E1E8DE] bg-[#F3F6F1]">
                    <MessageSquareCode size={18} className="text-[#1B4332] shrink-0 mt-0.5" />
                    <p className="text-xs leading-relaxed text-[#4B5A4D]">
                      Check your inbox for the 6-digit code. It expires in 10 minutes.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      placeholder="000000"
                      value={code}
                      onChange={(e) => { setCode(e.target.value.replace(/\D/g, '')); setError(''); }}
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-sm text-center text-lg font-bold tracking-[0.5em] text-sm outline-none transition-all border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-sm font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1 bg-[#1B4332] hover:bg-[#123024] tracking-wide"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <span>Verify Code</span>
                        <ShieldCheck size={16} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={loading}
                    className="w-full py-2.5 rounded-sm text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-[#1B4332] hover:bg-[#F3F6F1] disabled:opacity-60"
                  >
                    <RefreshCw size={13} />
                    Resend Code
                  </button>
                </form>
              )}

              {/* STEP 3: New password */}
              {step === 3 && (
                <form onSubmit={handleUpdatePassword} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7A71]" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
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

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-[#4B5A4D]">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6C7A71]" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        disabled={loading}
                        className="w-full pl-10 pr-4 py-3 rounded-sm text-sm outline-none transition-all border border-[#BBCABB] bg-[#F3F6F1] text-[#14201A] focus:border-[#1B4332] focus:bg-white focus:ring-2 focus:ring-[#1B4332]/15"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-sm font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-60 mt-1 bg-[#1B4332] hover:bg-[#123024] tracking-wide"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : (
                      <>
                        <span>Update Password</span>
                        <RefreshCw size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          ) : (
            /* ── Success state ── */
            <div className="py-6 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                style={{ background: 'rgba(45,106,79,0.12)', color: '#1B4332' }}
              >
                <CheckCircle2 size={38} />
              </div>
              <span className="inline-block px-3 py-1 bg-[#F3F6F1] text-[#C9A227] text-[10px] font-bold uppercase tracking-widest mb-3 rounded-sm border border-[#C9A227]/30">
                Success
              </span>
              <h3
                className="text-xl font-bold tracking-tight text-[#14201A]"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                Password Updated!
              </h3>
              <p className="text-sm mt-2 text-[#6C7A71]">
                Redirecting you to sign in...
              </p>
              {/* Progress bar */}
              <div className="mt-6 h-1 rounded-sm overflow-hidden" style={{ background: '#E1E8DE' }}>
                <div
                  className="h-full rounded-sm"
                  style={{
                    background: '#C9A227',
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
          <div className="mt-6 pt-5 border-t border-[#E1E8DE]">
            <button
              onClick={() => navigate('/login')}
              className="w-full text-[11px] font-bold uppercase tracking-wider transition-colors text-[#6C7A71] hover:text-[#1B4332]"
            >
              ← Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;