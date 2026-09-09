import { useEffect, useState } from "react";
import {
  LayoutGrid, Trophy, Sparkles, Scale,
  Users, UserPlus, Moon, Sun, TrophyIcon, LogOut, MonitorCog, Settings,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../utils/apiClient";

// Same nav list used by Dashboard for the mobile drawer
export const navItems = [
  { id: "overview",    label: "Overview",     icon: <LayoutGrid  size={15}/> },
  { id: "contest",     label: "Contest Info", icon: <Trophy      size={15}/> },
  { id: "ai",          label: "AI Prompt",    icon: <Sparkles    size={15}/> },
  { id: "criteria",    label: "Criteria",     icon: <Scale       size={15}/> },
  { id: "judges",      label: "Judges",       icon: <Users       size={15}/> },
  { id: "contestants", label: "Contestants",  icon: <UserPlus    size={15}/> },
  { id: "system",      label: "System",       icon: <MonitorCog  size={15}/> },
];


export default function Sidebar({ activeNav, setActiveNav, dark, setDark }) {
  const [sysConfig, setSysConfig] = useState({
    school_logo: "", portal_name: "", school_name: "",
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || activeNav;

  useEffect(() => {
    apiClient
      .get("/system-config")
      .then((data) => { if (data) setSysConfig((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    Object.keys(localStorage)
      .filter(
        (k) =>
          k.startsWith("admin_token_") ||
          k === "adminToken" ||
          k === "auth" ||
          k === "adminUser"
      )
      .forEach((k) => localStorage.removeItem(k));
    window.location.href = "/login";
  };

  const portalName = sysConfig.portal_name || "CompPortal";

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-[var(--surface)] border-r border-[var(--border)] sticky top-0 h-screen overflow-y-auto transition-colors duration-250">
      {/* ── Logo / Brand ── */}
      <div className="p-5 flex items-center gap-3 border-b border-[var(--border)]">
        <img
          src="/img/USAL_LOGO.png"
          alt="Logo"
          className="w-11 h-11 object-contain rounded-full border border-[var(--border)] shrink-0"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div>
          <div className="text-[15px] font-bold text-[var(--text1)] tracking-tight font-[var(--font-serif)]">
            {portalName}
          </div>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#C9A227]">
            Administrator
          </div>
        </div>
      </div>

      {/* ── Badge pill ── */}
      <div className="px-5 py-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--gold-lt)] text-[var(--gold)] border border-[var(--gold-bd)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] animate-pulse" />
          Administrator
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-3 pb-3">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveNav?.(item.id); navigate('/admin/dashboard?tab=' + item.id); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md border mb-0.5 text-sm font-semibold cursor-pointer font-inherit transition-all duration-150 ${
                active
                  ? "border-[var(--accent-bd)] bg-[var(--accent-lt)] text-[var(--accent)]"
                  : "border-transparent text-[var(--text2)] hover:bg-[var(--surface2)] hover:text-[var(--text1)]"
              }`}
            >
              <div className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                active ? "bg-[var(--accent-bd)] text-[var(--accent)]" : "bg-[var(--surface2)] text-[var(--text3)]"
              }`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Leaderboard ── */}
      <div className="px-3 pb-2">
        <button
          onClick={() => navigate("/admin/leaderboard")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-transparent bg-transparent text-[var(--text2)] text-sm font-semibold cursor-pointer font-inherit transition-all duration-150 hover:bg-[#fff1f2] hover:text-[#be123c] hover:border-[#fecdd3]"
        >
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-[var(--surface2)]">
            <TrophyIcon size={15} />
          </div>
          Leaderboard
        </button>
      </div>

      {/* ── Settings / Profile ── */}
      <div className="px-3 pb-2">
        <button
          onClick={() => navigate("/admin/settings")}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-transparent bg-transparent text-[var(--text2)] text-sm font-semibold cursor-pointer font-inherit transition-all duration-150 hover:bg-[var(--surface2)] hover:text-[var(--accent)] hover:border-[var(--accent-bd)]"
        >
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-[var(--surface2)]">
            <Settings size={15} />
          </div>
          Settings
        </button>
      </div>

      {/* ── Dark / Light toggle ── */}
      <div className="px-3 pb-4">
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-md border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] text-sm font-medium cursor-pointer font-inherit"
        >
          <span>{dark ? "Dark Mode" : "Light Mode"}</span>
          {dark ? <Moon size={15} className="text-[var(--accent)]" /> : <Sun size={15} className="text-[var(--accent)]" />}
        </button>
      </div>

      {/* ── Sign out ── */}
      <div className="border-t border-[var(--border)] p-3 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md border border-[#fecdd3] bg-[#fff1f2] text-[#be123c] text-sm font-semibold cursor-pointer font-inherit transition-all duration-150 hover:bg-[#fee2e2] hover:border-[#fca5a5]"
        >
          <div className="w-7 h-7 rounded flex items-center justify-center shrink-0 bg-[#ffe4e6] text-[#be123c]">
            <LogOut size={15} />
          </div>
          Sign Out
        </button>
      </div>
    </aside>
  );
}