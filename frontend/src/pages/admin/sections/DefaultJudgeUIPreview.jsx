import React from "react";

// Live preview of the standard (non-AI) Judge scoring table. This mirrors the
// exact markup/CSS the backend's buildScoreTableHtml() produces — an accurate
// static preview so admins know what judges will see without any AI involved.
const SAMPLE_CONTESTANTS = [
  { id: 1, entry_number: 1, name: "Juan Dela Cruz" },
  { id: 2, entry_number: 2, name: "Maria Santos" },
  { id: 3, entry_number: 3, name: "Jose Ramirez" },
];

const SAMPLE_CRITERIA = [
  { id: 1, name: "Performance", percentage: 60 },
  { id: 2, name: "Stage Presence", percentage: 40 },
];

const STYLE = `
  .preview-table{width:100%;border-collapse:separate;border-spacing:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;background:#fff;table-layout:fixed}
  .preview-table thead th.pv-th{background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:10px 8px;text-align:center;font-weight:600;font-size:11.5px;letter-spacing:.01em;color:#475569}
  .preview-table .pv-pct{display:inline-block;margin-left:4px;padding:1px 6px;border-radius:5px;background:#eef2ff;color:#4f46e5;font-size:10px;font-weight:700}
  .preview-table td{padding:9px 8px;vertical-align:middle;border-bottom:1px solid #f1f5f9;text-align:center}
  .preview-table tbody tr:last-child td{border-bottom:none}
  .preview-table tbody tr:nth-child(even){background:#fafbfc}
  .preview-table tbody tr:hover{background:#f4f6fb}
  .pv-td-num{width:44px;font-weight:600;color:#64748b;font-variant-numeric:tabular-nums}
  .pv-td-name{width:170px;text-align:left;font-weight:600;color:#1e293b;padding-left:12px}
  .pv-td-stc{width:96px}
  .preview-table .pv-wrap{display:flex;align-items:center;justify-content:center}
  .preview-table select.pv-dropdown{width:72px;height:30px;background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:0 8px;font-size:12.5px;color:#94a3b8;text-align:center;font-weight:500;appearance:none;-webkit-appearance:none;cursor:not-allowed;pointer-events:none}
  .preview-table .pv-tot{font-weight:700;color:#1e293b;font-variant-numeric:tabular-nums}
  .preview-table .pv-rank{font-weight:700;color:#4f46e5}
`;

const DefaultJudgeUIPreview = ({ contestants = SAMPLE_CONTESTANTS, criteria = SAMPLE_CRITERIA, contestName = "Event" }) => {
  const rows = (contestants?.length ? contestants : SAMPLE_CONTESTANTS)
    .slice(0, 3)
    .map((c, i) => ({
      id: c.id ?? i + 1,
      entry_number: c.entry_number ?? c.number ?? i + 1,
      name: c.name,
    }));
  const cols = criteria?.length ? criteria : SAMPLE_CRITERIA;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>
          Preview — {contestName || 'Contest'}
        </span>
        <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 8px' }}>
          Standard scoring table
        </span>
      </div>
      <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10, background: '#fff' }}>
        <style>{STYLE}</style>
        <table className="preview-table">
          <thead>
            <tr>
              <th style={{ width: 44 }} className="pv-th">No.</th>
              <th style={{ width: 170, textAlign: 'left', paddingLeft: 12 }} className="pv-th">Name</th>
              {cols.map(c => (
                <th key={String(c.id)} className="pv-th">
                  {String(c.name || '')}<span className="pv-pct">{Number(c.percentage) || 0}%</span>
                </th>
              ))}
              <th className="pv-th">Total</th>
              <th className="pv-th">Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={String(c.id)}>
                <td className="pv-td-num">{c.entry_number}</td>
                <td className="pv-td-name">{c.name}</td>
                {cols.map(cr => (
                  <td className="pv-td-stc" key={`${c.id}-${cr.id}`}>
                    <div className="pv-wrap">
                      <select className="pv-dropdown" value="" disabled>
                        <option value="">-</option>
                      </select>
                    </div>
                  </td>
                ))}
                <td className="pv-tot">0.00</td>
                <td className="pv-rank">-</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DefaultJudgeUIPreview;