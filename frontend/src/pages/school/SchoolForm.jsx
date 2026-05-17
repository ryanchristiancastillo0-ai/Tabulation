import  { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {AdminAccountSection,
  ErrorModal,
  FormFooter,FormHero,
  FormNavBar,
  SchoolInfoSection,
  SuccessScreen,SubscriptionSection
} from '../../components/school/index'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────

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


// ─────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────

function useLocationData() {
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

  useEffect(() => {
    const fetchRegions = async () => {
      setLoadingR(true);
      try {
        const response = await fetch(`${API_BASE}/locations/regions`);
        const data = await response.json();
        setRegions(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } catch (err) {
        console.error('regions error:', err);
      } finally {
        setLoadingR(false);
      }
    };
    fetchRegions();
  }, []);

  useEffect(() => {
    if (!selectedRegion) {
      setProvinces([]); setCities([]); setBarangays([]);
      return;
    }
    const fetchProvinces = async () => {
      setLoadingP(true);
      setProvinces([]); setCities([]); setBarangays([]);
      setSelectedProvince(''); setSelectedCity(''); setSelectedBarangay('');
      try {
        const response = await fetch(`${API_BASE}/locations/provinces/${selectedRegion}`);
        const data = await response.json();
        setProvinces(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } catch (err) {
        console.error('provinces error:', err);
      } finally {
        setLoadingP(false);
      }
    };
    fetchProvinces();
  }, [selectedRegion]);

  useEffect(() => {
    if (!selectedProvince) { setCities([]); setBarangays([]); return; }
    const fetchCities = async () => {
      setLoadingC(true);
      setCities([]); setBarangays([]);
      setSelectedCity(''); setSelectedBarangay('');
      try {
        const response = await fetch(
          `https://psgc.gitlab.io/api/provinces/${selectedProvince}/cities-municipalities/`
        );
        const data = await response.json();
        setCities(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []);
      } catch (err) {
        console.error('cities error:', err);
      } finally {
        setLoadingC(false);
      }
    };
    fetchCities();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedCity) { setBarangays([]); return; }
    const fetchBarangays = async () => {
      setLoadingB(true);
      setBarangays([]); setSelectedBarangay('');
      try {
        const response = await fetch(`${API_BASE}/locations/barangays/${selectedCity}`);
        const data = await response.json();
        setBarangays(Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : []);
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
}


export default function CreateSchoolForm() {
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

  const [errors,    setErrors]    = useState({});
  const [status,    setStatus]    = useState('idle'); // idle | saving | success | error
  const [errMsg,    setErrMsg]    = useState('');
  const [showModal, setShowModal] = useState(false);

  function setField(key, val) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  }

  async function handleLogo(e) {
    const file = e.target.files[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setField('school_logo', compressed);
  }

  function validate() {
    const e = {};
    if (!form.school_name.trim())  e.school_name  = 'School name is required.';
    if (!form.school_email.trim()) e.school_email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.school_email))
      e.school_email = 'Enter a valid email.';
    if (!loc.selectedRegion)   e.region   = 'Please select a region.';
    if (!loc.selectedProvince) e.province = 'Please select a province.';
    if (!loc.selectedCity)     e.city     = 'Please select a city / municipality.';
    if (!loc.selectedBarangay) e.barangay = 'Please select a barangay.';
    if (!form.admin_name.trim())  e.admin_name  = 'Admin name is required.';
    if (!form.admin_email.trim()) e.admin_email = 'Admin email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.admin_email))
      e.admin_email = 'Enter a valid email.';
    if (!form.admin_password)          e.admin_password = 'Password is required.';
    else if (form.admin_password.length < 8) e.admin_password = 'Minimum 8 characters.';
    if (form.admin_password !== form.admin_confirm)
      e.admin_confirm = 'Passwords do not match.';
    return e;
  }

  async function handleSubmit() {
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
  }

  // ── Success screen ────────────────────────────────────────────
  if (status === 'success') {
    return (
      <SuccessScreen
        schoolName={form.school_name}
        adminName={form.admin_name}
        fullAddress={loc.fullAddress}
        navigate={navigate}
      />
    );
  }

  // ── Main form ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

      {showModal && (
        <ErrorModal
          message={errMsg}
          onClose={() => { setShowModal(false); setStatus('idle'); }}
        />
      )}

      <FormNavBar navigate={navigate} />

      <FormHero />

      <div className="max-w-2xl mx-auto mt-8 mb-16 px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_4px_24px_rgba(0,108,73,0.06)] overflow-hidden">

          <SchoolInfoSection
            form={form}
            setField={setField}
            errors={errors}
            setErrors={setErrors}
            logoRef={logoRef}
            handleLogo={handleLogo}
            loc={loc}
          />

          <AdminAccountSection
            form={form}
            setField={setField}
            errors={errors}
          />

          <SubscriptionSection
            value={form.subscription_plan}
            setField={setField}
          />

          <FormFooter
            status={status}
            onSubmit={handleSubmit}
          />

        </div>
      </div>

    </div>
  );
}