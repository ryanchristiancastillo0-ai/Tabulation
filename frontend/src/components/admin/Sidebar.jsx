import { useEffect, useState } from "react";
import {
  LayoutGrid, Trophy, Sparkles, Scale,
  Users, UserPlus, Moon, Sun, TrophyIcon, LogOut, MonitorCog,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL;

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

  useEffect(() => {
    fetch(`${API_BASE}/system-config`)
      .then((r) => r.json())
      .then((data) => { if (data) setSysConfig((p) => ({ ...p, ...data })); })
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/login";
  };

  const portalName = sysConfig.portal_name || "CompPortal";

  return (
    <aside
      style={{
        width: 256,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
        transition: "background .25s, border-color .25s",
      }}
    >
      {/* ── Logo / Brand ── */}
      <div style={{ padding: "20px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid var(--border)" }}>
        <img
          src="/img/USAL_LOGO.png"
          alt="Logo"
          style={{
            width: 44, height: 44, objectFit: "contain",
            borderRadius: "50%", border: "1px solid var(--border)", flexShrink: 0,
          }}
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text1)", letterSpacing: "-0.01em" }}>
            {portalName}
          </div>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text3)", fontFamily: "var(--font-mono)" }}>
            Admin v1.2
          </div>
        </div>
      </div>

      {/* ── Badge pill ── */}
      <div style={{ padding: "12px 20px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 999, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", background: "var(--accent-lt)", color: "var(--accent)", border: "1px solid var(--accent-bd)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-mid)", animation: "pulse 2s infinite" }} />
          Administrator
        </div>
      </div>

      {/* ── Nav items ── */}
      <nav style={{ flex: 1, padding: "0 12px 12px" }}>
        {navItems.map((item) => {
          const active = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 12, border: active ? "1px solid var(--accent-bd)" : "1px solid transparent",
                background: active ? "var(--accent-lt)" : "transparent",
                color: active ? "var(--accent)" : "var(--text2)",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", marginBottom: 2, transition: "all .15s",
              }}
              onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--surface2)"; e.currentTarget.style.color = "var(--text1)"; } }}
              onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; } }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: active ? "var(--accent-bd)" : "var(--surface2)", color: active ? "var(--accent)" : "var(--text3)" }}>
                {item.icon}
              </div>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* ── Sign out ── */}
      <div style={{ borderTop: "1px solid var(--border)", padding: "12px 12px 8px" }}>
        <button
          onClick={handleLogout}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: "1px solid transparent", background: "transparent", color: "var(--text2)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#be123c"; e.currentTarget.style.borderColor = "#fecdd3"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.borderColor = "transparent"; }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "var(--surface2)" }}>
            <LogOut size={15} />
          </div>
          Sign Out
        </button>
      </div>

      {/* ── Leaderboard ── */}
      <div style={{ padding: "0 12px 8px" }}>
        <button
          onClick={() => navigate("/admin/leaderboard")}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, border: "1px solid transparent", background: "transparent", color: "var(--text2)", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#fff1f2"; e.currentTarget.style.color = "#be123c"; e.currentTarget.style.borderColor = "#fecdd3"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text2)"; e.currentTarget.style.borderColor = "transparent"; }}
        >
          <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "var(--surface2)" }}>
            <TrophyIcon size={15} />
          </div>
          Leaderboard
        </button>
      </div>

      {/* ── Dark / Light toggle ── */}
      <div style={{ padding: "0 12px 16px" }}>
        <button
          onClick={() => setDark(!dark)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--text2)", fontSize: 14, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
        >
          <span>{dark ? "Dark Mode" : "Light Mode"}</span>
          {dark ? <Moon size={15} style={{ color: "var(--accent)" }} /> : <Sun size={15} style={{ color: "var(--accent)" }} />}
        </button>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }`}</style>
    </aside>
  );
}