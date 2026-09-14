// utils/validators.js
// Small, dependency-free validation helpers shared across forms.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRequired(value) {
  return String(value ?? '').trim().length > 0;
}

export function isEmail(value) {
  return EMAIL_RE.test(String(value ?? '').trim());
}

/**
 * Password policy used by the settings page: at least 8 characters.
 */
export function isStrongPassword(value, min = 8) {
  return String(value ?? '').length >= min;
}

export function passwordsMatch(a, b) {
  return String(a ?? '') === String(b ?? '');
}