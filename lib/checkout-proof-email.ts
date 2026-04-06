/** Lowercase trimmed email for proof snapshot + approval matching. */
export function normalizeCheckoutEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const t = email.trim().toLowerCase();
  return t.length > 0 ? t : null;
}
