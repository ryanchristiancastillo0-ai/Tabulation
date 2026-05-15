import { useEffect, useState } from 'react';
import { LayoutGrid, Trophy, Sparkles, Scale, Users, UserPlus, Moon, Sun, LogOut, MonitorCog } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL;

const navItems = [
  { id: 'overview',    icon: LayoutGrid, label: 'Overview' },
  { id: 'contest',     icon: Trophy,     label: 'Contest Info' },
  { id: 'ai',          icon: Sparkles,   label: 'AI Prompt' },
  { id: 'criteria',    icon: Scale,      label: 'Criteria' },
  { id: 'judges',      icon: Users,      label: 'Judges' },
  { id: 'contestants', icon: UserPlus,   label: 'Contestants' },
  { id: 'system',      icon: MonitorCog, label: 'System' },
];

export default function Sidebar({ activeNav, setActiveNav, dark, setDark }) {
  const [sysConfig, setSysConfig] = useState({ school_logo: '', portal_name: '', school_name: '' });

  useEffect(() => {
    fetch(`${API_BASE}/system-config`)
      .then(r => r.json())
      .then(data => { if (data) setSysConfig(prev => ({ ...prev, ...data })); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };


  const portalName = sysConfig.portal_name || 'CompPortal';

  return (
    <aside
      className="w-64 flex flex-col"
      style={{
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        transition: 'background .25s, border-color .25s',
      }}
    >
      {/* ── Logo / Brand ── */}
      <div
        className="p-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <img
          src='/img/USAL_LOGO.png'
          alt="Logo"
          className="w-13 h-13 object-contain rounded-full"
          style={{ border: '1px solid var(--border)' }}
          onError={e => { e.currentTarget.src = fallbackLogo; }}
        />
        <div>
          <div className="text-sm font-bold tracking-tight" style={{ color: 'var(--text1)' }}>
            {portalName}
          </div>
          <div
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}
          >
            Admin v1.2
          </div>
        </div>
      </div>

      {/* ── Badge pill ── */}
      <div className="px-5 py-3">
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest"
          style={{
            background: 'var(--accent-lt)',
            color: 'var(--accent)',
            border: '1px solid var(--accent-bd)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent-mid)' }} />
          Administrator
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 pb-3 space-y-0.5">
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? 'var(--accent-lt)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text2)',
                border: active ? '1px solid var(--accent-bd)' : '1px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text1)'; }
              }}
              onMouseLeave={e => {
                if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; }
              }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: active ? 'var(--accent-bd)' : 'var(--surface2)',
                  color: active ? 'var(--accent)' : 'var(--text3)',
                }}
              >
                <item.icon size={15} strokeWidth={active ? 2.5 : 2} />
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Sign out ── */}
      <div className="px-3 pb-2" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        <button
          onClick={handleLogout}
          className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ color: 'var(--text2)', border: '1px solid transparent' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#be123c'; e.currentTarget.style.borderColor = '#fecdd3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'transparent'; }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--surface2)' }}>
            <LogOut size={15} strokeWidth={2} />
          </div>
          Sign Out
        </button>
      </div>

      {/* ── Dark / Light toggle ── */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text2)' }}
        >
          <span>{dark ? 'Dark Mode' : 'Light Mode'}</span>
          {dark
            ? <Moon size={15} style={{ color: 'var(--accent)' }} />
            : <Sun size={15} style={{ color: 'var(--accent)' }} />
          }
        </button>
      </div>
    </aside>
  );
}