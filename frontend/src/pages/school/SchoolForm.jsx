import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Mail, Phone, MapPin, Upload, Check,
  AlertCircle, Loader, ArrowLeft, ChevronRight, Star,
  X, User, Lock, Eye, EyeOff,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const compressImage = (file) =>
  new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = url;
  });

const inp = (err) => ({
  width: '100%', boxSizing: 'border-box',
  padding: '10px 14px', borderRadius: 10, outline: 'none',
  border: `1.5px solid ${err ? '#fca5a5' : '#bbcabf'}`,
  background: '#fff', fontSize: 14, color: '#191c1e',
  fontFamily: 'inherit', transition: 'border-color .15s, box-shadow .15s',
});

const focusGreen = (e) => {
  e.target.style.borderColor = '#10b981';
  e.target.style.boxShadow   = '0 0 0 3px rgba(16,185,129,0.1)';
};
const blurReset = (hasErr) => (e) => {
  e.target.style.borderColor = hasErr ? '#fca5a5' : '#bbcabf';
  e.target.style.boxShadow   = 'none';
};

const Field = ({ label, icon: Icon, error, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{
      fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
      textTransform: 'uppercase', color: '#3c4a42',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      {Icon && <Icon size={12} color="#006c49" />}{label}
    </label>
    {children}
    {error && (
      <span style={{ fontSize: 11, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
        <AlertCircle size={11} />{error}
      </span>
    )}
  </div>
);

const StrengthBar = ({ pw }) => {
  if (!pw) return null;
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const colors = ['#e0e3e5', '#dc2626', '#f59e0b', '#10b981', '#006c49'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  return (
    <div style={{ marginTop: 5 }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i <= score ? colors[score] : '#e0e3e5', transition: 'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</span>
    </div>
  );
};

const ErrorModal = ({ message, onClose }) => (
  <div onClick={onClose} style={{
    position: 'fixed', inset: 0, zIndex: 999, padding: 24,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'fadeIn .15s ease',
  }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: '#fff', borderRadius: 20, border: '1px solid #fecdd3',
      padding: '40px 36px', maxWidth: 400, width: '100%',
      textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      animation: 'slideUp .2s ease',
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: '50%',
        background: '#fff1f2', border: '2px solid #fecdd3',
        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
      }}>
        <AlertCircle size={26} color="#dc2626" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#191c1e', marginBottom: 8 }}>Registration Failed</h3>
      <p style={{ fontSize: 14, color: '#3c4a42', lineHeight: 1.6, marginBottom: 24 }}>{message}</p>
      <button onClick={onClose} style={{
        width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
        background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}
        onMouseEnter={e => { e.currentTarget.style.background = '#b91c1c'; }}
        onMouseLeave={e => { e.currentTarget.style.background = '#dc2626'; }}
      >
        <X size={15} /> Dismiss
      </button>
    </div>
    <style>{`
      @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
      @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    `}</style>
  </div>
);

const PLANS = [
  { id: 'free',      label: 'Free',     desc: 'Up to 3 judges',       price: '₱0',   highlight: false },
  { id: 'standard', label: 'Standard', desc: 'Up to 10 judges',      price: '₱499', highlight: false },
  { id: 'premium',  label: 'Premium',  desc: 'Unlimited judges + AI', price: '₱999', highlight: true  },
];

const CreateSchoolForm = () => {
  const navigate = useNavigate();
  const logoRef  = useRef();

  const [form, setForm] = useState({
    school_name: '', school_email: '', school_phone: '',
    school_address: '', subscription_plan: 'free', school_logo: '',
    admin_name: '', admin_email: '', admin_password: '', admin_confirm: '',
  });

  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [status,      setStatus]      = useState('idle');
  const [errMsg,      setErrMsg]      = useState('');
  const [showModal,   setShowModal]   = useState(false);

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    set('school_logo', await compressImage(file));
  };

  const validate = () => {
    const e = {};
    if (!form.school_name.trim())  e.school_name  = 'School name is required.';
    if (!form.school_email.trim()) e.school_email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.school_email))
      e.school_email = 'Enter a valid email.';
    if (!form.admin_name.trim())   e.admin_name   = 'Admin name is required.';
    if (!form.admin_email.trim())  e.admin_email  = 'Admin email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email))
      e.admin_email = 'Enter a valid email.';
    if (!form.admin_password)      e.admin_password = 'Password is required.';
    else if (form.admin_password.length < 8)
      e.admin_password = 'Minimum 8 characters.';
    if (form.admin_password !== form.admin_confirm)
      e.admin_confirm = 'Passwords do not match.';
    return e;
  };

  /* ── Single POST — backend does:
       1) INSERT INTO schools → gets real insertId as school_id
       2) INSERT INTO admins with that school_id
     All inside one transaction so school_id is never 0.
  ── */
  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setStatus('saving');
    setErrMsg('');

    try {
      const res = await fetch(`${API_BASE}/schools/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name:       form.school_name,
          school_email:      form.school_email,
          school_phone:      form.school_phone,
          school_address:    form.school_address,
          subscription_plan: form.subscription_plan,
          school_logo:       form.school_logo,
          admin_name:        form.admin_name,
          admin_email:       form.admin_email,
          admin_password:    form.admin_password,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create school.');

      setStatus('success');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
      setShowModal(true);
    }
  };

  if (status === 'success') {
    return (
      <div style={{
        minHeight: '100vh', background: '#f7f9fb', fontFamily: "'Inter', sans-serif",
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #e0e3e5',
          padding: '56px 48px', maxWidth: 440, width: '100%', textAlign: 'center',
          boxShadow: '0 8px 40px rgba(0,108,73,0.08)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', background: '#d1fae5',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          }}>
            <Check size={28} color="#006c49" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#191c1e', marginBottom: 8 }}>School registered!</h2>
          <p style={{ fontSize: 14, color: '#3c4a42', marginBottom: 4, lineHeight: 1.6 }}>
            <strong>{form.school_name}</strong> has been successfully created.
          </p>
          <p style={{ fontSize: 13, color: '#9ca3af', marginBottom: 32, lineHeight: 1.6 }}>
            Admin account for <strong style={{ color: '#3c4a42' }}>{form.admin_name}</strong> is ready.
          </p>
          <button
            onClick={() => navigate('/login')}
            style={{
              width: '100%', padding: '12px 0', borderRadius: 10, border: 'none',
              background: '#10b981', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#059669'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#10b981'; }}
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7f9fb', fontFamily: "'Inter', sans-serif", color: '#191c1e' }}>

      {showModal && (
        <ErrorModal message={errMsg} onClose={() => { setShowModal(false); setStatus('idle'); }} />
      )}

      <nav style={{ background: '#fff', borderBottom: '1px solid #e0e3e5', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', padding: '0 48px',
          height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#006c49', letterSpacing: '-0.5px' }}>Veridict</div>
          <button onClick={() => navigate('/')} style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
            color: '#3c4a42', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            <ArrowLeft size={15} /> Back to Home
          </button>
        </div>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #006c49, #10b981)' }} />
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 0', textAlign: 'center' }}>
        <span style={{
          display: 'inline-block', padding: '4px 14px', marginBottom: 16,
          background: 'rgba(16,185,129,0.1)', color: '#006c49',
          borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          School Registration
        </span>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#191c1e', marginBottom: 10, letterSpacing: '-0.5px' }}>
          Create your school account
        </h1>
        <p style={{ fontSize: 15, color: '#3c4a42', lineHeight: 1.6 }}>
          Set up your competition portal in under 2 minutes.
        </p>
      </div>

      <div style={{ maxWidth: 680, margin: '32px auto 64px', padding: '0 24px' }}>
        <div style={{
          background: '#fff', borderRadius: 20, border: '1px solid #e0e3e5',
          boxShadow: '0 4px 24px rgba(0,108,73,0.06)', overflow: 'hidden',
        }}>

          {/* ══ School Info ══ */}
          <div style={{ padding: '32px 36px', borderBottom: '1px solid #e0e3e5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#006c49', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Building2 size={14} /> School Information
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <Field label="School Logo">
                <div
                  onClick={() => logoRef.current.click()}
                  style={{
                    border: `2px dashed ${form.school_logo ? '#10b981' : '#bbcabf'}`,
                    borderRadius: 12, padding: '18px 20px', cursor: 'pointer',
                    background: form.school_logo ? 'rgba(16,185,129,0.05)' : '#fafafa',
                    display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#10b981'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = form.school_logo ? '#10b981' : '#bbcabf'; }}
                >
                  {form.school_logo ? (
                    <>
                      <img src={form.school_logo} alt="logo" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#006c49' }}>Logo uploaded</div>
                        <div style={{ fontSize: 11, color: '#3c4a42' }}>Click to replace</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{
                        width: 48, height: 48, borderRadius: 8, background: '#f2f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e0e3e5',
                      }}>
                        <Upload size={18} color="#9ca3af" />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#3c4a42' }}>Click to upload logo</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>PNG, JPG, SVG — recommended 300×300px</div>
                      </div>
                    </>
                  )}
                </div>
                <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogo} />
              </Field>

              <Field label="School Name *" icon={Building2} error={errors.school_name}>
                <input style={inp(errors.school_name)} placeholder="e.g. University of Santo Tomas"
                  value={form.school_name} onChange={e => set('school_name', e.target.value)}
                  onFocus={focusGreen} onBlur={blurReset(errors.school_name)} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="School Email *" icon={Mail} error={errors.school_email}>
                  <input style={inp(errors.school_email)} placeholder="info@school.edu.ph" type="email"
                    value={form.school_email} onChange={e => set('school_email', e.target.value)}
                    onFocus={focusGreen} onBlur={blurReset(errors.school_email)} />
                </Field>
                <Field label="Phone Number" icon={Phone}>
                  <input style={inp(false)} placeholder="+63 912 345 6789"
                    value={form.school_phone} onChange={e => set('school_phone', e.target.value)}
                    onFocus={focusGreen} onBlur={blurReset(false)} />
                </Field>
              </div>

              <Field label="School Address" icon={MapPin}>
                <textarea style={{ ...inp(false), minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Street, City, Province, ZIP"
                  value={form.school_address} onChange={e => set('school_address', e.target.value)}
                  onFocus={focusGreen} onBlur={blurReset(false)} />
              </Field>
            </div>
          </div>

          {/* ══ Admin Account ══ */}
          <div style={{ padding: '32px 36px', borderBottom: '1px solid #e0e3e5' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#006c49', display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={14} /> Admin Account
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#006c49', background: 'rgba(16,185,129,0.1)', padding: '3px 10px', borderRadius: 999,
              }}>
                Linked to this school
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 24, lineHeight: 1.5 }}>
              This will be the primary admin login for your school's portal. Each school gets its own isolated admin account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Admin Name *" icon={User} error={errors.admin_name}>
                  <input style={inp(errors.admin_name)} placeholder="e.g. Juan dela Cruz"
                    value={form.admin_name} onChange={e => set('admin_name', e.target.value)}
                    onFocus={focusGreen} onBlur={blurReset(errors.admin_name)} />
                </Field>
                <Field label="Admin Email *" icon={Mail} error={errors.admin_email}>
                  <input style={inp(errors.admin_email)} placeholder="admin@school.edu.ph" type="email"
                    value={form.admin_email} onChange={e => set('admin_email', e.target.value)}
                    onFocus={focusGreen} onBlur={blurReset(errors.admin_email)} />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <Field label="Password *" icon={Lock} error={errors.admin_password}>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'}
                      style={{ ...inp(errors.admin_password), paddingRight: 40 }}
                      placeholder="Min. 8 characters" value={form.admin_password}
                      onChange={e => set('admin_password', e.target.value)}
                      onFocus={focusGreen} onBlur={blurReset(errors.admin_password)} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', color: '#9ca3af',
                    }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <StrengthBar pw={form.admin_password} />
                </Field>

                <Field label="Confirm Password *" icon={Lock} error={errors.admin_confirm}>
                  <div style={{ position: 'relative' }}>
                    <input type={showConfirm ? 'text' : 'password'}
                      style={{ ...inp(errors.admin_confirm), paddingRight: 40 }}
                      placeholder="Re-enter password" value={form.admin_confirm}
                      onChange={e => set('admin_confirm', e.target.value)}
                      onFocus={focusGreen} onBlur={blurReset(errors.admin_confirm)} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                      display: 'flex', alignItems: 'center', color: '#9ca3af',
                    }}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.admin_confirm && form.admin_password === form.admin_confirm && (
                    <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <Check size={11} /> Passwords match
                    </span>
                  )}
                </Field>
              </div>
            </div>
          </div>

          {/* ══ Plan ══ */}
          <div style={{ padding: '32px 36px', borderBottom: '1px solid #e0e3e5' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#006c49', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Star size={14} /> Subscription Plan
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {PLANS.map(plan => {
                const active = form.subscription_plan === plan.id;
                return (
                  <div key={plan.id} onClick={() => set('subscription_plan', plan.id)} style={{
                    padding: '16px 14px', borderRadius: 12, cursor: 'pointer', position: 'relative',
                    border: `2px solid ${active ? '#10b981' : '#e0e3e5'}`,
                    background: active ? 'rgba(16,185,129,0.06)' : '#fff',
                    boxShadow: active ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
                    transition: 'all .15s',
                  }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#bbcabf'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#e0e3e5'; }}
                  >
                    {plan.highlight && (
                      <div style={{
                        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                        background: '#006c49', color: '#fff', fontSize: 9, fontWeight: 800,
                        padding: '2px 10px', borderRadius: 999, letterSpacing: '0.1em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                      }}>Most Popular</div>
                    )}
                    <div style={{ fontSize: 18, fontWeight: 800, color: active ? '#006c49' : '#191c1e', marginBottom: 2 }}>{plan.price}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#006c49' : '#191c1e' }}>{plan.label}</div>
                    <div style={{ fontSize: 11, color: '#3c4a42', marginTop: 4 }}>{plan.desc}</div>
                    {active && (
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        width: 18, height: 18, borderRadius: '50%', background: '#10b981',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Check size={10} color="#fff" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══ Submit ══ */}
          <div style={{
            padding: '24px 36px', background: '#f7f9fb',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          }}>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>Fields marked * are required</span>
            <button onClick={handleSubmit} disabled={status === 'saving'} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 10, border: 'none',
              background: status === 'saving' ? '#9ca3af' : '#10b981',
              color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
              cursor: status === 'saving' ? 'not-allowed' : 'pointer',
              boxShadow: status === 'saving' ? 'none' : '0 4px 14px rgba(16,185,129,0.3)',
              transition: 'all .15s', flexShrink: 0,
            }}
              onMouseEnter={e => { if (status !== 'saving') e.currentTarget.style.background = '#059669'; }}
              onMouseLeave={e => { if (status !== 'saving') e.currentTarget.style.background = '#10b981'; }}
            >
              {status === 'saving'
                ? <><Loader size={15} style={{ animation: 'spin .8s linear infinite' }} /> Creating…</>
                : <>Create School <ChevronRight size={15} /></>
              }
            </button>
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default CreateSchoolForm;