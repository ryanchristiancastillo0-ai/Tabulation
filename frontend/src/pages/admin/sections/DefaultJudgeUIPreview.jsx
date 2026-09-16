import React from "react";
import { buildStaticJudgeTable } from "../../../utils/judgeTable";

const SAMPLE_CONTESTANTS = [
  { id: 1, entry_number: 1, name: "Juan Dela Cruz" },
  { id: 2, entry_number: 2, name: "Maria Santos" },
  { id: 3, entry_number: 3, name: "Jose Ramirez" },
];

const SAMPLE_CRITERIA = [
  { id: 1, name: "Performance", percentage: 60 },
  { id: 2, name: "Stage Presence", percentage: 40 },
];

const DefaultJudgeUIPreview = ({ contestants = SAMPLE_CONTESTANTS, criteria = SAMPLE_CRITERIA, contestName = "Event" }) => {
  const rows = (contestants?.length ? contestants : SAMPLE_CONTESTANTS)
    .slice(0, 3)
    .map((c, i) => ({
      id: c.id ?? i + 1,
      entry_number: c.entry_number ?? c.number ?? i + 1,
      name: c.name,
    }));
  const cols = criteria?.length ? criteria : SAMPLE_CRITERIA;

  const tableHtml = buildStaticJudgeTable(rows, cols);

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
        <div dangerouslySetInnerHTML={{ __html: tableHtml }} />
      </div>
    </div>
  );
};

export default DefaultJudgeUIPreview;