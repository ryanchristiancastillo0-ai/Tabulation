import { useEffect, useState } from "react";
import {
  LayoutGrid, Trophy, Sparkles, Scale,
  Users, UserPlus, Moon, Sun, TrophyIcon, LogOut, MonitorCog, Settings,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import apiClient from "../../services/api";
import { logoutRemote, clearAdminSession } from "../../services/session";

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
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isDashboardRoute = location.pathname === "/admin/dashboard";
  const activeTab = isDashboardRoute ? (searchParams.get("tab") || activeNav) : null;
  const isLeaderboardActive = location.pathname === "/admin/leaderboard";
  const isSettingsActive = location.pathname === "/admin/settings";

  useEffect(() => {
    apiClient
      .get("/system-config")
      .then((data) => { if (data) setSysConfig((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logoutRemote("admin"); // fire-and-forget; only this device signs out
    clearAdminSession();
    window.location.href = "/login";
  };

  const portalName = sysConfig.portal_name || "CompPortal";

  return (
    <aside className="w-56 shrink-0 flex flex-col bg-[#1B4332] border-r border-white/10 sticky top-0 h-screen overflow-y-auto transition-colors duration-250">
      {/* ── Logo / Brand ── */}
      <div className="p-4 flex items-center gap-2.5 border-b border-white/10">
        <img
          src="/img/USAL_LOGO.png"
          alt="Logo"
          className="w-9 h-9 object-contain rounded-full border border-white/20 shrink-0"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="min-w-0">
          <div className="text-sm font-bold text-white tracking-tight truncate" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            {portalName}
          </div>
          <div className="text-[9px] font-semibold uppercase tracking-wider text-[#C9A227]">
            Administrator
          </div>
        </div>
      </div>

      {/* ── Badge pill ── */}
      <div className="px-4 py-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#C9A227]/15 text-[#C9A227] border border-[#C9A227]/30">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227] animate-pulse" />
          Administrator
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav className="flex-1 px-2.5 pb-3">
        {navItems.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { setActiveNav?.(item.id); navigate('/admin/dashboard?tab=' + item.id); }}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md border mb-0.5 text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 ${
                active
                  ? "border-[#C9A227]/30 bg-[#C9A227]/15 text-[#C9A227]"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                active ? "bg-[#C9A227]/20 text-[#C9A227]" : "bg-white/5 text-white/50"
              }`}>
                {item.icon}
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Leaderboard ── */}
      <div className="px-2.5 pb-2">
        <button
          onClick={() => navigate("/admin/leaderboard")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md border text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 ${
            isLeaderboardActive
              ? "border-rose-800/40 bg-rose-950/40 text-rose-200"
              : "border-transparent bg-transparent text-white/70 hover:bg-rose-950/30 hover:text-rose-200 hover:border-rose-900/30"
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
            isLeaderboardActive ? "bg-rose-900/40" : "bg-white/5"
          }`}>
            <TrophyIcon size={15} />
          </div>
          Leaderboard
        </button>
      </div>

      {/* ── Settings / Profile ── */}
      <div className="px-2.5 pb-2">
        <button
          onClick={() => navigate("/admin/settings")}
          className={`w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md border text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 ${
            isSettingsActive
              ? "border-[#C9A227]/30 bg-[#C9A227]/15 text-[#C9A227]"
              : "border-transparent bg-transparent text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
            isSettingsActive ? "bg-[#C9A227]/20 text-[#C9A227]" : "bg-white/5"
          }`}>
            <Settings size={15} />
          </div>
          Settings
        </button>
      </div>

      {/* ── Dark / Light toggle ── */}
      <div className="px-2.5 pb-4">
        <button
          onClick={() => setDark(!dark)}
          className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-md border border-white/10 bg-white/5 text-white/80 text-[13px] font-medium cursor-pointer font-inherit"
        >
          <span>{dark ? "Dark Mode" : "Light Mode"}</span>
          {dark ? <Moon size={15} className="text-[#C9A227]" /> : <Sun size={15} className="text-[#C9A227]" />}
        </button>
      </div>

      {/* ── Sign out ── */}
      <div className="border-t border-white/10 p-2.5 pb-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md border border-rose-900/40 bg-rose-950/30 text-rose-200 text-[13px] font-semibold cursor-pointer font-inherit transition-all duration-150 hover:bg-rose-950/50 hover:border-rose-800/50"
        >
          <div className="w-6 h-6 rounded flex items-center justify-center shrink-0 bg-rose-900/30 text-rose-200">
            <LogOut size={15} />
          </div>
          Sign Out
        </button>
      </div>
    </aside>
  );
}