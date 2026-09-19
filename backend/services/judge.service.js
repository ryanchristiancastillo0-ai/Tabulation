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
  let accent   = 'border-slate-500';
  const extra  = [];

  if (has(['dark', 'black', 'night', 'midnight', 'charcoal', 'space', 'slate'])) {
    surfaces = 'bg-slate-950 hover:bg-slate-900';
  }
  if (has(['navy', 'blue', 'indigo', 'azure', 'royal'])) {
    surfaces = 'bg-blue-950 hover:bg-blue-900';
    accent   = 'border-indigo-900';
  }
  if (has(['green', 'emerald', 'forest', 'olive', 'jade'])) {
    surfaces = 'bg-emerald-950 hover:bg-emerald-900';
    accent   = 'border-emerald-500';
    text     = 'text-emerald-50';
  }
  if (has(['burgundy', 'wine', 'crimson', 'maroon', 'red'])) {
    accent = 'border-red-900';
    text   = 'text-red-100';
  }
  if (has(['rose', 'pink', 'magenta', 'fuchsia'])) {
    surfaces = 'bg-rose-950 hover:bg-rose-900';
    accent   = 'border-pink-500';
    text     = 'text-pink-50';
  }
  if (has(['purple', 'violet', 'grape', 'lavender', 'plum'])) {
    surfaces = 'bg-purple-950 hover:bg-purple-900';
    accent   = 'border-purple-500';
    text     = 'text-purple-50';
  }
  if (has(['gold', 'amber', 'yellow'])) {
    accent = 'border-amber-400';
    text   = 'text-amber-100';
  }
  if (has(['cream', 'white', 'ivory', 'beige', 'off-white'])) {
    text = 'text-amber-50';
  }
  if (has(['gradient', 'glamour', 'festive', 'celebration', 'pageant', 'sparkle', 'shine', 'sparkling'])) {
    extra.push('Use bg-linear-to-br with two of YOUR theme colors (from-*/via-*/to-*) on the <th> cells or on the wrapper <div> — NEVER on <tr> (row backgrounds do not paint).');
  }
  if (has(['serif', 'elegant', 'formal', 'classic', 'academic', 'vintage', 'luxury', 'glamorous', 'royal', 'ornate'])) {
    extra.push('Use font-serif for a refined, non-generic feel');
  }

  return {
    surfaces,
    text,
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
    .map((c) => `<th class="px-3 py-2 border-b">${esc(c.name)} (${Number(c.percentage) || 0}%)</th>`)
    .join('\n          ');
  const critCells = criteria
    .map((c) => `<td class="px-2 py-1"><select class="score-dropdown" id="score-1-${c.id}"><option value="">-</option></select></td>`)
    .join('\n          ');

  // The default judge layout, shown so the model reproduces the EXACT column
  // structure. Theme classes are placeholders — the model restyles them, but
  // the <th>/<td> counts and order are fixed.
  const skeleton = `<div class="overflow-x-auto w-full">
  <table class="w-full min-w-full border-separate border-spacing-0 whitespace-nowrap">
    <thead>
      <tr>
        <th class="px-3 py-2 border-b text-center">No.</th>
        <th class="px-3 py-2 border-b text-left">Name</th>
        ${critHeaders}
        <th class="px-3 py-2 border-b text-center">Total</th>
        <th class="px-3 py-2 border-b text-center">Rank</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="px-2 py-1 text-center">1</td>
        <td class="px-2 py-1 text-left">First Contestant</td>
        ${critCells}
        <td class="px-2 py-1 text-center" id="total-1">0.00</td>
        <td class="px-2 py-1 text-center" id="rank-1">-</td>
      </tr>
    </tbody>
  </table>
</div>`;

  const themeHints = inferThemeHints(prep.finalDesignGoal);

  return `
    You are a Senior Tailwind CSS Developer.

    [HARD RULE — READ FIRST]:
    Use ONLY Tailwind CSS utility classes for ALL styling. Do NOT write a
    <style> block. Do NOT invent custom class names — NEVER emit made-up names
    like "sts-shell", "sts-header", "sts-row", "sts-tr", "sts-td-*" or any
    "sts-*" variant. Every visual property (color, spacing, border, shadow,
    font, rounding, gradient) must be a real Tailwind utility class applied
    directly on the HTML element.
    - NEVER leave the <tbody> empty or stuffed with a placeholder comment
      (e.g. "<!-- No contestant rows -->"). Every contestant MUST appear as a
      real <tr> row with a working score dropdown.
    - NEVER put background, gradient, or text-color classes on a <tr> — row
      backgrounds do not paint in browsers. Apply ALL colors to <th>/<td> (or
      to the wrapper <div>) directly.
    - Use ONLY these utility families so every class is guaranteed in the
      compiled CSS: bg-* text-* border-* from-* via-* to-* bg-linear-to-*
      px-* py-* w-* min-w-* max-w-* overflow-* rounded-* shadow-* font-*
      whitespace-nowrap table-fixed border-separate border-spacing-0
      tracking-* uppercase. Anything else is at your risk.

    [THEME]: "${prep.finalDesignGoal}"

    [COLOR SCHEME — HARD REQUIREMENT]:
    - This is REQUIRED, not optional: every background, text, and border color
      must visibly reflect the requested theme. A reviewer must be able to tell
      the design apart from a plain default table at a glance.
    - Derive the FULL palette EXCLUSIVELY from the THEME name. NEVER reuse,
      copy, or guess colors from any other design in this system.
    - Starting points for THIS theme (refine freely, but stay on-theme):
        surfaces:  ${themeHints.surfaces}
        text:      ${themeHints.text}
        accent:    ${themeHints.accent}
        font:      ${themeHints.font}
    ${themeHints.extra ? `    - ${themeHints.extra}` : ''}
    - Strong contrast: dark surfaces with light readable text (or the reverse)
      so names and dropdowns are easy to read.
    - The theme MUST be unmistakable at first glance: a bold colored band on the
      header cells, a tinted wrapper, or styled dropdowns. If the output could
      pass for a plain white table, you FAILED.

    [STRUCTURE — CRITICAL — DO NOT DEVIATE]:
    Your ONLY output is a scoring <table>. The header and EVERY body row MUST
    share the EXACT same column structure — any mismatch in <th>/<td> counts is
    a broken layout. This is the default judge layout; copy it faithfully.
    - The <tbody> MUST be fully populated with EXACTLY ${contestants.length}
      real contestant rows. A skeleton with an empty <tbody> (or a placeholder
      comment) is REJECTED — a reviewer checks for populated rows FIRST.
    - Exactly ${totalCols} columns, in this exact order:
      No. | Name | ${critCols} | Total | Rank
    - The header MUST contain one <th> per criterion showing the name AND its
      percentage (e.g. "Performance (60%)"), plus No., Name, Total, Rank — that
      is ${totalCols} <th> cells total. NEVER emit an empty <th>.
    - The body MUST contain EXACTLY ${contestants.length} <tr> (one per
      contestant) with exactly ${totalCols} <td> cells each, in the same order.
    - Each scoring <td> must contain ONLY ONE control:
      <select class="score-dropdown" id="score-{cId}-{crId}"> ... </select>
      The id pairs the contestant id with the criterion id. No extra text, no
      second boxes, no custom dropdown markup inside the cell.

    [REQUIRED REFERENCE LAYOUT — reproduce this exact structure, restyled with
    YOUR Tailwind theme classes]:
${skeleton.split('\n').map(l => '    ' + l).join('\n')}

    The skeleton above uses STRUCTURE PLACEHOLDER classes only (px-3, border-b,
    etc.) — replace them with your theme's Tailwind color/typography classes.

    [LAYOUT RULES]:
    - Wrap the whole table in <div class="overflow-x-auto w-full"> so a wide
      table scrolls horizontally instead of squeezing/collapsing columns.
    - The <table> itself must use: w-full min-w-full border-separate
      border-spacing-0 whitespace-nowrap. Add table-fixed (or
      [table-layout:fixed]) when you want fixed predictable widths.
    - Keep the No. column narrow and centered, Name left-aligned, and every
      Total/Rank column compact. Do not let any cell shrink below its content.

    [FORM ELEMENT RULES — CRITICAL]:
    - Every <select> must use Tailwind classes only — NO inline styles.
    - Style the <select> to match YOUR theme palette: its bg, text, border, and
      rounded classes come from the colors you derived for [THEME] — nothing else.
    - The bg and text must contrast strongly (readable).
    - Example:
        <select class="score-dropdown border rounded px-2 py-1" id="score-{cId}-{crId}">
          <option>95</option>
        </select>
      Fill in the border/bg/text colors with YOUR theme's palette.
    - ALWAYS add the same bg and text classes to every <option> — browsers ignore parent styles on options.
    - Do NOT hard-code dropdown options — the server rebuilds every dropdown's
      range to match each criterion automatically.

    [CONTEXT]:
    - Contest: ${prep.settings.contest_name}
    - Data: ${JSON.stringify(contestants.map(c => ({ id: c.id, n: c.name, num: c.entry_number })))}
    - Criteria: ${JSON.stringify(criteria.map(cr => ({ id: cr.id, name: cr.name, percentage: cr.percentage })))}

    [MANDATORY]:
    - Render EXACTLY ${contestants.length || 0} rows with the column layout above.
    - The No. column MUST show ONLY the literal entry number (1, 2, 3, …). Never prefix it with "Candidate", "#", "No." etc. If the contestant is number 1, that cell must contain exactly "1".
    - Each criteria column header MUST show name AND percentage: "Performance (60%)"
    - Totals: id="total-{cId}"
    - Ranks: id="rank-{cId}"

    [FINAL CHECK — read before you output]:
    - Are ALL ${contestants.length || 0} contestants present as real <tr> rows? No placeholders, no comments.
    - Does the header contain every criterion WITH its percentage, and does every row have the same cell count?
    - Does every scoring cell contain exactly one <select class="score-dropdown" id="score-{cId}-{crId}">?
    - Is your Tailwind theme clearly visible (colors painted on the header/rows/wrapper, strong contrast) and NOT on any <tr> element?
    If ANY answer is no, fix it before returning — a partial table will be rejected.

    [OUTPUT]: Return ONLY a <div> with a Tailwind <table>. No markdown. Do NOT include any <button>, <form>, or <input> elements — the scoring page already provides its own Submit button.
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
function ensureScoreRows(html, contestants, criteria) {
  if (!html) return html;
  const rows = buildScoreRows(contestants, criteria);
  if (!rows) return html; // no contestants/criteria → nothing to inject
  const s = String(html);
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

  // Anything with a populated body is a real AI layout. Keep it byte-for-byte —
  // even if its header row or dropdown classes look different. NEVER swap the
  // AI design for the built-in static table: the model owns the theme, the
  // front-end hydrator rebuilds the dropdown ids/ranges on render.
  if (hasBody && !emptyBody) {
    console.log(`✅ [ensureScoreRows] KEPT AI DESIGN byte-for-byte (body has rows) bodyRows=${(bodyInner.match(/<tr\b/gi) || []).length}`);
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