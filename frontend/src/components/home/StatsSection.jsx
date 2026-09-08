import { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const POLL_MS = 20000;

function initialsOf(name) {
  return String(name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export default function StatsSection() {
  const [active, setActive] = useState({ count: null, schools: [] });
  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/public/active-schools`);
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data) {
          setActive({
            count:   Number(data.count ?? 0),
            schools: Array.isArray(data.schools) ? data.schools : [],
          });
        }
      } catch {
        // ignore network hiccups - next poll retries
      }
    };
    load();
    const timer = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  const onlineCount = active.count === null ? '…' : active.count;
  const onlineLabel = active.count === null ? 'Schools Online Now' : (active.count === 1 ? 'School Online Now' : 'Schools Online Now');

  const stats = [
    { value: '99.9%', label: 'Uptime SLA' },
    { value: '500+', label: 'Institutions' },
    { isLive: true },
    { value: '12M', label: 'Active Learners' },
    { value: 'ISO', label: '27001 Certified' },
  ];

  const schoolName = (s) => s.school_name || 'Untitled School';

  return (
    <section className="py-16 sm:py-24 border-t border-[#E1E8DE] bg-white">
      <div className="max-w-[1280px] xl:max-w-[1600px] 2xl:max-w-[1800px] 3xl:max-w-[2400px] 4xl:max-w-[3000px] mx-auto px-4 sm:px-6 md:px-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-12">
        {stats.map((stat, i) =>
          stat.isLive ? (
            <div
              key="online-now"
              className="relative flex items-start justify-center"
              onMouseEnter={() => setPopoverOpen(true)}
              onMouseLeave={() => setPopoverOpen(false)}
            >
              <button
                type="button"
                onClick={() => setPopoverOpen((o) => !o)}
                aria-haspopup="dialog"
                aria-expanded={popoverOpen}
                className="text-center group outline-none cursor-pointer"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="relative flex w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1B4332]/40" />
                    <span className="relative inline-flex w-3 h-3 rounded-full bg-[#1B4332]" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold text-[#1B4332] uppercase tracking-widest">
                    LIVE
                  </span>
                </div>
                <div
                  className="text-3xl sm:text-[40px] xl:text-[48px] font-bold text-[#1B4332] mb-2 leading-none"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {onlineCount}
                </div>
                <div className="text-[10px] sm:text-xs xl:text-sm font-semibold text-[#4B5A4D] uppercase tracking-widest">
                  {onlineLabel}
                </div>
                <div className="text-[9px] sm:text-[10px] text-[#6C7A71] mt-1.5 underline-offset-2 group-hover:underline">
                  Hover to view schools
                </div>
              </button>

              {/* Popover */}
              {popoverOpen && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-20 w-[280px] max-w-[82vw]">
                  <div className="bg-[#14201A] text-white rounded-sm shadow-2xl border border-[#1B4332]/40 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="relative flex w-2 h-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A227]/60" />
                          <span className="relative inline-flex w-2 h-2 rounded-full bg-[#C9A227]" />
                        </span>
                        <span className="text-xs font-bold tracking-wide">
                          Schools online now
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#C9A227] shrink-0 bg-white/10 px-2 py-0.5 rounded-sm">
                        {active.count ?? 0}
                      </span>
                    </div>

                    <div className="max-h-[260px] overflow-y-auto py-1">
                      {active.count === 0 ? (
                        <p className="px-4 py-5 text-center text-xs text-white/60">
                          No schools are online at the moment.
                        </p>
                      ) : (
                        active.schools.map((school) => (
                          <div
                            key={school.id}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center bg-[#1B4332] border border-[#C9A227]/30 text-[#C9A227] text-[10px] font-bold shrink-0">
                              {school.school_logo ? (
                                <img src={school.school_logo} alt="" className="w-full h-full object-cover" />
                              ) : (
                                initialsOf(schoolName(school))
                              )}
                            </div>
                            <span className="text-xs font-medium truncate">
                              {schoolName(school)}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="px-4 py-2 border-t border-white/10">
                      <p className="text-[9px] text-white/50 uppercase tracking-widest">
                        Refreshes every 20s · active in last 5 min
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div key={i} className="text-center">
              <div
                className="text-3xl sm:text-[40px] xl:text-[48px] font-bold text-[#1B4332] mb-2 leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs xl:text-sm font-semibold text-[#4B5A4D] uppercase tracking-widest">
                {stat.label}
              </div>
            </div>
          )
        )}
      </div>
    </section>
  );
}