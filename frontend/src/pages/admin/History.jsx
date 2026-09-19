import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { USALoader } from '../../components/ui';
import Table from '../../components/ui/Table';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import apiClient from '../../services/api';
import {
  History as HistoryIcon, Eye, Trash2, RefreshCw, X,
  Check, AlertCircle, Sparkles, Scale, Users, MonitorCog,
} from 'lucide-react';

const formatWhen = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

function DesignBadge({ value }) {
  let cls = 'bg-[var(--surface2)] text-[var(--text3)] border-[var(--border)]';
  let label = '—';
  if (value === 'ai') {
    cls = 'bg-[var(--gold-lt)] text-[var(--gold)] border-[var(--gold-bd)]';
    label = 'AI';
  } else if (value === 'default') {
    cls = 'bg-[var(--green-lt)] text-[var(--green)] border-[var(--accent-bd)]';
    label = 'Default';
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider border ${cls}`}>
      {value === 'ai' && <Sparkles size={11} />}
      {value === 'default' && <Check size={11} />}
      {label}
    </span>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formMsg, setFormMsg] = useState(null);
  const [toast, setToast] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [view, setView] = useState({ open: false, loading: false, entry: null });
  const [confirm, setConfirm] = useState(null); // { kind: 'single'|'selected'|'all', id? }

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3200);
  };

  const fetchHistory = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setFormMsg(null);
    try {
      const data = await apiClient.get('/history');
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      setEntries(list);
    } catch (err) {
      console.error('[History] fetch error:', err);
      setFormMsg({ type: 'error', text: 'Failed to load history: ' + err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const refresh = () => {
    fetchHistory(true);
    showToast('success', 'History refreshed.');
  };

  // ── Selection ──
  const allSelected = entries.length > 0 && selected.size === entries.length;
  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(entries.map((e) => e.id)));
  };
  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // ── View ──
  const handleView = async (id) => {
    setView({ open: true, loading: true, entry: null });
    try {
      const detail = await apiClient.get(`/history/${id}`);
      setView({ open: true, loading: false, entry: detail });
    } catch (err) {
      setView({ open: false, loading: false, entry: null });
      setFormMsg({ type: 'error', text: 'Failed to load entry: ' + err.message });
    }
  };

  // ── Delete ──
  const confirmDelete = async () => {
    const kind = confirm.kind;
    setConfirm(null);
    try {
      if (kind === 'all' || kind === 'selected') {
        if (kind === 'all') {
          await apiClient.delete('/history/all');
        } else if (selected.size) {
          await apiClient.post('/history/delete', { ids: [...selected] });
        }
        setSelected(new Set());
        showToast('success', 'History deleted.');
      } else {
        await apiClient.post('/history/delete', { ids: [confirm.id] });
        showToast('success', 'History entry deleted.');
      }
      await fetchHistory(true);
    } catch (err) {
      showToast('error', 'Delete failed: ' + err.message);
    }
  };

  const confirmMeta = (() => {
    if (!confirm) return null;
    if (confirm.kind === 'all') {
      return { title: 'Delete All History?', message: 'This will permanently delete every saved configuration entry. This cannot be undone.' };
    }
    if (confirm.kind === 'selected') {
      return { title: `Delete ${selected.size} Selected Entries?`, message: 'The selected configuration history entries will be permanently deleted. This cannot be undone.' };
    }
    return { title: 'Delete History Entry?', message: 'This configuration history entry will be permanently deleted. This cannot be undone.' };
  })();

  const setActiveNavFromTab = (tab) => {
    if (tab === 'overview') navigate('/admin/dashboard?tab=overview');
    else if (tab === 'contest') navigate('/admin/dashboard?tab=contest');
    else if (tab === 'ai') navigate('/admin/dashboard?tab=ai');
    else if (tab === 'criteria') navigate('/admin/dashboard?tab=criteria');
    else if (tab === 'judges') navigate('/admin/dashboard?tab=judges');
    else if (tab === 'contestants') navigate('/admin/dashboard?tab=contestants');
    else if (tab === 'system') navigate('/admin/dashboard?tab=system');
  };

  const columns = [
    {
      key: 'sel',
      header: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={toggleAll}
          className="accent-[var(--accent)] cursor-pointer"
        />
      ),
      headerClass: 'pl-4 pr-1 py-3',
      cellClass: 'pl-4 pr-1',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleOne(row.id)}
          className="accent-[var(--accent)] cursor-pointer"
        />
      ),
    },
    {
      key: 'id',
      header: '#',
      headerClass: 'px-2',
      render: (row) => <span className="font-mono text-[var(--text3)]">#{row.id}</span>,
    },
    {
      key: 'created_at',
      header: 'Saved At',
      headerClass: 'px-2',
      render: (row) => <span className="whitespace-nowrap">{formatWhen(row.created_at)}</span>,
    },
    {
      key: 'contest_name',
      header: 'Contest',
      headerClass: 'px-2',
      render: (row) => (
        <div className="min-w-0">
          <div className="font-semibold text-[var(--text1)]">{row.contest_name || <span className="text-[var(--text3)]">—</span>}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text3)]">ID {row.id}</div>
        </div>
      ),
    },
    {
      key: 'judge_count',
      header: 'Judges',
      headerClass: 'px-2 text-center',
      cellClass: 'text-center',
      render: (row) => <span className="font-semibold">{row.judge_count ?? '—'}</span>,
    },
    {
      key: 'design_type',
      header: 'UI Mode',
      headerClass: 'px-2 text-center',
      cellClass: 'text-center',
      render: (row) => <DesignBadge value={row.design_type} />,
    },
    {
      key: 'criteria',
      header: 'Criteria',
      headerClass: 'px-2 text-center',
      cellClass: 'text-center',
      render: (row) => <span className="font-semibold">{row.criteria}</span>,
    },
    {
      key: 'contestants',
      header: 'Contestants',
      headerClass: 'px-2 text-center',
      cellClass: 'text-center',
      render: (row) => <span className="font-semibold">{row.contestants}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClass: 'px-2 pr-4 text-right',
      cellClass: 'px-2 pr-4 text-right whitespace-nowrap',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleView(row.id)}
            title="View entry"
            className="p-2 rounded-sm border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--accent)] hover:border-[var(--accent-bd)] transition-colors"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => setConfirm({ kind: 'single', id: row.id })}
            title="Delete entry"
            className="p-2 rounded-sm border border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)] hover:bg-red-100 hover:border-rose-300 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ];

  const toolbar = (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--surface2)]/60">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text2)]">
        <span>{entries.length} saved {entries.length === 1 ? 'entry' : 'entries'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button
          onClick={refresh}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold border border-[var(--border)] bg-[var(--surface)] text-[var(--text2)] hover:text-[var(--accent)] hover:border-[var(--accent-bd)] transition-colors"
        >
          <RefreshCw size={13} />
          Refresh
        </button>
        <button
          onClick={() => setConfirm({ kind: 'selected' })}
          disabled={!selected.size}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold border border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-red-100 hover:border-rose-300"
        >
          <Trash2 size={13} />
          Delete Selected ({selected.size})
        </button>
        <button
          onClick={() => setConfirm({ kind: 'all' })}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-bold border border-[#be123c]/30 bg-[#be123c]/10 text-[#be123c] hover:bg-red-100 hover:border-[#be123c]/50 transition-colors"
        >
          <Trash2 size={13} />
          Delete All
        </button>
      </div>
    </div>
  );

  return (
    <>
      <AdminLayout activeNav="" setActiveNav={setActiveNavFromTab} drawerActiveNav="">
        {/* Header */}
        <div className="flex justify-between gap-3 sm:gap-4 mb-5 lg:mb-8 items-start">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-widest mb-2 bg-[var(--gold-lt)] text-[var(--gold)] border border-[var(--gold-bd)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]" />
              Admin History
            </div>
            <h1 className="heading-serif text-2xl font-bold tracking-tight text-[var(--text1)]">
              Configuration History
            </h1>
            <div className="gold-rule mt-2.5" />
          </div>
        </div>

        <div className="h-px mb-8 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />

        {formMsg && (
          <div className={`flex items-center gap-2 p-3 rounded-sm text-xs font-medium mb-6 border ${formMsg.type === 'success' ? 'border-[var(--accent-bd)] bg-[var(--green-lt)] text-[var(--green)]' : 'border-[#fecdd3] bg-[var(--red-lt)] text-[var(--red)]'}`}>
            {formMsg.type === 'success' ? <Check size={14} className="shrink-0" /> : <AlertCircle size={14} className="shrink-0" />}
            <span>{formMsg.text}</span>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <USALoader fullScreen={false} prompt="Loading history…" background="transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="panel p-6">
            <EmptyState
              icon={HistoryIcon}
              title="No history saved yet"
              message="Every time you click Save Config, a snapshot of the contest setup, criteria, contestants, judges, and UI mode (AI or Default) is recorded here automatically."
              action={
                <button
                  onClick={refresh}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-xs font-semibold border border-[var(--border)] bg-[var(--surface2)] text-[var(--text2)] hover:text-[var(--accent)] transition-colors"
                >
                  <RefreshCw size={13} />
                  Refresh
                </button>
              }
            />
          </div>
        ) : (
          <Table
            id="history-table"
            columns={columns}
            rows={entries}
            rowKey={(row) => row.id}
            minWidth={860}
            banner={toolbar}
            emptyMessage="No history entries to show yet."
            emptyColSpan={columns.length}
            className="mb-6"
          />
        )}
      </AdminLayout>

      {toast && (
        <div className={`save-toast ${toast.type === 'error' ? 'bg-[#be123c]' : ''}`}>
          <span>{toast.type === 'error' ? '✗' : '✓'}</span> {toast.msg}
        </div>
      )}

      {/* ── View detail modal ── */}
      {view.open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-8 overflow-y-auto" style={{ fontFamily: "'Inter', sans-serif" }}>
          <div className="absolute inset-0 bg-[#0B1710]/60 backdrop-blur-sm" onClick={() => setView((v) => ({ ...v, open: false }))} />
          <div className="relative w-full max-w-2xl bg-[var(--surface)] border border-[var(--border)] rounded-sm shadow-2xl animate-in zoom-in-95 duration-200 mt-4 sm:mt-10">
            {/* Header */}
            <div className="bg-[#1B4332] px-6 sm:px-8 py-6">
              <button
                onClick={() => setView((v) => ({ ...v, open: false }))}
                className="absolute right-4 top-4 p-1.5 rounded-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
              <div className="w-10 h-[3px] bg-[#C9A227] mb-4" />
              <div className="flex items-center gap-3 pr-8">
                <div className="p-2 rounded-sm bg-white/10 border border-white/20 shrink-0">
                  <HistoryIcon size={22} className="text-[#C9A227]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-white text-lg sm:text-xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      History Entry {view.entry ? `#${view.entry.id}` : ''}
                    </h3>
                    {view.entry?.design_type && <DesignBadge value={view.entry.design_type} />}
                  </div>
                  {view.entry?.created_at && (
                    <p className="text-[11px] text-white/60 mt-0.5">{formatWhen(view.entry.created_at)}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Body */}
            {view.loading || !view.entry ? (
              <div className="flex items-center justify-center py-16">
                <USALoader fullScreen={false} prompt="Loading entry…" background="transparent" />
              </div>
            ) : (
              <div className="px-6 sm:px-8 py-6 space-y-6">
                {/* Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Contest Name', value: view.entry.contest_name || '—' },
                    { label: 'Judges', value: view.entry.judge_count ?? '—' },
                    { label: 'Configured UI', value: view.entry.ui_mode || '—' },
                    { label: 'Cached Design', value: view.entry.design_type || '—' },
                    { label: 'Computation', value: view.entry.computation_type || '—' },
                    { label: 'Tie Break', value: view.entry.tie_break_method || '—' },
                  ].map((item, i) => (
                    <div key={i} className="p-3 rounded-sm bg-[var(--surface2)] border border-[var(--border)]">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--text3)] font-semibold">{item.label}</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--text1)] break-words">{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Settings / prompt */}
                {view.entry.snapshot?.settings && (
                  <div className="panel p-4 sm:p-5">
                    <div className="section-heading" style={{ margin: 0 }}>Settings Snapshot</div>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="field-label">AI Prompt</div>
                        <div className="text-sm text-[var(--text2)] leading-relaxed break-words whitespace-pre-wrap bg-[var(--surface2)] border border-[var(--border)] rounded-sm p-3">
                          {view.entry.snapshot.settings.ai_prompt || '—'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          { label: 'AI Model', value: view.entry.snapshot.settings.ai_model },
                          { label: 'AI Provider', value: view.entry.snapshot.settings.ai_provider },
                          { label: 'Contest Type', value: view.entry.snapshot.settings.contest_type },
                          { label: 'Judges Locked', value: view.entry.snapshot.settings.is_judge_locked ? 'Yes' : 'No' },
                          { label: 'Prompt Hash', value: view.entry.prompt_hash },
                        ].map((item, i) => (
                          <div key={i}>
                            <div className="field-label">{item.label}</div>
                            <div className="text-sm font-semibold text-[var(--text1)] break-words">{item.value || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Criteria */}
                <div className="panel p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Scale size={14} className="text-[var(--text3)]" />
                    <div className="section-heading" style={{ margin: 0 }}>Criteria ({view.entry.snapshot?.criteria?.length || 0})</div>
                  </div>
                  {(view.entry.snapshot?.criteria?.length || 0) > 0 ? (
                    <div className="mt-4 overflow-hidden border border-[var(--border)] rounded-sm">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-[var(--accent)] text-white">
                          <tr>
                            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold">Criterion</th>
                            <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider font-semibold w-24">Weight</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {view.entry.snapshot.criteria.map((c) => (
                            <tr key={c.id} className="hover:bg-[var(--accent-lt)]">
                              <td className="px-3 py-2.5 font-medium text-[var(--text1)]">{c.name}</td>
                              <td className="px-3 py-2.5 text-right font-mono text-[var(--text2)]">{c.percentage}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--text3)]">No criteria in this snapshot.</p>
                  )}
                </div>

                {/* Contestants */}
                <div className="panel p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-[var(--text3)]" />
                    <div className="section-heading" style={{ margin: 0 }}>Contestants ({view.entry.snapshot?.contestants?.length || 0})</div>
                  </div>
                  {(view.entry.snapshot?.contestants?.length || 0) > 0 ? (
                    <div className="mt-4 overflow-hidden border border-[var(--border)] rounded-sm">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="bg-[var(--accent)] text-white">
                          <tr>
                            <th className="text-right px-3 py-2 text-[10px] uppercase tracking-wider font-semibold w-16">No.</th>
                            <th className="text-left px-3 py-2 text-[10px] uppercase tracking-wider font-semibold">Contestant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border)]">
                          {view.entry.snapshot.contestants.map((c) => (
                            <tr key={c.id} className="hover:bg-[var(--accent-lt)]">
                              <td className="px-3 py-2.5 text-right font-mono text-[var(--text3)]">{c.entry_number}</td>
                              <td className="px-3 py-2.5 font-medium text-[var(--text1)]">{c.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-[var(--text3)]">No contestants in this snapshot.</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-3 text-[11px] text-[var(--text3)]">
                    <MonitorCog size={12} />
                    Snapshot recorded automatically on save.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        isOpen={!!confirm}
        title={confirmMeta?.title || 'Confirm'}
        message={confirmMeta?.message || ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setConfirm(null)}
        danger
      />
    </>
  );
}