// backend/utils/ranks.js
// Single source of truth for all ranking in the tabulation system.
//
// Three tie-break methods are supported:
//   'midrank'    — tied contestants share the average of the positions they
//                  occupy: (firstPosition + lastPosition) / 2   → 1, 2.5, 2.5, 4
//   'shared'     — competition ranking: every tied contestant gets the first
//                  occupied position                            → 1, 2, 2, 4
//   'sequential' — tied contestants receive consecutive distinct positions
//                                                               → 1, 2, 3, 4
//
// The value to rank is read from each entry's `.value` property. Callers that
// want a sorted result use `rankValues`; callers that already have a sorted
// list use `assignRanks`.

const EPSILON = 1e-9;

function numeric(v) {
  return typeof v === 'number' ? v : Number(v == null ? 0 : v);
}

// DECIMAL(10,2) division (e.g. an average across judges) can produce long
// decimals like 93.33333333333333. Compare normalized values with a tiny
// tolerance so we never invent ties between mathematically-different values,
// but true ties (equal averages) always rank together.
function valuesEqual(a, b) {
  return Math.abs(numeric(a) - numeric(b)) < EPSILON;
}

// Assigns a `.rank` to every entry in place. `entries` MUST already be sorted
// best → worst (high value first for scores, low value first for rank-sums).
function assignRanks(entries, method = 'midrank') {
  if (!Array.isArray(entries) || entries.length === 0) return entries;

  let i = 0;
  while (i < entries.length) {
    let j = i;
    while (j + 1 < entries.length && valuesEqual(entries[j + 1].value, entries[i].value)) {
      j += 1;
    }

    const firstPosition = i + 1;
    const lastPosition  = j + 1;

    if (method === 'sequential') {
      // Each tied contestant gets its own consecutive position.
      for (let k = i; k <= j; k++) entries[k].rank = firstPosition + (k - i);
    } else if (method === 'shared') {
      // Competition ranking: everyone in the tie gets the first occupied position.
      for (let k = i; k <= j; k++) entries[k].rank = firstPosition;
    } else {
      // midrank (default): average of all occupied positions in the tie.
      const midrank = (firstPosition + lastPosition) / 2;
      for (let k = i; k <= j; k++) entries[k].rank = midrank;
    }

    i = j + 1;
  }

  return entries;
}

// Sorts (best → worst) then assigns ranks.
//   { method: 'midrank' | 'shared' | 'sequential', ascending: boolean }
// `ascending: true`  → lower `.value` is better  (e.g. total rank-sum).
// `ascending: false` → higher `.value` is better (e.g. final average).
function rankValues(entries, { method = 'midrank', ascending = false } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) return entries;
  entries.sort((a, b) => (ascending
    ? numeric(a.value) - numeric(b.value)
    : numeric(b.value) - numeric(a.value)));
  return assignRanks(entries, method);
}

module.exports = { assignRanks, rankValues, valuesEqual, numeric };