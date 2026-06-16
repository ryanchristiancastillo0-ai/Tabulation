export function GlobalStyles() {
  return (
    <style>{`
      @keyframes spin  { to { transform: rotate(360deg); } }
      @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

      @keyframes hint-scroll {
        0%   { transform: translateX(0); opacity: 0.7; }
        60%  { transform: translateX(5px); opacity: 1; }
        100% { transform: translateX(0); opacity: 0.7; }
      }

      /* ── Force-reset ALL rogue AI wrapper styles ── */
      .ai-rendered-content,
      .ai-rendered-content *:not(table):not(thead):not(tbody):not(tr):not(td):not(th):not(select):not(option) {
        min-height: unset !important;
        height: auto !important;
        max-height: none !important;
        position: static !important;
      }

      .ai-rendered-content div {
        width: 100% !important;
        min-width: 100% !important;
        max-width: none !important;
        min-height: unset !important;
        height: auto !important;
        max-height: none !important;
        position: static !important;
        overflow: visible !important;
        box-sizing: border-box !important;
      }

      .ai-scroll-container {
        width: 100%;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
        scrollbar-color: #cbd5e1 transparent;
      }
      .ai-scroll-container::-webkit-scrollbar        { height: 4px; }
      .ai-scroll-container::-webkit-scrollbar-track  { background: transparent; }
      .ai-scroll-container::-webkit-scrollbar-thumb  { background: #cbd5e1; border-radius: 999px; }

      .ai-rendered-content {
        font-size: clamp(11px, 1.8vw, 14px);
        display: inline-block;
        min-width: 100%;
      }
      .ai-rendered-content table {
        min-width: 540px;
        width: max-content;
        border-collapse: collapse;
        table-layout: auto;
      }
      .ai-rendered-content td,
      .ai-rendered-content th {
        white-space: nowrap;
        word-break: normal;
        box-sizing: border-box;
      }
      .ai-rendered-content select,
      .ai-rendered-content .score-dropdown {
        min-width: 58px;
        max-width: 100px;
      }
      .ai-rendered-content > div > table,
      .ai-rendered-content table {
        width: 100% !important;
        min-width: 100% !important;
        box-sizing: border-box !important;
      }

      .scroll-hint { display: none; }
      @media (max-width: 639px) {
        .scroll-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #94a3b8;
          padding: 6px 14px 2px;
          animation: hint-scroll 1.8s ease-in-out infinite;
        }
      }
    `}</style>
  );
}