import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, Activity } from 'lucide-react';
import { StatusModal } from '../../components/judge/StatusModal';
import { useJudgeSystem } from '../../hooks/judge/useJudgeSystem';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

function getSchoolId() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get('school_id')) return params.get('school_id');
    const user = localStorage.getItem('adminUser');
    if (user) return JSON.parse(user)?.school_id || 1;
    const auth = localStorage.getItem('auth');
    if (auth) return JSON.parse(auth)?.admin?.school_id || 1;
    return 1;
  } catch {
    return 1;
  }
}

const useSystemConfig = () => {
  const [sysConfig, setSysConfig] = useState({
    school_name:     '',
    portal_name:     '',
    school_logo:     '',
    background_logo: '',
    primary_color:   '#006c49',
    secondary_color: '#10b981',
    footer_text:     '',
    logo_radius:     12,
  });

  useEffect(() => {
    const school_id = getSchoolId();
    fetch(`${API_BASE}/public/system-config?school_id=${school_id}`)
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const clean = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
          );
          setSysConfig(prev => ({ ...prev, ...clean }));
        }
      })
      .catch(err => console.error('system-config error:', err));
  }, []);

  return sysConfig;
};

/* ── Judge Header ────────────────────────────────────────────────── */
const JudgeHeader = ({ sysConfig, contestName, selectedJudge, judgeCount, updateJudge, isOnline }) => {
  const primary    = sysConfig.primary_color   || '#006c49';
  const secondary  = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;

  return (
    <header
      style={{
        background: primary,
        borderBottom: `1px solid ${primary}`,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: `0 2px 16px ${primary}60`,
      }}
    >
      {/* Offline banner */}
      {!isOnline && (
        <div style={{
          background: '#ef4444',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '6px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <WifiOff size={13} />
          Offline Mode — Scores will sync when reconnected
        </div>
      )}

      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '0 48px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
      }}>
        {/* Left: logo + name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {sysConfig.school_logo ? (
            <img
              src={sysConfig.school_logo}
              alt="logo"
              style={{
                width: 42,
                height: 42,
                borderRadius: logoRadius >= 999 ? '50%' : `${logoRadius}px`,
                objectFit: 'cover',
                border: `2px solid rgba(255,255,255,0.4)`,
                transition: 'border-radius .2s',
              }}
            />
          ) : (
            <div style={{
              width: 42,
              height: 42,
              borderRadius: logoRadius >= 999 ? '50%' : `${logoRadius}px`,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1.5px solid rgba(255,255,255,0.3)',
              transition: 'border-radius .2s',
            }}>
              <Activity size={20} style={{ color: '#fff' }} />
            </div>
          )}
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 16,
              color: '#fff',
              letterSpacing: '-0.3px',
              lineHeight: 1.2,
            }}>
              {sysConfig.portal_name || 'Veridict'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              {sysConfig.school_name || 'Judge Portal'}
            </div>
          </div>
        </div>

        {/* Center: contest name */}
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            padding: '3px 12px',
            borderRadius: 999,
            marginBottom: 2,
          }}>
            Live Judging Session
          </span>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.2px' }}>
            {contestName || 'Syncing contest…'}
          </div>
        </div>

        {/* Right: judge selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <select
              value={selectedJudge}
              onChange={e => updateJudge(e.target.value)}
              style={{
                appearance: 'none',
                paddingLeft: 14,
                paddingRight: 36,
                paddingTop: 9,
                paddingBottom: 9,
                background: 'rgba(255,255,255,0.95)',
                border: `1.5px solid rgba(255,255,255,0.4)`,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                color: '#191c1e',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                minWidth: 140,
                transition: 'border-color .15s',
              }}
            >
              <option value="">Select Judge</option>
              {Array.from({ length: judgeCount || 0 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Judge {i + 1}
                </option>
              ))}
            </select>
            <div style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: primary,
            }}>
              <ShieldCheck size={13} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, rgba(255,255,255,0.3), ${secondary}, rgba(255,255,255,0.3))` }} />
    </header>
  );
};

/* ── Judge Footer ────────────────────────────────────────────────── */
const JudgeFooter = ({ sysConfig }) => {
  const primary    = sysConfig.primary_color   || '#006c49';
  const secondary  = sysConfig.secondary_color || '#10b981';
  const logoRadius = sysConfig.logo_radius != null ? sysConfig.logo_radius : 12;

  return (
    <footer style={{
      background: primary,
      marginTop: 64,
      padding: '28px 48px',
    }}>
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {sysConfig.school_logo && (
            <img
              src={sysConfig.school_logo}
              alt="school logo"
              style={{
                width: 32,
                height: 32,
                objectFit: 'cover',
                borderRadius: logoRadius >= 999 ? '50%' : `${logoRadius}px`,
                border: '1.5px solid rgba(255,255,255,0.4)',
                transition: 'border-radius .2s',
              }}
            />
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
              {sysConfig.portal_name || 'Veridict'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {sysConfig.school_name || ''}
            </div>
          </div>
        </div>

        {sysConfig.footer_text && (
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            fontWeight: 500,
            textAlign: 'center',
          }}>
            {sysConfig.footer_text}
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 11,
          color: '#fff',
          fontWeight: 600,
        }}>
          <div style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: secondary,
            animation: 'pulse 2s infinite',
          }} />
          Encrypted · Secure Session
        </div>
      </div>
    </footer>
  );
};

/* ── Main JudgeTable ─────────────────────────────────────────────── */
const JudgeTable = () => {
  const {
    selectedJudge,
    dynamicUI,
    config,
    loading,
    modal,
    isOnline,
    closeModal,
    submitToDB,
    updateJudge,
  } = useJudgeSystem();

  const sysConfig = useSystemConfig();

  const headerHtml = dynamicUI?.headerHtml || '';
  const tableHtml  = typeof dynamicUI === 'string' ? dynamicUI : dynamicUI?.html || '';

  const primary   = sysConfig.primary_color   || '#006c49';
  const secondary = sysConfig.secondary_color || '#10b981';

  return (
    <div style={{
      background: '#f7f9fb',
      minHeight: '100vh',
      fontFamily: "'Inter', sans-serif",
      color: '#191c1e',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <StatusModal
        isOpen={modal.show}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
      />

      <JudgeHeader
        sysConfig={sysConfig}
        contestName={config.settings?.contest_name}
        selectedJudge={selectedJudge}
        judgeCount={config.settings?.judge_count}
        updateJudge={updateJudge}
        isOnline={isOnline}
      />

      <main style={{
        flex: 1,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        padding: '40px 48px',
      }}>
        {!loading && headerHtml && (
          <div
            className="dynamic-header-area"
            style={{ marginBottom: 28 }}
            dangerouslySetInnerHTML={{ __html: headerHtml }}
          />
        )}

        <div style={{
          background: '#fff',
          border: `1px solid ${primary}20`,
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: `0 4px 24px ${primary}15`,
        }}>
          {/* Table header strip */}
          <div style={{
            padding: '18px 28px',
            borderBottom: `1px solid ${primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: `linear-gradient(90deg, ${primary}12, #fff)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: secondary,
                boxShadow: `0 0 0 4px ${secondary}30`,
                animation: 'pulse 2s infinite',
              }} />
              <span style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: '#3c4a42',
              }}>
                Scoring Terminal
              </span>
            </div>

            {selectedJudge && (
              <span style={{
                background: `${primary}15`,
                color: primary,
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: 999,
                letterSpacing: '0.08em',
              }}>
                Judge {selectedJudge}
              </span>
            )}
          </div>

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 0',
              gap: 16,
              opacity: 0.5,
            }}>
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: `3px solid ${secondary}`,
                borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite',
              }} />
              <p style={{
                fontFamily: 'monospace',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#3c4a42',
              }}>
                Building Interface…
              </p>
            </div>
          ) : (
            <div
              className="ai-rendered-content"
              dangerouslySetInnerHTML={{ __html: tableHtml }}
            />
          )}
        </div>

        {/* Submit button */}
        <div style={{
          marginTop: 40,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}>
          <button
            onClick={submitToDB}
            disabled={!selectedJudge || loading}
            style={{
              padding: '14px 56px',
              background: !selectedJudge || loading ? '#e0e3e5' : primary,
              color: !selectedJudge || loading ? '#9ca3af' : '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: !selectedJudge || loading ? 'not-allowed' : 'pointer',
              transition: 'all .2s',
              boxShadow: !selectedJudge || loading ? 'none' : `0 6px 20px ${primary}40`,
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!selectedJudge || loading) return;
              e.currentTarget.style.filter = 'brightness(0.88)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            Submit Scores
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.45 }}>
            <div style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: secondary,
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#3c4a42',
            }}>
              Encrypted Connection Active
            </span>
          </div>
        </div>
      </main>

      <JudgeFooter sysConfig={sysConfig} />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};

export default JudgeTable;