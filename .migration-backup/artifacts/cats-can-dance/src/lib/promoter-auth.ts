/**
 * Promoter auth helpers — token-based login that works without Clerk.
 *
 * Storage: sessionStorage["ccd_promoter_token"]
 * The token is a UUID generated when admin approves a promoter application.
 * Admin copies it from the Admin Panel → Ticketing → Applications tab and
 * shares it with the promoter (email / WhatsApp).
 *
 * When Clerk IS configured, Clerk sessions take precedence on the backend,
 * but the token still works as a fallback.
 */

const STORAGE_KEY = "ccd_promoter_token";

export function getPromoterToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(STORAGE_KEY);
}

export function setPromoterToken(token: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, token.trim());
}

export function clearPromoterToken(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isPromoterLoggedIn(): boolean {
  return !!getPromoterToken();
}
