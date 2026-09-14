// services/exportService.js
// Shared download helpers for the leaderboard and any future reporting UI.
//     CSV   → lightweight, universal
//     XLSX  → true Excel workbook via the `xlsx` (SheetJS) package
//     PNG   → html2canvas capture of an on-page table element

import * as XLSX from 'xlsx';

// ── CSV ───────────────────────────────────────────────────────────────────────
const csvEscape = (v) => {
  const s = String(v ?? '');
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? `"${s.replace(/"/g, '""')}"`
    : s;
};

/**
 * Downloads a 2D dataset as a CSV file.
 * @param {string} filename e.g. "standings.csv"
 * @param {string[]} headers Column headers
 * @param {Array<Array<string|number|null|undefined>>} rows Row data
 */
export function exportToCSV(filename, headers, rows) {
  const lines = [
    headers.map(csvEscape).join(','),
    ...rows.map((r) => r.map(csvEscape).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── XLSX ──────────────────────────────────────────────────────────────────────
const normalizeSheets = (sheets) => {
  const list = Array.isArray(sheets) ? sheets : [sheets];
  return list.map((s, i) => ({
    name: s.name || `Sheet${i + 1}`,
    headers: s.headers || [],
    rows: s.rows || [],
  }));
};

/**
 * Downloads a true .xlsx workbook (one or more sheets).
 * @param {string} filename e.g. "standings.xlsx"
 * @param {Array<{name?: string, headers: string[], rows: unknown[][]}> | {headers: string[], rows: unknown[][]}} sheets
 *        A single sheet object, or an array of sheets (one worksheet each).
 */
export function exportToXLSX(filename, sheets) {
  const wb = XLSX.utils.book_new();
  normalizeSheets(sheets).forEach(({ name, headers, rows }) => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    // Excel sheet names are capped at 31 chars and cannot contain \ / ? * [ ]
    const safe = name.replace(/[\\/?*[\]]/g, '-').slice(0, 31) || 'Sheet';
    XLSX.utils.book_append_sheet(wb, ws, safe);
  });
  XLSX.writeFile(wb, filename);
}

// ── PNG ──────────────────────────────────────────────────────────────────────
// Handles html2canvas's lack of support for modern CSS color functions
// like oklab, oklch, color-mix() which Tailwind v3/v4 and modern browsers use.

/**
 * Creates a tiny fixed modal to display messages on screen instead of the console.
 */
function showModal(message) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: #222;
    color: #fff;
    padding: 12px 16px;
    border-radius: 6px;
    z-index: 999999;
    font-family: sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: opacity 0.3s ease;
    max-width: 300px;
    word-wrap: break-word;
  `;
  modal.textContent = message;

  modal.addEventListener('click', () => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  });

  document.body.appendChild(modal);

  setTimeout(() => {
    if (modal.parentNode) {
      modal.style.opacity = '0';
      setTimeout(() => {
        if (modal.parentNode) modal.parentNode.removeChild(modal);
      }, 300);
    }
  }, 5000);
}

/**
 * Clones an element and replaces all computed styles that contain
 * unsupported color functions (oklab, oklch, color-mix, etc.) with
 * their resolved hex/rgb equivalents so html2canvas can render them.
 */
function sanitizeElementForCapture(el) {
  const clone = el.cloneNode(true);

  clone.style.position = 'fixed';
  clone.style.top = '-99999px';
  clone.style.left = '-99999px';
  clone.style.zIndex = '-1';
  clone.style.width = el.offsetWidth + 'px';
  document.body.appendChild(clone);

  const sourceEls = [el, ...el.querySelectorAll('*')];
  const cloneEls = [clone, ...clone.querySelectorAll('*')];

  const UNSUPPORTED = /oklab|oklch|color-mix|color\(/;

  const PROPS = [
    'color', 'backgroundColor', 'borderColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'textDecorationColor', 'caretColor', 'fill', 'stroke',
    'boxShadow', 'backgroundImage',
  ];

  sourceEls.forEach((srcEl, i) => {
    const cloneEl = cloneEls[i];
    if (!cloneEl) return;
    const computed = window.getComputedStyle(srcEl);

    PROPS.forEach((prop) => {
      const val = computed.getPropertyValue(
        prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
      );
      if (val && UNSUPPORTED.test(val)) {
        const resolved = resolveColor(srcEl, prop);
        if (resolved) {
          try {
            cloneEl.style[prop] = resolved;
          } catch {
            // Some props (boxShadow) are complex — skip if can't set directly
          }
        }
      }
    });
  });

  return clone;
}

/**
 * Resolves a CSS color property on an element to a safe rgb() string
 * by temporarily applying a known background and sampling the canvas pixel.
 * Falls back to 'transparent' if resolution fails.
 */
function resolveColor(el, prop) {
  try {
    const computed = window.getComputedStyle(el);
    const val = computed[prop];
    if (!val || val === 'none' || val === 'transparent') return null;

    const div = document.createElement('div');
    div.style.cssText = `
      position: fixed; top: -9999px; left: -9999px;
      width: 1px; height: 1px;
      background: ${prop === 'color' ? 'transparent' : ''};
      ${prop}: ${val};
    `;
    document.body.appendChild(div);

    const resolved = window.getComputedStyle(div).getPropertyValue(
      prop.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    );
    document.body.removeChild(div);

    if (!resolved || /oklab|oklch|color-mix/.test(resolved)) {
      return prop === 'color' ? '#14201A' : '#ffffff';
    }
    return resolved;
  } catch {
    return null;
  }
}

/**
 * Loads html2canvas from CDN if not already present.
 */
async function loadHtml2Canvas() {
  if (window.html2canvas) return;

  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/**
 * Captures the element with id=tableId as a PNG and triggers download.
 * @param {string} tableId  - The DOM id of the element to capture
 * @param {string} filename - Downloaded file name (e.g. "standings.png")
 */
export async function exportToPNG(tableId, filename) {
  try {
    await loadHtml2Canvas();

    const el = document.getElementById(tableId);
    if (!el) {
      showModal(`[exportToPNG] Element #${tableId} not found.`);
      return;
    }

    const clone = sanitizeElementForCapture(el);

    try {
      const canvas = await window.html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: el.offsetWidth,
        height: el.offsetHeight,
        windowWidth: document.documentElement.scrollWidth,
        windowHeight: document.documentElement.scrollHeight,
      });

      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    } finally {
      if (clone.parentNode) clone.parentNode.removeChild(clone);
    }
  } catch (err) {
    showModal(`[exportToPNG] Failed to export PNG: ${err.message}`);
    // Surface a friendly alert so the user knows something went wrong
    alert(`PNG export failed: ${err.message}\n\nTry using CSV or Excel export instead.`);
  }
}