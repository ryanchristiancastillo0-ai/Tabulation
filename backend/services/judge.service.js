const crypto = require('crypto');
const pool = require('../config/db');
const HttpError = require('../utils/http-error');
const { rankValues, numeric } = require('../utils/ranks');
const aiModels = require('../ai/ai-models');
const aiService = require('../ai/ai-service');
const { buildStaticJudgeTable } = require('./static-judge-table');
const { DEFAULT_MODEL } = aiModels;

// Dedupes concurrent LLM rendering for the SAME config (prompt + criteria +
// model + ui_mode + school). Both the admin's save-time prewarm and a judge
// page that opens while it's still running call renderUI(); without this they
// would fire two identical (and slow/expensive) B.AI requests at once.
const renderInflight = new Map(); // configHash → Promise<{ html, promptHash }>

// ONLY selects whose id matches a real criterion get normalised.
const SCORE_SELECT_RE = /<select([^>]*?\bid=['"]score[\w-]*['"])([\s\S]*?)<\/select>/gi;

function buildOptions(max) {
  let opts = '<option value="">-</option>';
  for (let i = max; i >= 0; i--) opts += `<option value="${i}">${i}%</option>`;
  return opts;
}

// ── Deterministic dropdown repair ────────────────────────────────────────────
// LLMs routinely emit dropdowns with a hard-coded 0-100 (or 1-100) range no
// matter what the prompt says. After every cached / generated read we rebuild
// every .score-dropdown so the options ALWAYS run 0..criterion.percentage
// (e.g. a 25% criterion gets 0-25, never 0-100). This guarantees the judge UI
// is correct even when the AI output is garbage, and is what the frontend's
// hydrator already does on top.
function normalizeDropdownRanges(html, criteria) {
  if (!html || !Array.isArray(criteria) || !html.includes('select')) return html;
  const maxByCriterion = {};
  criteria.forEach((c) => {
    if (c && c.id !== undefined && c.id !== null) {
      maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
    }
  });
  return html.replace(SCORE_SELECT_RE, (match, attrs, inner) => {
    const attrsCs = String(attrs);
    const idMatch = attrsCs.match(/\bid=['"]score([\w-]*)['"]/);
    if (!idMatch) return match;
    const critId = `score${idMatch[1]}`.split('-')[2] || null;
    const max = critId && maxByCriterion[critId] !== undefined ? maxByCriterion[critId] : null;
    if (max === null) return match;
    return `<select${attrsCs}>${buildOptions(max)}</select>`;
  });
}

// ── Deterministic fallback table (no AI required) ───────────────────────────
// One standard <tr> per contestant: No., Name, one dropdown per criterion,
// Total, Rank. Reused by buildScoreTableHtml (the plain fallback table) and by
// ensureScoreRows (to repair AI designs that rendered a table skeleton without
// any rows — e.g. an empty <tbody>).
function buildScoreRows(contestants, criteria) {
  if (!Array.isArray(contestants) || !Array.isArray(criteria)) return '';
  if (!contestants.length || !criteria.length) return '';

  const maxByCriterion = {};
  criteria.forEach((c) => {
    if (c.id !== undefined && c.id !== null) {
      maxByCriterion[String(c.id)] = Number(c.percentage) || 0;
    }
  });

  return contestants
    .map((c) => {
      const cells = criteria
        .map((cr) => {
          const max = maxByCriterion[String(cr.id)] ?? 100;
          return `<td class="sts-td-stc"><div class="sts-wrap"><select class="score-dropdown" id="score-${c.id}-${cr.id}">${buildOptions(max)}</select></div></td>`;
        })
        .join('');
      return `<tr class="sts-tr">` +
        `<td class="sts-td-num">${Number(c.entry_number) || ''}</td>` +
        `<td class="sts-td-name">${String(c.name || '')}</td>` +
        cells +
        `<td class="sts-td-tot" id="total-${c.id}">0.00</td>` +
        `<td class="sts-td-rank" id="rank-${c.id}">-</td>` +
        `</tr>`;
    })
    .join('');
}

function buildScoreTableHtml({ contestants, criteria }) {
  if (!Array.isArray(contestants) || !Array.isArray(criteria)) return '';
  if (!contestants.length || !criteria.length) return '';

  const head = criteria
    .map((c) => `<th class="sts-th">${String(c.name || '')} <span class="sts-pct">${Number(c.percentage) || 0}%</span></th>`)
    .join('');
  const rows = buildScoreRows(contestants, criteria);

  const css = `
    .sts-table{width:100%;border-collapse:separate;border-spacing:0;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;background:#fff;table-layout:fixed}
    .sts-table thead th.sts-th{background:repeating-linear-gradient(45deg,#f8fafc,#f8fafc 6px,#f4f6f9 6px,#f4f6f9 12px);border-bottom:2px solid #cbd5d9;padding:9px 8px;text-align:center;font-weight:600;font-size:12px;letter-spacing:.02em;color:#334155}
    .sts-table .sts-pct{display:inline-block;margin-left:3px;padding:1px 5px;border-radius:6px;background:#e2e8f0;color:#475569;font-size:10px;font-weight:700}
    .sts-table td{padding:1px 8px;vertical-align:middle;border-bottom:1px solid #eef1f4;text-align:center}
    .sts-table tr:hover td{background:#fafcfd}
    .sts-td-num{width:44px;font-weight:700;color:#334155}
    .sts-td-name{width:170px;text-align:left;font-weight:600;color:#1e293b;padding-left:10px}
    .sts-td-stc{width:96px}
    .sts-td-tot{width:82px;font-weight:700;color:#0f766e}
    .sts-td-rank{width:60px;font-weight:700;color:#155e75}
    .sts-table .sts-wrap{display:flex;align-items:center;justify-content:center;padding:4px 0}
    .sts-table select.score-dropdown{width:74px;height:30px;background:#fff url("data:image/svg+xml;charset=US-ASCII,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2364748b'/%3E%3C/svg%3E") no-repeat right 8px center;border:1px solid #c4ccd3;border-radius:8px;padding:0 10px;font-size:13px;color:#0f172a;text-align:center;font-weight:600;appearance:none;-webkit-appearance:none;cursor:pointer;transition:border-color .15s,box-shadow .15s}
    .sts-table select.score-dropdown:focus{outline:none;border-color:#0f766e;box-shadow:0 0 0 3px rgba(15,118,110,.12)}
    .sts-table select.score-dropdown option{font-weight:400;color:#0f172a}
    .sts-table tr:hover select.score-dropdown{border-color:#94a3b8}
  `;

  return `<style>${css}</style><div class="overflow-x-auto"><table class="sts-table">` +
    `<thead><tr>` +
    `<th style="width:44px" class="sts-th">No.</th>` +
    `<th style="width:170px;text-align:left" class="sts-th">Name</th>` +
    head +
    `<th style="width:82px" class="sts-th">Total</th>` +
    `<th style="width:60px" class="sts-th">Rank</th>` +
    `</tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── Strip anything that is not part of the scoring grid ─────────────────────
function purgeNonScoringElements(html, contestants) {
  if (!html) return html;
  const str = String(html);
  const hasForm    = str.includes('<form');
  const hasButton  = str.includes('<button');
  const hasInput   = str.includes('<input');
  const hasCand    = /[Cc]andidate/.test(str);
  if (!hasForm && !hasButton && !hasInput && !hasCand) return str;
  let out = str;

  out = out.replace(/<form\b[^>]*>/gi, '');
  out = out.replace(/<\/form>/gi, '');
  out = out.replace(/<input\b[^>]*\/?>/gi, '');
  const buttonRe = /<button\b([^>]*)>([\s\S]*?)(?:<\/button>|$)/gi;
  out = out.replace(buttonRe, (m, attrs, inner) => {
    if (/<table\b|<select|<\/button/i.test(inner)) return inner;
    return '';
  });

  out = out.replace(
    />Candidate\s+#?(\d+)</gi,
    (m, num) => `>${num}<`
  );
  out = out.replace(
    />#(\d+)\s*<\/t[dh]>/gi,
    (m, num) => `>${num}</t${m.includes('/td') ? 'd' : 'h'}>`
  );

  const candidateCell = /(No[.,]?\s*[:|-]?\s*Candidates?\s*)(#?\d+)/gi;
  out = out.replace(candidateCell, (m, prefixVal, num) => num.replace('#', ''));

  return out;
}

// ── Prepare: validate input + check ui_cache, one source of hash logic ──────
async function prepareRender({ contestants, criteria, aiPrompt, model, uiMode, provider, school_id }) {
  if (!school_id) throw new HttpError(400, 'school_id is required.');
  if (!contestants?.length || !criteria?.length) {
    throw new HttpError(400, 'contestants and criteria are required.');
  }

  const [rows] = await pool.execute(
    'SELECT contest_name, ai_prompt, ai_model, ai_provider, ui_mode FROM settings WHERE school_id = ? LIMIT 1',
    [school_id]
  );
  const settings = rows[0] || {
    contest_name: 'Event',
    ai_prompt: 'Modern and Professional',
    ai_model: DEFAULT_MODEL,
    ai_provider: aiModels.DEFAULT_PROVIDER,
    ui_mode: 'ai',
  };
  const finalDesignGoal = aiPrompt || settings.ai_prompt || 'Modern and Professional';
  const finalUiMode = uiMode || settings.ui_mode || 'ai';

  // Resolve + coerce to a VALID provider/model combination. save-config rejects
  // invalid pairs strictly; this soft coercion only protects internal/legacy
  // callers from a stale value in the settings row (e.g. pre-migration data).
  // Legacy pre-Groq ids are coalesced here too ('unorouter'/'codestral-latest').
  const providerEntry = aiModels.getProvider(aiModels.coalesceProvider(provider || settings.ai_provider));
  const finalProvider = providerEntry ? providerEntry.name : aiModels.DEFAULT_PROVIDER;
  const rawModel = aiModels.coalesceModel(String(model || settings.ai_model || DEFAULT_MODEL).toLowerCase());
  const finalModel = aiModels.hasModel(finalProvider, rawModel)
    ? rawModel
    : (aiModels.listModels(finalProvider)[0] || DEFAULT_MODEL);

  console.log(`🔧 [prepareRender] school=${school_id} provider=${finalProvider} uiMode=${finalUiMode} model=${finalModel} prompt="${finalDesignGoal?.slice(0,60)}..." contestants=${contestants.length} criteria=${criteria.length}`);

  const criteriaSignature = criteria
    .map((c) => `${c.id}:${c.percentage || 0}`)
    .join(',');

  // The provider is part of the cache key: the same prompt + model can produce
  // different HTML on different providers, so a Groq design must never be
  // served when the admin switched to Gemini (or vice versa).
  const configHash = crypto.createHash('md5')
    .update(`${finalProvider}|${finalDesignGoal}|${criteriaSignature}|${finalModel}|${finalUiMode}|${school_id}`)
    .digest('hex');

  console.log(`🔐 [prepareRender] configHash=${configHash.slice(0,16)} criteriaSig=${criteriaSignature}`);

  const [cache] = await pool.execute(
    `SELECT html_content FROM ui_cache
     WHERE prompt_hash = ? AND school_id = ? AND design_type = ?
       AND NOT (design_type = 'ai' AND (html_content LIKE '%sts-shell%' OR html_content LIKE '%sts-table-wrap%'))
     LIMIT 1`,
    [configHash, school_id, finalUiMode]
  );

  console.log(`💾 [prepareRender] ui_cache hit=${cache.length > 0} hash=${configHash.slice(0,8)}`);

  return {
    settings,
    finalProvider,
    finalDesignGoal,
    finalModel,
    finalUiMode,
    configHash,
    html: cache.length > 0
      ? ensureScoreRows(
          normalizeDropdownRanges(
            purgeNonScoringElements(cache[0].html_content, contestants),
            criteria
          ),
          contestants,
          criteria
        )
      : null,
  };
}

// ── AI prompt builder (shared by one-shot renderUI and the admin stream) ─────
// ONE source of truth for the LLM instruction — the streamed admin generation
// and the (legacy) judge-side generation always send byte-identical prompts.

// Maps a free-form design-goal phrase to a coherent set of concrete Tailwind
// starting classes, so the prompt can hand the model on-theme examples instead
// of leaving color derivation to guesswork. Pure keyword heuristics.
function inferThemeHints(goal) {
  const g = String(goal || '').toLowerCase();
  const has = (words) => words.some((w) => g.includes(w));

  let surfaces = 'bg-slate-900 hover:bg-slate-800';
  let text     = 'text-slate-100';
  let ink      = 'text-slate-900'; // dark ink for white/light surfaces
  let accent   = 'border-slate-500';
  const extra  = [];

  if (has(['dark', 'black', 'night', 'midnight', 'charcoal', 'space', 'slate'])) {
    surfaces = 'bg-slate-950 hover:bg-slate-900';
  }
  if (has(['navy', 'blue', 'indigo', 'azure', 'royal'])) {
    surfaces = 'bg-blue-950 hover:bg-blue-900';
    accent   = 'border-indigo-900';
    ink      = 'text-blue-900';
  }
  if (has(['green', 'emerald', 'forest', 'olive', 'jade'])) {
    surfaces = 'bg-emerald-950 hover:bg-emerald-900';
    accent   = 'border-emerald-500';
    text     = 'text-emerald-50';
    ink      = 'text-emerald-900';
  }
  if (has(['burgundy', 'wine', 'crimson', 'maroon', 'red'])) {
    accent = 'border-red-900';
    text   = 'text-red-100';
    ink    = 'text-red-900';
  }
  if (has(['rose', 'pink', 'magenta', 'fuchsia'])) {
    surfaces = 'bg-rose-950 hover:bg-rose-900';
    accent   = 'border-pink-500';
    text     = 'text-pink-50';
    ink      = 'text-pink-900';
  }
  if (has(['purple', 'violet', 'grape', 'lavender', 'plum'])) {
    surfaces = 'bg-purple-950 hover:bg-purple-900';
    accent   = 'border-purple-500';
    text     = 'text-purple-50';
    ink      = 'text-purple-900';
  }
  if (has(['gold', 'amber', 'yellow'])) {
    accent = 'border-amber-400';
    text   = 'text-amber-100';
    ink    = 'text-amber-900';
  }
  if (has(['cream', 'white', 'ivory', 'beige', 'off-white'])) {
    text = 'text-amber-50';
    ink  = 'text-slate-900';
  }
  if (has(['gradient', 'glamour', 'festive', 'celebration', 'pageant', 'sparkle', 'shine', 'sparkling'])) {
    extra.push('Use bg-linear-to-br with two of YOUR theme colors (from-*/via-*/to-*) on the <th> cells or on the wrapper <div> — NEVER on <tr> (row backgrounds do not paint).');
  }
  if (has(['sport', 'sporty', 'athlet', 'competition', 'scoreboard', 'arena', 'stadium', 'bold', 'grid', 'high-contrast'])) {
    extra.push('Scoreboard style: cover the wrapper <div> with your DARKEST theme surface so the whole screen is themed (e.g. bg-emerald-950), render the table itself as a light card on top (bg-white rounded-xl shadow-lg), and use bold numerals (font-extrabold) for the No., Total, and Rank cells.');
  }
  if (has(['serif', 'elegant', 'formal', 'classic', 'academic', 'vintage', 'luxury', 'glamorous', 'royal', 'ornate'])) {
    extra.push('Use font-serif for a refined, non-generic feel');
  }

  return {
    surfaces,
    text,
    ink,
    accent,
    font:    has(['serif', 'elegant', 'formal', 'classic', 'academic', 'vintage', 'luxury', 'glamorous', 'royal', 'ornate']) ? 'font-serif' : 'font-sans',
    extra:   extra.join('; '),
  };
}

function buildAiInstruction(prep) {
  const criteria    = prep.criteria || [];
  const contestants = prep.contestants || [];
  const totalCols   = 4 + criteria.length; // No., Name, one per criterion, Total, Rank

  const esc = (v) =>
    String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const critCols    = criteria.map((c) => `${c.name} (${c.percentage}%)`).join(' | ');
  const critHeaders = criteria
    .map((c) => `<th class="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide align-middle whitespace-normal break-words">${esc(c.name)}<br><span class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs">${Number(c.percentage) || 0}%</span></th>`)
    .join('\n          ');
  const critCells = criteria
    .map((c) => `<td class="px-1.5 py-1 text-center align-middle"><select class="score-dropdown w-full min-w-0 rounded-md border px-1.5 py-1 text-center text-sm" id="score-1-${c.id}"><option value="">-</option></select></td>`)
    .join('\n          ');

  // The default judge layout, shown so the model reproduces the EXACT column
  // structure. Theme classes are placeholders — the model restyles them, but
  // the <th>/<td> counts and order are fixed. Designed to FIT a laptop with no
  // horizontal scroll: no forced min-width, wrapping headers, compact cells.
  const skeleton = `<div class="w-full min-h-screen p-4 sm:p-6 bg-slate-950">
  <div class="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
    <div class="px-4 py-3 bg-slate-900 text-slate-50">
      <h1 class="text-lg sm:text-xl font-semibold tracking-tight">Official Academic Evaluation Panel</h1>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full table-auto border-separate border-spacing-0">
        <thead>
          <tr>
            <th class="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider align-middle">No.</th>
            <th class="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider align-middle">Name</th>
            ${critHeaders}
            <th class="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider align-middle">Total</th>
            <th class="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wider align-middle">Rank</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="px-2 py-1.5 text-center text-sm tabular-nums">1</td>
            <td class="px-2 py-1.5 text-left text-sm font-medium">First Contestant</td>
            ${critCells}
            <td class="px-2 py-1.5 text-center text-sm font-bold tabular-nums" id="total-1">0.00</td>
            <td class="px-2 py-1.5 text-center text-sm font-bold tabular-nums" id="rank-1">-</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;

  const themeHints = inferThemeHints(prep.finalDesignGoal);

  return `
You are a Senior Tailwind CSS Developer. Produce ONLY the Judge UI markup below.

[HARD RULES]:
- Tailwind ONLY — no <style>, no custom/invented class names (never any sts-*).
- <tbody> MUST contain all ${contestants.length} contestants as real <tr> rows,
  each with a score dropdown. No empty rows, no placeholder comments.
- NEVER color a <tr> (row backgrounds don't paint) — color <th>/<td> only.
- Use ONLY these utility families (guaranteed in compiled CSS): bg-/text-/
  border-/from-/via-/to-/bg-linear-to-*, px-/py-/w-/min-w-/max-w-/overflow-/
  rounded-/shadow-/font-*, align-top/middle/bottom, whitespace-normal/nowrap,
  table-auto, border-separate, border-spacing-0, tracking-*, uppercase,
  transition-colors, ring-*.

[THEME]: "${prep.finalDesignGoal}"

[COLORS — the theme must be OBVIOUS and READABLE]:
- Hint palette for THIS theme — refine freely, stay on-theme:
    dark surfaces: ${themeHints.surfaces}
    LIGHT ink (only on dark surfaces): ${themeHints.text}
    DARK ink (on white/light surfaces): ${themeHints.ink}
    accent: ${themeHints.accent} · font: ${themeHints.font}
${themeHints.extra ? `- ${themeHints.extra}` : ''}
- Paint the WHOLE screen: the outer wrapper <div> takes the theme's darkest bg
  (never a plain white page); the <table> sits on a light card (bg-white
  rounded-xl shadow-lg, NO border/ring). If it could pass for the default table, FAIL.
- TWO-INK LAW — choose ink from the surface DIRECTLY behind the text:
    on the WHITE card (body cells, No., Name, Total, Rank, on-light header cells)
      → DARK ink (${themeHints.ink}, shade 700–950);
    on a DARK/GRADIENT surface (page wrapper, title band, dark header cells, dark
      dropdown) → LIGHT ink (${themeHints.text}, shade 50–200).
  Putting a light-50..300 text class on white/…-50/…-100, or a dark-700..950 text
  class on a …-900/…-950 surface, is the #1 invisible-text bug — NEVER do it.
- TITLE/HEADER BAND: the band needs its OWN dark/gradient theme bg with light text.
  NEVER light text straight on the white card, never dark text on a dark band.
- DROPDOWNS: the text MUST contrast the dropdown's OWN bg/border — dark text on a
  white/light dropdown OR light text on a dark dropdown, never light-on-light; keep
  <option> light-bg/dark-text.
- Target WCAG ≥4.5:1 (≥3:1 for large numerals). If a pair fails, first darken the
  surface (add/strengthen a bg), then adjust the text shade — but KEEP the theme
  hue; never flatten the whole design to plain black/white.
- Hover/focus/selected states must keep the same readable pairing.

[SCHEMA — ONE SOURCE OF TRUTH]:
Criteria are DYNAMIC — exactly ${criteria.length} this request: ${critCols}.
Derive them from [CRITERIA] below. Never invent, never reuse a default set, never
hold a fixed floor of 4 columns.
- Build <thead> from that list: one <th> per criterion, "<name><br>(<percentage>%)".
- Build EVERY <tbody> row from the SAME list, same order, one scoring <td> each.
  Total = ${totalCols} columns: No. | Name | ${critCols} | Total | Rank.
- Header and every row MUST match that schema — a mismatch is a FAILED output.
- <tbody> = EXACTLY ${contestants.length} real rows, no empty rows/comments/<th>.
- Score cells hold ONLY ONE <select class="score-dropdown" id="score-{cId}-{crId}">.

[REFERENCE LAYOUT — copy structure, restyle with YOUR theme]:
${skeleton.split('\n').map(l => '    ' + l).join('\n')}
Placeholder classes only (px-2, text-xs, border) — swap in YOUR theme classes.
One sample row shown: REPEAT it for EACH of the ${contestants.length} contestants
using their real id/entry number/name. Never truncate — partial tables are rejected.

[FIT THE SCREEN — NO HORIZONTAL SCROLL]:
- The table MUST fit a normal laptop with no side scroll. Do NOT force min-width
  and do NOT nowrap every cell: let criterion headers wrap to 2 lines and columns
  shrink (w-full + table-auto). Keep No./Total/Rank and dropdowns nowrap.
- Compact sizing: cells px-2 py-1.5, headers text-xs uppercase tracking-wide,
  body text-sm, dropdowns w-full min-w-0 px-1.5 py-1. No oversized text/padding.
- The overflow-x-auto wrapper is only a safety net for tiny phones — by design the
  grid should already fit without it.

[CONTAINER — you own the page, not just the table]:
- page <div> = w-full min-h-screen p-3 sm:p-5 lg:p-6, theme's darkest bg (gradient ok).
- card <div> = w-full max-w-7xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden.
- title band inside the card: theme bg + contrasting text (see contrast law).
- NO border/ring on the page wrapper or the card — shadow only.
- table-auto NOT table-fixed. No. narrow+centered, Name left, Total/Rank compact.

[SCORE DROPDOWNS]:
- <select class="score-dropdown w-full min-w-0 rounded-md border px-1.5 py-1 text-center text-sm"
  id="score-{cId}-{crId}"> plus YOUR theme border/bg/text/focus classes.
- Contrast applies to the dropdown's OWN bg/border, not the cell; <option> = light
  bg + dark text. No inline styles. Keep the id exact; don't hardcode options.

[PALETTE RULE — CRITICAL]:
Use ONLY the standard named Tailwind palette (rose, pink, fuchsia, purple, violet,
indigo, blue, cyan, teal, emerald, green, amber, yellow, orange, red + white/black,
shades 50–950). NEVER use raw hex/custom colors or non-standard opacity modifiers —
they are NOT compiled, so they render colorless and the theme looks plain. For dark
surfaces prefer the 900/950 shade of the hue, never a custom value.

[MODERN UI RECIPE — APPLY TO EVERY THEME, NO EXCEPTIONS]:
The layout below is fixed for ALL themes; only the palette changes (per the color
law). Follow it literally so any prompt yields a modern, professional result:
1) Page: full-screen themed wrapper (theme gradient or darkest surface) with
   "p-4 sm:p-6"; centered card
   "w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden".
2) Title band across the card top: theme bg/gradient + light ink, a small uppercase
   eyebrow + the contest title ("text-lg sm:text-xl font-semibold"), left-aligned
   with the first column; optional ✦. Never output an unlabeled bare table.
3) Header row: uppercase "text-xs font-semibold tracking-wider" on a tinted band
   (theme 50/100 on light, or theme 800/900 with light ink on dark) + 1px border-b.
4) Body: "text-sm"; subtle hover tint on cells ("hover:bg-{theme}-50" on light,
   "hover:bg-white/10" on dark) and thin row separators. NEVER color <tr>.
5) Criterion percentage: a small pill after the <br>:
   "<br><span class="mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs">60%</span>"
   Keep the <br> so the name and % never overlap.
6) Numerals: "tabular-nums"; bold Total; a Rank pill/badge using the theme accent.
7) Dropdowns: rounded-md border py-1, consistent width, theme focus ring, readable
   ink pairing (dark-on-light OR light-on-dark).
8) Spacing/consistency: even "px-2 sm:px-3 py-2" cells; ONE radius family, ONE soft
   shadow, hairline borders. No double borders, no heavy/colored shadows, no clutter
   (no absolute badges/overlays/icon spam).
- COMMIT to the theme: the wrapper + title band + header tint + dropdown accents must
  make the requested palette obvious. A plain default table = FAIL. Use 2–3 theme
  hues + neutrals — intentional, never random rainbow, never cramped or gaudy.

[DATA]:
- Contest: ${prep.settings.contest_name}
- Contestants: ${JSON.stringify(contestants.map(c => ({ id: c.id, n: c.name, num: c.entry_number })))}
- Criteria: ${JSON.stringify(criteria.map(cr => ({ id: cr.id, name: cr.name, percentage: cr.percentage })))}

[MANDATORY]:
- Render EXACTLY ${contestants.length || 0} rows with the column layout above.
- No. cell = ONLY the literal entry number ("1", "2"…) — no "Candidate"/"#"/"No.".
- Each criterion header = name, then <br>, then "(percentage%)" on the 2nd line.
- Total id="total-{cId}"; Rank id="rank-{cId}".

[FINAL CHECK — before you output]:
- All ${contestants.length || 0} contestants present as real <tr> rows (no placeholders)?
- Header has every criterion + %, and every row has the same cell count?
- Every scoring cell = exactly one score-dropdown select; theme visible with strong
  contrast and NOT painted on any <tr>?
- Is the title/header text readable against ITS OWN band, and does the grid fit with
  no horizontal scroll?
- For EVERY text element, is the ink clearly separated from the surface directly
  behind it (dark ink on white/light, light ink on 900/950/gradient)? No light text
  on white, no dark text on dark, dropdowns included?
- Did you express the [THEME] vividly (gradient wrapper + title band, themed header
  cells and dropdowns) instead of a plain table, using only named palette colors?
If any answer is no, fix it — a partial table is rejected.

[OUTPUT]: ONLY your single outer container <div> holding exactly ONE scoring
<table>. No markdown, no extra top-level elements, no <button>/<form>/<input>.
  `;
}

// ── Finalize raw LLM text into the exact HTML the judge renders ──────────────
// strip code fences → purge any stray buttons/forms/inputs → rebuild every
// dropdown range from the criteria. Shared by the one-shot path and the admin
// stream so both store byte-identical results in ui_cache.
function finalizeAiHtml(rawText, contestants, criteria) {
  console.log(`📨 [finalizeAiHtml] RAW LLM len=${(rawText || '').length} preview="${String(rawText || '').slice(0, 500).replace(/\s+/g, ' ')}"`);
  const cleanTable = String(rawText || '').replace(/```html/g, '').replace(/```/g, '').trim();
  return ensureScoreRows(
    normalizeDropdownRanges(
      purgeNonScoringElements(cleanTable, contestants),
      criteria
    ),
    contestants,
    criteria
  );
}

// ── Repair AI designs that break the scoring grid ───────────────────────────
// Models sometimes return a decorative "shell" (a styled <table> with an EMPTY
// <tbody>, or rows but no dropdowns). We only ever INJECT scoring rows into an
// empty/missing <tbody>. The AI's theme, wrapper, and overall layout are NEVER
// replaced by the built-in static table — the model owns the design; the
// frontend hydrator rebuilds dropdown ids/ranges on render.
// ── Repair AI tables that break column alignment ─────────────────────────────
// Models sometimes return a table whose header doesn't match the rows (e.g. a
// 4-column "No | Name | Total | Rank" <thead> with 8-cell rows, or truncated
// rows). With whitespace-nowrap that produces the "columns scattered with huge
// empty gaps" judge screen. This rebuilds ONLY the broken <thead>/<tbody> in
// canonical column order while sampling the AI's own cell classes so its theme
// survives. Well-formed AI tables pass through byte-for-byte untouched.
function repairScoreTableStructure(html, contestants, criteria) {
  if (typeof html !== 'string' || !html) return html;
  if (!Array.isArray(contestants) || !Array.isArray(criteria)) return html;
  if (!contestants.length || !criteria.length) return html;

  const expectedCols = 4 + criteria.length;
  const tableTag = html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i);
  if (!tableTag) return html;
  const t = tableTag[0];

  const headTr     = t.match(/<thead[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i);
  const headCells  = headTr ? ((headTr[1] || '').match(/<th\b[^>]*>[\s\S]*?<\/th>/gi) || []) : [];
  const bodyMatch  = t.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i);
  const rows       = bodyMatch ? ((bodyMatch[1] || '').match(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi) || []) : [];
  const badRow     = rows.some((r) => (r.match(/<td\b/gi) || []).length !== expectedCols);

  if (headCells.length === expectedCols && rows.length > 0 && !badRow) return html;

  console.log(`🔧 [repairTableStructure] mismatched AI grid head=${headCells.length} rows=${rows.length} expectedCols=${expectedCols} → rebuilding structure, sampling AI theme`);

  const DEFAULT_CLS = 'px-2 py-2 text-center text-xs font-semibold tracking-wide align-middle whitespace-normal';
  const clsOf = (cell, fallback) => {
    if (typeof cell !== 'string') return fallback || DEFAULT_CLS;
    const m = cell.match(/class="([^"]*)"/i);
    return m ? m[1] : (fallback || DEFAULT_CLS);
  };
  // Header cells must be allowed to wrap — an AI class with whitespace-nowrap or
  // truncate makes long criterion names overlap/collide when columns compress.
  const thCls = (cell, fallback) => clsOf(cell, fallback)
    .replace(/\bwhitespace-nowrap\b/g, 'whitespace-normal')
    .replace(/\btruncate\b/g, '')
    .replace(/\s+/g, ' ')
    .trim() || DEFAULT_CLS;
  const cellsOfRow = (r) => (r || '').match(/<td\b[^>]*>[\s\S]*?<\/td>/gi) || [];

  const firstCells = rows.length ? cellsOfRow(rows[0]) : [];
  const clsNo    = clsOf(firstCells[0], DEFAULT_CLS);
  const clsName  = clsOf(firstCells[1], DEFAULT_CLS);
  const scoringTd = (() => {
    for (const r of rows) {
      const c = cellsOfRow(r).find((x) => /<select\b/i.test(x));
      if (c) return c;
    }
    return '';
  })();
  const clsScore = clsOf(scoringTd, 'px-1.5 py-1 text-center align-middle');
  const clsTotal = clsOf(firstCells[firstCells.length - 2] || headCells[headCells.length - 2], 'px-2 py-1 text-center');
  const clsRank  = clsOf(firstCells[firstCells.length - 1] || headCells[headCells.length - 1], 'px-2 py-1 text-center');
  const selTag   = (scoringTd.match(/<select\b[^>]*>/i) || [''])[0];
  let   selClass = clsOf(selTag, '');
  selClass = ('score-dropdown ' + selClass.replace(/\bscore-dropdown\b/g, '').trim()).trim() || 'score-dropdown w-full min-w-0 rounded-md border px-1.5 py-1 text-center text-sm';

  const ths = [
    `<th class="${thCls(headCells[0], DEFAULT_CLS)}">No.</th>`,
    `<th class="${thCls(headCells[1], DEFAULT_CLS)}">Name</th>`,
  ];
  criteria.forEach((cr, i) => {
    ths.push(`<th class="${thCls(headCells[2 + i], thCls(headCells[2], DEFAULT_CLS))}">${String(cr.name || `Criterion ${i + 1}`)}<br>(${Number(cr.percentage) || 0}%)</th>`);
  });
  ths.push(`<th class="${thCls(headCells[headCells.length - 2], DEFAULT_CLS)}">Total</th>`);
  ths.push(`<th class="${thCls(headCells[headCells.length - 1], DEFAULT_CLS)}">Rank</th>`);

  const numOf = (c) => {
    const v = Number(c && c.entry_number);
    return Number.isFinite(v) && v > 0 ? String(v) : '';
  };
  const bodyRows = contestants.map((c) => {
    const crit = criteria.map((cr) => {
      const max = Number(cr.percentage) || 0;
      return `<td class="${clsScore}"><select class="${selClass}" id="score-${c.id}-${cr.id}">${buildOptions(max)}</select></td>`;
    }).join('');
    return `      <tr>
        <td class="${clsNo}">${numOf(c)}</td>
        <td class="${clsName}">${(c && c.name) || ''}</td>
        ${crit}
        <td class="${clsTotal}" id="total-${c.id}">0.00</td>
        <td class="${clsRank}" id="rank-${c.id}">-</td>
      </tr>`;
  }).join('\n');

  const newTable = `${(t.match(/<table\b[^>]*>/i) || ['<table>'])[0]}
    <thead>
      <tr>
        ${ths.join('\n        ')}
      </tr>
    </thead>
    <tbody>
${bodyRows}
    </tbody>
  </table>`;

  return html.slice(0, tableTag.index) + newTable + html.slice(tableTag.index + t.length);
}

// ── Deterministic layout hardening ──────────────────────────────────────────
// LLMs frequently emit `table-fixed` + `whitespace-nowrap` + `min-w-full` (copied
// from older skeletons). With many criteria that forces equal-width columns and
// no wrapping → header labels collide/overlap and the grid scrolls sideways.
// This rewrites ONLY those harmful layout classes and puts each criterion
// percentage on its own line (<br>), leaving every theme color/class untouched.
function normalizeTableLayout(html) {
  if (typeof html !== 'string' || !html) return html;
  let out = html;

  // 1) <table> tag: drop table-fixed / min-w-full / whitespace-nowrap → table-auto.
  out = out.replace(/<table\b[^>]*>/i, (tag) => {
    let t = tag
      .replace(/\btable-fixed\b/g, 'table-auto')
      .replace(/\bmin-w-full\b/g, '')
      .replace(/\bwhitespace-nowrap\b/g, '')
      .replace(/\s+/g, ' ');
    if (/\bclass="/.test(t) && !/\btable-auto\b/.test(t)) {
      t = t.replace(/class="([^"]*)"/, (m, c) => `class="${(c.trim() + ' table-auto').trim()}"`);
    }
    return t.replace(/\s+>/g, '>');
  });

  // 2) <th> cells: allow wrapping (never nowrap/truncate) + <br> before "(NN%)".
  out = out.replace(/<th\b([^>]*)>([\s\S]*?)<\/th>/gi, (m, attrs, inner) => {
    let a = String(attrs).replace(/\bwhitespace-nowrap\b/g, ' ').replace(/\btruncate\b/g, ' ');
    if (/class="/.test(a)) {
      a = a.replace(/class="([^"]*)"/, (mm, c) => {
        const set = new Set(String(c || '').split(/\s+/).filter(Boolean));
        set.add('whitespace-normal');
        set.add('break-words');
        return `class="${Array.from(set).join(' ')}"`;
      });
    } else {
      a += ' class="whitespace-normal break-words"';
    }
    let content = String(inner);
    if (!/<br\s*\/?>/i.test(content)) {
      content = content.replace(/\s*\((\d+(?:\.\d+)?)%\)\s*$/, '<br>($1%)');
    }
    return `<th${a.replace(/\s+/g, ' ').replace(/\s+>/g, '>')}>${content}</th>`;
  });

  return out;
}

// ── Deterministic row identity hydration ─────────────────────────────────────
// LLMs frequently render the CONTESTANT NAME cell with the entry number again
// (e.g. rows showing "1 | 1", "2 | 2") or duplicate whole rows. We can identify
// each scoring row by its ids (score-/total-/rank-<contestantId>) and overwrite
// the first two cells — No. = entry_number, Name = name — using the real data,
// keeping every class/theme intact. Duplicate rows for the same contestant are
// dropped so nobody appears twice.
function hydrateRowIdentity(html, contestants) {
  if (typeof html !== 'string' || !html) return html;
  if (!Array.isArray(contestants) || !contestants.length) return html;

  const escapeHtml = (v) => String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const byId = {};
  contestants.forEach((c) => { if (c && c.id != null) byId[String(c.id)] = c; });

  const seen = new Set();
  return html.replace(/<tbody\b([^>]*)>([\s\S]*?)<\/tbody>/i, (full, tbodyAttrs, inner) => {
    const newInner = inner.replace(/<tr\b([^>]*)>([\s\S]*?)<\/tr>/gi, (rowFull, trAttrs, rowInner) => {
      const idMatch = rowInner.match(/\bid="(?:score|total|rank)-([^-"]+)/i);
      if (!idMatch) return rowFull;
      const cId = idMatch[1];
      const c = byId[cId];
      if (!c) return rowFull;
      const cells = rowInner.match(/<td\b[^>]*>[\s\S]*?<\/td>/gi);
      if (!cells || cells.length < 2) return rowFull;
      if (seen.has(cId)) return ''; // duplicate row for the same contestant
      seen.add(cId);

      const num  = (c.entry_number != null && String(c.entry_number) !== '') ? String(c.entry_number) : '';
      const name = escapeHtml(c.name);
      const setInner = (cell, value) => cell.replace(/(<td\b[^>]*>)[\s\S]*?(<\/td>)/i, `$1${value}$2`);
      let idx = 0;
      const rebuilt = rowInner.replace(/<td\b[^>]*>[\s\S]*?<\/td>/gi, (cell) => {
        idx += 1;
        if (idx === 1) return setInner(cell, num);
        if (idx === 2) return setInner(cell, name);
        return cell;
      });
      return `<tr${trAttrs}>${rebuilt}</tr>`;
    });
    return `<tbody${tbodyAttrs}>${newInner}</tbody>`;
  });
}

function ensureScoreRows(html, contestants, criteria) {
  if (!html) return html;
  const s = hydrateRowIdentity(
    normalizeTableLayout(repairScoreTableStructure(String(html), contestants, criteria)),
    contestants
  );
  const rows = buildScoreRows(contestants, criteria);
  if (!rows) return html; // no contestants/criteria → nothing to inject
  if (!/<table[\s>]/i.test(s)) return s;

  const tableTag = s.match(/<table\b[^>]*>[\s\S]*?<\/table>/i);
  if (!tableTag) return s;

  const t = tableTag[0];
  const hasBody      = /<tbody[\s>]/i.test(t);
  // An AI "shell" can smuggle a placeholder inside <tbody> (e.g. an HTML
  // comment / "No contestant rows"), so a whitespace regex never catches it.
  // Empty = the <tbody> contains no actual <tr> row — comments don't count.
  const bodyInner    = (t.match(/<tbody\b[^>]*>([\s\S]*?)<\/tbody>/i) || [])[1] || '';
  const emptyBody    = hasBody ? !/<tr\b/i.test(bodyInner) : true;

  // ── Diagnostics ─────────────────────────────────────────────
  // The OLD build (still live on Render) used noInputs/expectedCols/headThCount
  // to decide when to FULLY REPLACE the AI table with buildStaticJudgeTable.
  // That branch is DELETED here — the numbers are logged ONLY so you can see
  // exactly what the old trigger saw (e.g. header mismatch / empty tbody).
  const noInputs      = !/score-dropdown/.test(t);
  const expectedCols  = criteria.length + 4;
  const headThCount   = (() => {
    const headRow = t.match(/<thead[\s\S]*?<tr\b[^>]*>([\s\S]*?)<\/tr>/i);
    return headRow ? (headRow[1].match(/<th\b/gi) || []).length : 0;
  })();
  console.log(`[ensureScoreRows] hasBody=${hasBody} emptyBody=${emptyBody} noInputs=${noInputs} headThCount=${headThCount} expectedCols=${expectedCols}`);

  // Anything with a populated body is a real AI layout. Keep its markup, theme
  // and classes (normalizeTableLayout has already fixed table-fixed/nowrap and
  // added the <br> header break). NEVER swap the AI design for the built-in
  // static table: the model owns the theme, the front-end hydrator rebuilds the
  // dropdown ids/ranges on render.
  if (hasBody && !emptyBody) {
    console.log(`✅ [ensureScoreRows] KEPT AI DESIGN (layout-normalized, body has rows) bodyRows=${(bodyInner.match(/<tr\b/gi) || []).length}`);
    return s;
  }

  // Empty/missing <tbody> → the AI produced a decorative shell without rows.
  // Inject the canonical scoring rows so the judge can actually score, but keep
  // the AI's own markup, wrapper, and styling around them. No static fallback.
  if (hasBody) {
    console.log(`🔧 [ensureScoreRows] INJECTING canonical rows into AI's empty <tbody> (emptyBody=${emptyBody}) — AI theme preserved`);
    return s.replace(/<tbody\b[^>]*>[\s\S]*?<\/tbody>/i, () => `<tbody>${rows}</tbody>`);
  }

  // No <tbody> tag at all → insert one before </table>, preserving everything
  // else the AI built.
  console.log('🔧 [ensureScoreRows] INSERTING new <tbody> into AI table (no <tbody> found) — AI theme preserved');
  return s.replace(/(<\/table\s*>)/i, `<tbody>${rows}</tbody>$1`);
}

// ── RENDER JUDGE SCORING TABLE (AI-generated) ──
async function renderUI({ contestants, criteria, aiPrompt, model, uiMode, provider, school_id }) {
  const prep = await prepareRender({ contestants, criteria, aiPrompt, model, uiMode, provider, school_id });

  if (prep.html) {
    console.log(`⚡ [renderUI] returning cached HTML hash=${prep.configHash.slice(0,8)}`);
    return { html: prep.html, promptHash: prep.configHash };
  }

  if (prep.finalUiMode === 'default') {
    console.log(`📋 [renderUI] uiMode=default — building static table`);
    const table = buildStaticJudgeTable(contestants, criteria);
    await pool.execute(
      `INSERT INTO ui_cache (prompt_hash, school_id, design_type, html_content)
       VALUES (?, ?, 'default', ?)
       ON DUPLICATE KEY UPDATE
         design_type  = VALUES(design_type),
         html_content = VALUES(html_content)`,
      [prep.configHash, school_id, table]
    );
    console.log(`✅ [renderUI] static table cached hash=${prep.configHash.slice(0,8)}`);
    return { html: table, promptHash: prep.configHash };
  }

  const hash = prep.configHash;
  const inflight = renderInflight.get(hash);
  if (inflight) {
    console.log(`♻️ [renderUI] reusing in-flight AI generation hash=${hash.slice(0, 8)}`);
    return inflight;
  }

  const instruction = buildAiInstruction(prep);
  console.log(`🤖 [renderUI] calling ai-service provider=${prep.finalProvider} model=${prep.finalModel} promptLength=${instruction.length}`);
  const job = (async () => {
    const tableHTML = await aiService.generate({
      provider: prep.finalProvider,
      model: prep.finalModel,
      prompt: instruction,
    });
    console.log(`📥 [renderUI] ai response returned length=${tableHTML.length} RESPONSE_PREVIEW="${tableHTML.slice(0, 300).replace(/\s+/g, ' ')}"`);

    const finalTable = finalizeAiHtml(tableHTML, contestants, criteria);

    await pool.execute(
      `INSERT INTO ui_cache (prompt_hash, school_id, design_type, html_content)
       VALUES (?, ?, 'ai', ?)
       ON DUPLICATE KEY UPDATE
         design_type  = VALUES(design_type),
         html_content = VALUES(html_content)`,
      [hash, school_id, finalTable]
    );

    console.log(`✅ [renderUI] AI table cached hash=${hash.slice(0, 8)} finalLength=${finalTable.length}`);
    return { html: finalTable, promptHash: hash };
  })();
  job.finally(() => renderInflight.delete(hash)).catch(() => {});
  renderInflight.set(hash, job);
  return job;
}

// ── SUBMIT SCORES (transaction) ──
async function submitScores({ judgeId, scores, school_id }) {
  if (!judgeId || !scores) throw new HttpError(400, 'Missing Judge ID or Scores');
  if (!school_id) throw new HttpError(400, 'Missing school_id');
  if (!Array.isArray(scores) || scores.length === 0) {
    throw new HttpError(400, 'Scores array is empty');
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const sql = `
      INSERT INTO scores (school_id, judge_id, contestant_id, criterion_id, score_value)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE score_value = VALUES(score_value)
    `;
    for (const s of scores) {
      await connection.execute(sql, [school_id, judgeId, s.contestantId, s.criterionId, s.value]);
    }
    await connection.commit();
    return { success: true, message: 'Scores successfully saved' };
  } catch (dbErr) {
    await connection.rollback();
    throw dbErr;
  } finally {
    connection.release();
  }
}

// ── MY SCORES (contestant totals for a judge) ──
async function getMyScores(schoolId, judgeId) {
  if (!judgeId) throw new HttpError(400, 'Judge ID is required');
  if (!schoolId) throw new HttpError(400, 'school_id is required');

  const [settings] = await pool.execute(
    'SELECT computation_type, tie_break_method FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );
  const tieBreak = settings[0]?.computation_type === 'custom'
    ? (settings[0].tie_break_method || 'midrank')
    : 'midrank';

  const [rankings] = await pool.execute(
    `SELECT c.id, c.name, SUM(s.score_value) as total
     FROM   scores      s
     JOIN   contestants c ON s.contestant_id = c.id AND c.school_id = ?
     WHERE  s.judge_id  = ? AND s.school_id = ?
     GROUP  BY c.id, c.name`,
    [schoolId, judgeId, schoolId]
  );

  const ranked = rankValues(
    rankings.map(r => ({ ...r, total: numeric(r.total), value: numeric(r.total) })),
    { method: tieBreak, ascending: false }
  );

  return ranked.map(r => ({
    id:    r.id,
    name:  r.name,
    total: r.total,
    rank:  r.rank,
  }));
}

// ── MY RAW SCORES (for UI persistence) ──
async function getMyScoresRaw(schoolId, judgeId) {
  if (!schoolId) throw new HttpError(400, 'school_id is required');

  const [scores] = await pool.execute(
    `SELECT contestant_id, criterion_id, score_value
     FROM   scores
     WHERE  judge_id   = ? AND school_id = ?`,
    [judgeId, schoolId]
  );
  return scores;
}

// ── CACHED UI (no AI, safe for background refresh) ──
//
// ✅ FIX (this is the bug that was eating your prompt changes):
//
// Previously this function accepted ONLY (schoolId, criteriaSignature) and
// read the prompt/model/ui_mode from the settings row. So the hash it
// computed was based on whatever the settings table currently held. But the
// browser tab just re-fetched config via STEP 1b and already had the NEW
// prompt in memory. If the settings write hadn't propagated yet, the two
// sides disagreed:
//
//     client computes localStorage key from  NEW prompt
//     server computes cache hash from      OLD prompt  → returns OLD design
//
// The client then saved that OLD design into localStorage under the NEW
// prompt's key — permanently poisoning the cache: every subsequent judge
// load would read the poisoned local slot and show the old design forever,
// even after the AI worker generated the correct new one.
//
// Now the client sends prompt/model/ui_mode as query params (see
// judge.controller.js → renderUICached). We prefer those over the settings
// row so the server computes the hash from the *same* values the browser
// already has. Even during a settings-write race, the hash matches what the
// browser expects, and the response is therefore safe to cache.
async function getCachedUI(schoolId, criteriaSignature, aiPromptOverride, aiModelOverride, uiModeOverride, aiProviderOverride) {
  if (!schoolId) throw new HttpError(400, 'school_id is required.');

  const [settings] = await pool.execute(
    'SELECT ai_prompt, ai_model, ai_provider, ui_mode FROM settings WHERE school_id = ? LIMIT 1',
    [schoolId]
  );
  // ✅ prefer the client's explicit values; fall back to settings only when
  // the caller didn't supply them (e.g. an older client or an internal call).
  const aiPrompt = aiPromptOverride || settings[0]?.ai_prompt || 'Modern and Professional';
  const aiModel  = aiModels.coalesceModel(aiModelOverride  || settings[0]?.ai_model)  || DEFAULT_MODEL;
  const uiMode   = uiModeOverride   || settings[0]?.ui_mode   || 'ai';
  const providerEntry = aiModels.getProvider(aiModels.coalesceProvider(aiProviderOverride || settings[0]?.ai_provider));
  const provider = providerEntry ? providerEntry.name : aiModels.DEFAULT_PROVIDER;

  // Mirror prepareRender's coercion EXACTLY: an invalid model for the resolved
  // provider is replaced by that provider's first valid model BEFORE hashing.
  // prepareRender already does this, so without the same step here the judge
  // and the admin generator would disagree on the cache row (permanent miss).
  const finalModel = aiModels.hasModel(provider, aiModel)
    ? aiModel
    : (aiModels.listModels(provider)[0] || DEFAULT_MODEL);

  // Provider is part of the hash — MUST match prepareRender exactly so the judge
  // and the admin generator agree on the same cache row for the same provider.
  const configHash = crypto.createHash('md5')
    .update(`${provider}|${aiPrompt}|${criteriaSignature}|${finalModel}|${uiMode}|${schoolId}`)
    .digest('hex');

  const [cache] = await pool.execute(
    `SELECT html_content FROM ui_cache
     WHERE prompt_hash = ? AND school_id = ? AND design_type = ?
       AND NOT (design_type = 'ai' AND (html_content LIKE '%sts-shell%' OR html_content LIKE '%sts-table-wrap%'))
     LIMIT 1`,
    [configHash, schoolId, uiMode]
  );

  // Exact-hash hit → serve it (the normal, strictly-correct path).
  if (cache.length > 0) {
    console.log(`✅ [getCachedUI] exact-hash hit school=${schoolId} hash=${configHash.slice(0, 8)} type=${uiMode}`);
    return normalizeCachedUi(cache[0].html_content, schoolId, true);
  }

  // ── Safety net: no exact hash match, but the admin just generated SOMETHING
  // for this school. Serve the MOST RECENTLY written design of the SAME type
  // ('ai' or 'default' — mirrors the settings row) instead of making the judge
  // sit on an empty/fallback screen. Stale rows of the other type are never
  // served, so a default-mode save can never shadow an AI design (or vice versa).
  const [latest] = await pool.execute(
    `SELECT html_content FROM ui_cache
     WHERE school_id = ? AND design_type = ?
       AND NOT (design_type = 'ai' AND (html_content LIKE '%sts-shell%' OR html_content LIKE '%sts-table-wrap%'))
     ORDER BY updated_at DESC, id DESC LIMIT 1`,
    [schoolId, uiMode]
  );
  if (latest.length > 0) {
    console.log(`🪄 [getCachedUI] no exact hash hit for school=${schoolId} hash=${configHash.slice(0, 8)} type=${uiMode} — serving most recent ${uiMode} design instead`);
    return normalizeCachedUi(latest[0].html_content, schoolId, true);
  }

  const [contestants] = await pool.execute(
    'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC',
    [schoolId]
  );
  const [criteria] = await pool.execute(
    'SELECT * FROM criteria WHERE school_id = ?',
    [schoolId]
  );

  return {
    html:      buildScoreTableHtml({ contestants, criteria }) || '',
    fromCache: false,
  };
}

// Shared cache-read normalization: purge stray form/button/input elements,
// rebuild dropdown ranges from the criteria, and inject rows into AI designs
// that were cached without any (empty <tbody>).
async function normalizeCachedUi(htmlContent, schoolId, fromCache) {
  const [criteriaRows] = await pool.execute(
    'SELECT * FROM criteria WHERE school_id = ?',
    [schoolId]
  );
  const [contestants] = await pool.execute(
    'SELECT * FROM contestants WHERE school_id = ? ORDER BY entry_number ASC',
    [schoolId]
  );
  return {
    html: ensureScoreRows(
      normalizeDropdownRanges(
        purgeNonScoringElements(htmlContent, contestants),
        criteriaRows
      ),
      contestants,
      criteriaRows
    ),
    fromCache,
  };
}

module.exports = {
  prepareRender,
  renderUI,
  submitScores,
  getMyScores,
  getMyScoresRaw,
  getCachedUI,
  buildAiInstruction,
  finalizeAiHtml,
  buildScoreTableHtml,
  buildScoreRows,
  ensureScoreRows,
  normalizeDropdownRanges,
  purgeNonScoringElements,
};