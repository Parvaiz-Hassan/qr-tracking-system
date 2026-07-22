import { customAlphabet } from "nanoid";

// Uppercase letters + digits, no ambiguous chars (no 0/O, 1/I) —
// easier to read if someone ever has to type it in manually.
const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

export function generateQrSlug() {
  return nanoid();
}
