// frontend/src/utils/ranks.js
// Mirror of backend/utils/ranks.js — one source of truth for ranking on both
// sides of the app. See the backend file for the full algorithm description.
//
//   'midrank'    → 1, 2.5, 2.5, 4   (average of occupied positions)
//   'shared'     → 1, 2, 2, 4       (competition ranking)
//   'sequential' → 1, 2, 3, 4       (consecutive distinct positions)

const EPSILON = 1e-9;

export function numeric(v) {
  return typeof v === 'number' ? v : Number(v == null ? 0 : v);
}

export function valuesEqual(a, b) {
  return Math.abs(numeric(a) - numeric(b)) < EPSILON;
}

export function assignRanks(entries, method = 'midrank') {
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
      for (let k = i; k <= j; k++) entries[k].rank = firstPosition + (k - i);
    } else if (method === 'shared') {
      for (let k = i; k <= j; k++) entries[k].rank = firstPosition;
    } else {
      const midrank = (firstPosition + lastPosition) / 2;
      for (let k = i; k <= j; k++) entries[k].rank = midrank;
    }
    i = j + 1;
  }

  return entries;
}

export function rankValues(entries, { method = 'midrank', ascending = false } = {}) {
  if (!Array.isArray(entries) || entries.length === 0) return entries;
  entries.sort((a, b) => (ascending
    ? numeric(a.value) - numeric(b.value)
    : numeric(b.value) - numeric(a.value)));
  return assignRanks(entries, method);
}

// Display helper: 1 → "1", 2.5 → "2.5", 3.333 → "3.33".
export function formatRank(r) {
  const n = numeric(r);
  if (!Number.isFinite(n)) return '--';
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(2)));
}

export default { assignRanks, rankValues, valuesEqual, numeric, formatRank };