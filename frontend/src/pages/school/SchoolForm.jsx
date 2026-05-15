import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Mail, Phone, MapPin, Upload, Check,
  AlertCircle, Loader, ArrowLeft, ChevronRight, Star,
  X, User, Lock, Eye, EyeOff, ChevronDown,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ── Image compression ─────────────────────────────────────────────
const compressImage = (file) => {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      const MAX = 300;
      const scale = Math.min(MAX / img.width, MAX / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };

    img.src = url;
  });
};

// ── Field wrapper ─────────────────────────────────────────────────
const Field = ({ label, icon: Icon, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold tracking-widest uppercase text-slate-600 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="text-emerald-700" />}
      {label}
    </label>
    {children}
    {error && (
      <span className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle size={11} />
        {error}
      </span>
    )}
  </div>
);

// ── Input class helper ────────────────────────────────────────────
const inputCls = (hasError) =>
  [
    'w-full px-3.5 py-2.5 rounded-xl outline-none text-sm text-slate-900 font-[inherit] transition-all duration-150',
    'border bg-white',
    hasError
      ? 'border-red-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
      : 'border-slate-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100',
  ].join(' ');

// ── Location dropdown ─────────────────────────────────────────────
const LocationSelect = ({
  label, icon: Icon, value, onChange,
  options, loading, disabled, placeholder, error,
}) => (
  <Field label={label} icon={Icon} error={error}>
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled || loading}
        className={[
          inputCls(error),
          'appearance-none pr-9 cursor-pointer',
          (disabled || loading) ? 'cursor-not-allowed opacity-55' : '',
          !value ? 'text-slate-400' : 'text-slate-900',
        ].join(' ')}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>{opt.name}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 flex items-center">
        {loading
          ? <Loader size={14} className="animate-spin" />
          : <ChevronDown size={14} />
        }
      </div>
    </div>
  </Field>
);

// ── Password strength bar ─────────────────────────────────────────
const StrengthBar = ({ pw }) => {
  if (!pw) return null;

  const checks = [
    pw.length >= 8,
    /[A-Z]/.test(pw),
    /[0-9]/.test(pw),
    /[^A-Za-z0-9]/.test(pw),
  ];
  const score = checks.filter(Boolean).length;

  const colorMap = {
    0: 'bg-slate-200',
    1: 'bg-red-500',
    2: 'bg-amber-400',
    3: 'bg-emerald-400',
    4: 'bg-emerald-700',
  };
  const labelMap = { 0: '', 1: 'Weak', 2: 'Fair', 3: 'Good', 4: 'Strong' };
  const textMap  = { 0: '', 1: 'text-red-600', 2: 'text-amber-500', 3: 'text-emerald-500', 4: 'text-emerald-700' };

  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={[
              'flex-1 h-0.5 rounded-full transition-all duration-200',
              i <= score ? colorMap[score] : 'bg-slate-200',
            ].join(' ')}
          />
        ))}
      </div>
      <span className={`text-xs font-semibold ${textMap[score]}`}>{labelMap[score]}</span>
    </div>
  );
};

// ── Error modal ───────────────────────────────────────────────────
const ErrorModal = ({ message, onClose }) => (
  <div
    onClick={onClose}
    className="fixed inset-0 z-[999] p-6 bg-black/40 flex items-center justify-center animate-[fadeIn_.15s_ease]"
  >
    <div
      onClick={(e) => e.stopPropagation()}
      className="bg-white rounded-2xl border border-rose-200 p-10 max-w-sm w-full text-center shadow-2xl animate-[slideUp_.2s_ease]"
    >
      <div className="w-15 h-15 rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center mx-auto mb-5">
        <AlertCircle size={26} className="text-red-600" />
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 mb-2">Registration Failed</h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border-none bg-red-600 hover:bg-red-700 text-white text-sm font-bold cursor-pointer font-[inherit] flex items-center justify-center gap-2 transition-colors duration-150"
      >
        <X size={15} /> Dismiss
      </button>
    </div>
    <style>{`
      @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
      @keyframes slideUp { from { transform: translateY(16px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
    `}</style>
  </div>
);

// ── Plans ─────────────────────────────────────────────────────────
const PLANS = [
  { id: 'free',      label: 'Free',     desc: 'Up to 3 judges',       price: '₱0',   highlight: false },
  { id: 'standard', label: 'Standard', desc: 'Up to 10 judges',      price: '₱499', highlight: false },
  { id: 'premium',  label: 'Premium',  desc: 'Unlimited judges + AI', price: '₱999', highlight: true  },
];

// ── Location hook ─────────────────────────────────────────────────
const useLocationData = () => {
  const [regions,   setRegions]   = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities,    setCities]    = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [loadingR, setLoadingR] = useState(false);
  const [loadingP, setLoadingP] = useState(false);
  const [loadingC, setLoadingC] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const [selectedRegion,   setSelectedRegion]   = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity,     setSelectedCity]     = useState('');
  const [selectedBarangay, setSelectedBarangay] = useState('');

  const regionName   = regions.find((r) => r.code === selectedRegion)?.name   || '';
  const provinceName = provinces.find((p) => p.code === selectedProvince)?.name || '';
  const cityName     = cities.find((c) => c.code === selectedCity)?.name       || '';
  const barangayName = barangays.find((b) => b.code === selectedBarangay)?.name || '';

  const fullAddress = [barangayName, cityName, provinceName, regionName]
    .filter(Boolean)
    .join(', ');

  // Fetch regions on mount
  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingR(true);
      try {
        const response = await fetch(`${API_BASE}/locations/regions`);
        const data = await response.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setRegions(sorted);
      } catch (err) {
        console.error('regions error:', err);
      } finally {
        setLoadingR(false);
      }
    };

    fetchRegions();
  }, []);

  // Fetch provinces when region changes
  useEffect(() => {
    if (!selectedRegion) {
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      return;
    }

    const fetchProvinces = async () => {
      setLoadingP(true);
      setProvinces([]);
      setCities([]);
      setBarangays([]);
      setSelectedProvince('');
      setSelectedCity('');
      setSelectedBarangay('');

      try {
        const response = await fetch(`${API_BASE}/locations/provinces/${selectedRegion}`);
        const data = await response.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setProvinces(sorted);
      } catch (err) {
        console.error('provinces error:', err);
      } finally {
        setLoadingP(false);
      }
    };

    fetchProvinces();
  }, [selectedRegion]);

  // Fetch cities when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setCities([]);
      setBarangays([]);
      return;
    }

    const fetchCities = async () => {
      setLoadingC(true);
      setCities([]);
      setBarangays([]);
      setSelectedCity('');
      setSelectedBarangay('');

      try {
        const response = await fetch(
          `https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`
        );
        const data = await response.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setCities(sorted);
      } catch (err) {
        console.error('cities error:', err);
      } finally {
        setLoadingC(false);
      }
    };

    fetchCities();
  }, [selectedProvince]);

  // Fetch barangays when city changes
  useEffect(() => {
    if (!selectedCity) {
      setBarangays([]);
      return;
    }

    const fetchBarangays = async () => {
      setLoadingB(true);
      setBarangays([]);
      setSelectedBarangay('');

      try {
        const response = await fetch(`${API_BASE}/locations/barangays/${selectedCity}`);
        const data = await response.json();
        const sorted = Array.isArray(data)
          ? data.sort((a, b) => a.name.localeCompare(b.name))
          : [];
        setBarangays(sorted);
      } catch (err) {
        console.error('barangays error:', err);
      } finally {
        setLoadingB(false);
      }
    };

    fetchBarangays();
  }, [selectedCity]);

  return {
    regions, provinces, cities, barangays,
    loadingR, loadingP, loadingC, loadingB,
    selectedRegion,   setSelectedRegion,
    selectedProvince, setSelectedProvince,
    selectedCity,     setSelectedCity,
    selectedBarangay, setSelectedBarangay,
    fullAddress,
    regionName, provinceName, cityName, barangayName,
  };
};

// ── Main Form ─────────────────────────────────────────────────────
const CreateSchoolForm = () => {
  const navigate = useNavigate();
  const logoRef  = useRef();
  const loc      = useLocationData();

  const [form, setForm] = useState({
    school_name:       '',
    school_email:      '',
    school_phone:      '',
    subscription_plan: 'free',
    school_logo:       '',
    admin_name:        '',
    admin_email:       '',
    admin_password:    '',
    admin_confirm:     '',
  });

  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors,      setErrors]      = useState({});
  const [status,      setStatus]      = useState('idle');   // idle | saving | success | error
  const [errMsg,      setErrMsg]      = useState('');
  const [showModal,   setShowModal]   = useState(false);

  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const handleLogo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setField('school_logo', compressed);
  };

  const validate = () => {
    const e = {};

    if (!form.school_name.trim())
      e.school_name = 'School name is required.';

    if (!form.school_email.trim())
      e.school_email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.school_email))
      e.school_email = 'Enter a valid email.';

    if (!loc.selectedRegion)   e.region   = 'Please select a region.';
    if (!loc.selectedProvince) e.province = 'Please select a province.';
    if (!loc.selectedCity)     e.city     = 'Please select a city / municipality.';
    if (!loc.selectedBarangay) e.barangay = 'Please select a barangay.';

    if (!form.admin_name.trim())
      e.admin_name = 'Admin name is required.';

    if (!form.admin_email.trim())
      e.admin_email = 'Admin email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email))
      e.admin_email = 'Enter a valid email.';

    if (!form.admin_password)
      e.admin_password = 'Password is required.';
    else if (form.admin_password.length < 8)
      e.admin_password = 'Minimum 8 characters.';

    if (form.admin_password !== form.admin_confirm)
      e.admin_confirm = 'Passwords do not match.';

    return e;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setStatus('saving');
    setErrMsg('');

    try {
      const response = await fetch(`${API_BASE}/schools/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_name:       form.school_name,
          school_email:      form.school_email,
          school_phone:      form.school_phone,
          school_address:    loc.fullAddress,
          subscription_plan: form.subscription_plan,
          school_logo:       form.school_logo,
          admin_name:        form.admin_name,
          admin_email:       form.admin_email,
          admin_password:    form.admin_password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to create school.');
      }

      setStatus('success');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
      setShowModal(true);
    }
  };

  // ── Success screen ────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-14 max-w-md w-full text-center shadow-[0_8px_40px_rgba(0,108,73,0.08)]">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <Check size={28} className="text-emerald-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">School registered!</h2>
          <p className="text-sm text-slate-600 mb-1 leading-relaxed">
            <strong>{form.school_name}</strong> has been successfully created.
          </p>
          <p className="text-xs text-slate-400 mb-2 leading-relaxed">
            Admin account for{' '}
            <strong className="text-slate-600">{form.admin_name}</strong> is ready.
          </p>
          {loc.fullAddress && (
            <p className="text-xs text-slate-400 mb-8 leading-relaxed bg-slate-50 rounded-lg px-3.5 py-2 border border-slate-200 flex items-center justify-center gap-1.5">
              <MapPin size={11} />
              {loc.fullAddress}
            </p>
          )}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-xl border-none bg-emerald-400 hover:bg-emerald-600 text-white text-sm font-bold cursor-pointer font-[inherit] shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-colors duration-150"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {showModal && (
        <ErrorModal
          message={errMsg}
          onClose={() => { setShowModal(false); setStatus('idle'); }}
        />
      )}

      {/* Nav */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-12 h-17 flex items-center justify-between" style={{ height: 68 }}>
          <div className="text-2xl font-extrabold text-emerald-700 tracking-tight">Veridict</div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 bg-transparent border-none cursor-pointer font-[inherit] hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={15} /> Back to Home
          </button>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-emerald-700 to-emerald-400" />
      </nav>

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-12 pb-0 text-center">
        <span className="inline-block px-3.5 py-1 mb-4 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold tracking-widest uppercase">
          School Registration
        </span>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2.5 tracking-tight">
          Create your school account
        </h1>
        <p className="text-base text-slate-600 leading-relaxed">
          Set up your competition portal in under 2 minutes.
        </p>
      </div>

      <div className="max-w-2xl mx-auto mt-8 mb-16 px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(0,108,73,0.06)] overflow-hidden">

          {/* ══ School Info ══ */}
          <div className="px-9 py-8 border-b border-slate-200">
            <div className="text-sm font-bold text-emerald-700 mb-6 flex items-center gap-2">
              <Building2 size={14} /> School Information
            </div>

            <div className="flex flex-col gap-5">

              {/* Logo upload */}
              <Field label="School Logo">
                <div
                  onClick={() => logoRef.current.click()}
                  className={[
                    'border-2 border-dashed rounded-xl p-4 cursor-pointer flex items-center gap-3.5 transition-all duration-200',
                    form.school_logo
                      ? 'border-emerald-400 bg-emerald-50/50'
                      : 'border-slate-300 bg-slate-50 hover:border-emerald-400',
                  ].join(' ')}
                >
                  {form.school_logo ? (
                    <>
                      <img
                        src={form.school_logo}
                        alt="logo"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <div className="text-sm font-bold text-emerald-700">Logo uploaded</div>
                        <div className="text-xs text-slate-600">Click to replace</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                        <Upload size={18} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-600">Click to upload logo</div>
                        <div className="text-xs text-slate-400">PNG, JPG, SVG — recommended 300×300px</div>
                      </div>
                    </>
                  )}
                </div>
                <input
                  ref={logoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogo}
                />
              </Field>

              <Field label="School Name *" icon={Building2} error={errors.school_name}>
                <input
                  className={inputCls(errors.school_name)}
                  placeholder="e.g. University of Santo Tomas"
                  value={form.school_name}
                  onChange={(e) => setField('school_name', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="School Email *" icon={Mail} error={errors.school_email}>
                  <input
                    className={inputCls(errors.school_email)}
                    placeholder="info@school.edu.ph"
                    type="email"
                    value={form.school_email}
                    onChange={(e) => setField('school_email', e.target.value)}
                  />
                </Field>
                <Field label="Phone Number" icon={Phone}>
                  <input
                    className={inputCls(false)}
                    placeholder="+63 912 345 6789"
                    value={form.school_phone}
                    onChange={(e) => setField('school_phone', e.target.value)}
                  />
                </Field>
              </div>

              {/* Address — 4 cascading dropdowns */}
              <div>
                <div className="text-xs font-bold tracking-widest uppercase text-slate-600 flex items-center gap-1.5 mb-3">
                  <MapPin size={12} className="text-emerald-700" /> School Address *
                </div>

                {loc.fullAddress && (
                  <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200/60 rounded-lg px-3 py-1.5 mb-3 flex items-center gap-1.5">
                    <Check size={12} />
                    {loc.fullAddress}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <LocationSelect
                    label="Region *"
                    icon={MapPin}
                    value={loc.selectedRegion}
                    onChange={(e) => {
                      loc.setSelectedRegion(e.target.value);
                      setErrors((prev) => ({ ...prev, region: '' }));
                    }}
                    options={loc.regions}
                    loading={loc.loadingR}
                    disabled={false}
                    placeholder="Select Region"
                    error={errors.region}
                  />
                  <LocationSelect
                    label="Province *"
                    icon={MapPin}
                    value={loc.selectedProvince}
                    onChange={(e) => {
                      loc.setSelectedProvince(e.target.value);
                      setErrors((prev) => ({ ...prev, province: '' }));
                    }}
                    options={loc.provinces}
                    loading={loc.loadingP}
                    disabled={!loc.selectedRegion}
                    placeholder={loc.selectedRegion ? 'Select Province' : 'Select a region first'}
                    error={errors.province}
                  />
                  <LocationSelect
                    label="City / Municipality *"
                    icon={MapPin}
                    value={loc.selectedCity}
                    onChange={(e) => {
                      loc.setSelectedCity(e.target.value);
                      setErrors((prev) => ({ ...prev, city: '' }));
                    }}
                    options={loc.cities}
                    loading={loc.loadingC}
                    disabled={!loc.selectedProvince}
                    placeholder={loc.selectedProvince ? 'Select City / Municipality' : 'Select a province first'}
                    error={errors.city}
                  />
                  <LocationSelect
                    label="Barangay *"
                    icon={MapPin}
                    value={loc.selectedBarangay}
                    onChange={(e) => {
                      loc.setSelectedBarangay(e.target.value);
                      setErrors((prev) => ({ ...prev, barangay: '' }));
                    }}
                    options={loc.barangays}
                    loading={loc.loadingB}
                    disabled={!loc.selectedCity}
                    placeholder={loc.selectedCity ? 'Select Barangay' : 'Select a city first'}
                    error={errors.barangay}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* ══ Admin Account ══ */}
          <div className="px-9 py-8 border-b border-slate-200">
            <div className="flex items-center justify-between mb-1.5">
              <div className="text-sm font-bold text-emerald-700 flex items-center gap-2">
                <User size={14} /> Admin Account
              </div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Linked to this school
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              This will be the primary admin login for your school's portal.
              Each school gets its own isolated admin account.
            </p>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Admin Name *" icon={User} error={errors.admin_name}>
                  <input
                    className={inputCls(errors.admin_name)}
                    placeholder="e.g. Juan dela Cruz"
                    value={form.admin_name}
                    onChange={(e) => setField('admin_name', e.target.value)}
                  />
                </Field>
                <Field label="Admin Email *" icon={Mail} error={errors.admin_email}>
                  <input
                    className={inputCls(errors.admin_email)}
                    placeholder="admin@school.edu.ph"
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => setField('admin_email', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Password *" icon={Lock} error={errors.admin_password}>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      className={`${inputCls(errors.admin_password)} pr-10`}
                      placeholder="Min. 8 characters"
                      value={form.admin_password}
                      onChange={(e) => setField('admin_password', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <StrengthBar pw={form.admin_password} />
                </Field>

                <Field label="Confirm Password *" icon={Lock} error={errors.admin_confirm}>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className={`${inputCls(errors.admin_confirm)} pr-10`}
                      placeholder="Re-enter password"
                      value={form.admin_confirm}
                      onChange={(e) => setField('admin_confirm', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {form.admin_confirm && form.admin_password === form.admin_confirm && (
                    <span className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                      <Check size={11} /> Passwords match
                    </span>
                  )}
                </Field>
              </div>
            </div>
          </div>

          {/* ══ Subscription Plan ══ */}
          <div className="px-9 py-8 border-b border-slate-200">
            <div className="text-sm font-bold text-emerald-700 mb-5 flex items-center gap-2">
              <Star size={14} /> Subscription Plan
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PLANS.map((plan) => {
                const active = form.subscription_plan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setField('subscription_plan', plan.id)}
                    className={[
                      'p-4 rounded-xl cursor-pointer relative border-2 transition-all duration-150',
                      active
                        ? 'border-emerald-400 bg-emerald-50/60 shadow-[0_0_0_3px_rgba(16,185,129,0.1)]'
                        : 'border-slate-200 bg-white hover:border-slate-300',
                    ].join(' ')}
                  >
                    {plan.highlight && (
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-700 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full tracking-widest uppercase whitespace-nowrap">
                        Most Popular
                      </div>
                    )}
                    <div className={`text-lg font-extrabold mb-0.5 ${active ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {plan.price}
                    </div>
                    <div className={`text-sm font-bold ${active ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {plan.label}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">{plan.desc}</div>
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full bg-emerald-400 flex items-center justify-center" style={{ width: 18, height: 18 }}>
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ══ Submit ══ */}
          <div className="px-9 py-6 bg-slate-50 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">Fields marked * are required</span>
            <button
              onClick={handleSubmit}
              disabled={status === 'saving'}
              className={[
                'inline-flex items-center gap-2 px-7 py-3 rounded-xl border-none text-white text-sm font-bold font-[inherit] transition-all duration-150 shrink-0',
                status === 'saving'
                  ? 'bg-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-emerald-400 hover:bg-emerald-600 cursor-pointer shadow-[0_4px_14px_rgba(16,185,129,0.3)]',
              ].join(' ')}
            >
              {status === 'saving' ? (
                <>
                  <Loader size={15} className="animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  Create School <ChevronRight size={15} />
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default CreateSchoolForm;