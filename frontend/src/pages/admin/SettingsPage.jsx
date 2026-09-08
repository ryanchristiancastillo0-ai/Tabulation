import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/admin/Sidebar';
import { LogoUploadField, MobileTopBar } from '../../components/admin/index';
import { StrengthBar } from '../../components/school/index';
import { USALoader } from '../../components/index';
import { useTheme } from '../../providers/ThemeProvider';
import apiClient from '../../utils/apiClient';
import { navItems } from '../../constant/navlist.jsx';
import {
  ArrowLeft, KeyRound, Save, Loader2, Check, AlertCircle, Pencil, X,
} from 'lucide-react';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { dark, setDark } = useTheme();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // ── School profile ──
  const [schoolName,  setSchoolName]  = useState('');
  const [schoolEmail, setSchoolEmail] = useState('');
  const [schoolPhone, setSchoolPhone] = useState('');
  const [schoolLogo,  setSchoolLogo]  = useState('');

  // ── Admin ──
  const [adminName,  setAdminName]  = useState('');
  const [adminEmail, setAdminEmail] = useState('');

  // ── Judge / admin passwords ──
  const [judgePassword, setJudgePassword] = useState('');
  const [curPassword,   setCurPassword]   = useState('');
  const [newPassword,   setNewPassword]   = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [editing,      setEditing]      = useState(false);
  const [formMsg,      setFormMsg]      = useState(null);
  const [passwordMsg,  setPasswordMsg]  = useState(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await apiClient.get('/schools/profile');
      const school = data.school || {};
      const admin  = data.admin  || {};
      setSchoolName(school.school_name ?? '');
      setSchoolEmail(school.school_email ?? '');
      setSchoolPhone(school.school_phone ?? '');
      setSchoolLogo(school.school_logo ?? '');
      setAdminName(admin.name ?? '');
      setAdminEmail(admin.email ?? '');
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Failed to load profile: ' + err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const handleSaveProfile = async () => {
    if (!schoolName.trim()) {
      setFormMsg({ type: 'error', text: 'School name is required.' });
      return;
    }
    setSaving(true);
    setFormMsg(null);
    try {
      const payload = {
        school_name:       schoolName.trim(),
        school_email:      schoolEmail.trim(),
        school_phone:      schoolPhone.trim(),
        school_logo:       schoolLogo,
        admin_name:        adminName.trim(),
        admin_email:       adminEmail.trim(),
      };
      if (judgePassword) payload.judge_password = judgePassword;
      await apiClient.put('/schools/profile', payload);
      if (judgePassword) {
        await apiClient.post('/schools/profile/judge-password', { judge_password: judgePassword });
        setJudgePassword('');
      }
      setFormMsg({ type: 'success', text: 'Profile updated successfully.' });
      localStorage.setItem('schoolName', schoolName.trim());
      setEditing(false);
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Save failed: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!curPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'All password fields are required.' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPasswordMsg(null);
    try {
      await apiClient.post('/schools/profile/change-password', {
        current_password: curPassword,
        new_password:     newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setCurPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    }
  };

  const alert = (msg) => (
    <div className={`flex items-center gap-2 p-3 rounded-sm text-xs font-medium mb-6 border ${msg.type === 'success' ? 'border-[var(--accent-bd)] bg-[var(--green-lt)] text-[var(--green)]' : 'border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)]'}`}>
      {msg.type === 'success' ? <Check size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
      <span>{msg.text}</span>
    </div>
  );

  const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14 };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[var(--bg)]">
        {!isMobile && <Sidebar activeNav="system" setActiveNav={() => {}} dark={dark} setDark={setDark} />}
        <main className="flex-1 flex items-center justify-center p-10">
          <USALoader
            fullScreen={false}
            prompt="Loading settings…"
            background="transparent"
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {!isMobile && <Sidebar activeNav="system" setActiveNav={() => {}} dark={dark} setDark={setDark} />}

      <main className="flex flex-1 flex-col overflow-y-auto">
        {isMobile && (
          <MobileTopBar
            activeNav="system"
            navItems={navItems}
            onOpenMenu={() => {}}
          />
        )}

        <div className={`flex-1 w-full min-w-0 max-w-[1920px] mx-auto ${isMobile ? 'px-4 py-5 pb-[88px]' : 'px-6 lg:px-8 2xl:px-10 py-9'}`}>
          {/* Header */}
          <div className={`flex justify-between gap-3 sm:gap-4 mb-5 lg:mb-8 ${isMobile ? 'flex-col items-stretch' : 'flex-row items-center'}`}>
            <div className="min-w-0 flex items-center gap-3">
              {!isMobile && (
                <button
                  onClick={() => navigate('/admin/dashboard')}
                  className="p-2 -ml-2 rounded-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--accent)]"
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest mb-2 bg-[var(--gold-lt)] text-[var(--gold)] border border-[var(--gold-bd)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
                  Admin Settings
                </div>
                <h1 className="heading-serif text-2xl font-bold tracking-tight text-[var(--text1)]">
                  School Profile
                </h1>
                <div className="gold-rule mt-2.5" />
              </div>
            </div>

            <button
              onClick={() => { setEditing(v => !v); setFormMsg(null); setPasswordMsg(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-semibold border transition-colors ${
                editing
                  ? 'border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)] hover:bg-red-100'
                  : 'border-[var(--gold-bd)] bg-[var(--gold-lt)] text-[var(--gold)] hover:bg-yellow-100'
              }`}
            >
              {editing ? <X size={15} /> : <Pencil size={15} />}
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <div className="h-px mb-8 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

          {formMsg && alert(formMsg)}
          {passwordMsg && alert(passwordMsg)}

          {/* School Information */}
          <div className="panel p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 mb-6">
            <div className="section-heading" style={{ margin: 0 }}>School Information</div>

            <div style={{ maxWidth: 280 }}>
              <LogoUploadField label="School Logo" value={schoolLogo} onChange={setSchoolLogo} readOnly={!editing} />
            </div>

            <div style={gridStyle}>
              <div>
                <div className="field-label">School Name *</div>
                <input
                  className="field-input"
                  placeholder="School name"
                  value={schoolName}
                  readOnly={!editing}
                  onChange={(e) => { setSchoolName(e.target.value); setFormMsg(null); }}
                />
              </div>
              <div>
                <div className="field-label">School Email *</div>
                <input
                  className="field-input"
                  type="email"
                  placeholder="info@school.edu.ph"
                  value={schoolEmail}
                  readOnly={!editing}
                  onChange={(e) => { setSchoolEmail(e.target.value); setFormMsg(null); }}
                />
              </div>
              <div>
                <div className="field-label">Phone Number</div>
                <input
                  className="field-input"
                  placeholder="+63 912 345 6789"
                  value={schoolPhone}
                  readOnly={!editing}
                  onChange={(e) => setSchoolPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="field-label">
                Judge Password{' '}
                <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--text3)' }}>
                  (leave blank to keep current)
                </span>
              </div>
              <input
                className="field-input"
                type="password"
                minLength="8"
                placeholder="Min. 8 characters"
                value={judgePassword}
                readOnly={!editing}
                onChange={(e) => setJudgePassword(e.target.value)}
              />
              <p className="text-[10px] text-[var(--text3)] mt-1">Judges log in with the school email + this password.</p>
              {editing && <StrengthBar pw={judgePassword} />}
            </div>

            {editing && (
              <div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  <span>{saving ? 'Saving…' : 'Save Profile'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Administrator Account */}
          <div className="panel p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 mb-6">
            <div className="section-heading" style={{ margin: 0 }}>Administrator Account</div>

            <div style={gridStyle}>
              <div>
                <div className="field-label">Admin Name</div>
                <input
                  className="field-input"
                  value={adminName}
                  readOnly={!editing}
                  onChange={(e) => setAdminName(e.target.value)}
                />
              </div>
              <div>
                <div className="field-label">Admin Email</div>
                <input
                  className="field-input"
                  type="email"
                  value={adminEmail}
                  readOnly={!editing}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="panel p-4 sm:p-6 flex flex-col gap-5 sm:gap-6 mb-6">
            <div className="section-heading" style={{ margin: 0 }}>Change Password</div>

            <div style={gridStyle}>
              <div>
                <div className="field-label">Current Password</div>
                <input
                  className="field-input"
                  type="password"
                  value={curPassword}
                  readOnly={!editing}
                  onChange={(e) => setCurPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <div className="field-label">New Password</div>
                <input
                  className="field-input"
                  type="password"
                  value={newPassword}
                  readOnly={!editing}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <div className="field-label">Confirm New Password</div>
                <input
                  className="field-input"
                  type="password"
                  value={confirmPassword}
                  readOnly={!editing}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>
            </div>

            {editing && (
              <div>
                <button
                  onClick={handleChangePassword}
                  className="btn-ghost flex items-center justify-center gap-2"
                >
                  <KeyRound size={16} />
                  Update Admin Password
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}