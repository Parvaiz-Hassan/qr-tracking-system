// Shared phone validation/normalization — used both client-side (instant
// feedback on the verify form) and server-side (the real enforcement,
// since client-side checks alone can always be bypassed).
//
// Rules: Indian mobile numbers — 10 digits, first digit 6-9. Accepts an
// optional +91, 91, or leading 0 prefix, and ignores spaces/dashes while
// typing. Adjust COUNTRY_PREFIX/regex here if you ever need to support
// other countries.

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;

/** Strips spaces, dashes, parens, and a leading +91/91/0, leaving bare 10 digits. */
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("91") && digits.length === 12) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0") && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidIndianPhone(raw: string): boolean {
  const normalized = normalizePhone(raw);
  return INDIAN_MOBILE_REGEX.test(normalized);
}
