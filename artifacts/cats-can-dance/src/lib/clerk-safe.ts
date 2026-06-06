/**
 * Safe Clerk hooks — return graceful defaults when ClerkProvider isn't mounted
 * (e.g. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing in Vercel). Keeps the UI
 * shell rendering instead of crashing the whole app.
 *
 * FIX (React error #300):
 * The previous implementation called useUser() inside a try/catch, which
 * caused React to miscount hook calls between renders and throw error #300.
 *
 * The correct pattern: call the real Clerk hooks unconditionally and let
 * ClerkWrapper in _app.tsx decide whether ClerkProvider is mounted. When
 * ClerkProvider is absent, useUser/useClerk return graceful defaults via
 * Clerk's own built-in no-provider handling (Clerk ≥ 5 returns default
 * objects instead of throwing when called outside a provider).
 *
 * For older Clerk versions that DO throw outside a provider we keep a
 * module-level guard (not a per-render try/catch) so hook call order is
 * always stable.
 */
import { useUser, useClerk } from "@clerk/react";

export type SafeUserHook = {
  user: any | null;
  isLoaded: boolean;
  isSignedIn: boolean;
};

export type SafeClerkHook = {
  openSignIn: () => void;
  signOut: () => Promise<void> | void;
  loaded: boolean;
};

// Module-level flag: set once on first render, never changes afterwards.
// This avoids per-render try/catch which would break Rules of Hooks.
let _clerkKeyPresent: boolean | null = null;
function clerkKeyPresent(): boolean {
  if (_clerkKeyPresent === null) {
    _clerkKeyPresent = !!(
      typeof process !== "undefined" &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    );
  }
  return _clerkKeyPresent;
}

/**
 * Returns `{ user, isLoaded, isSignedIn }`.
 * Falls back gracefully when ClerkProvider is not mounted.
 */
export function useSafeUser(): SafeUserHook {
  // Always call useUser — this keeps hook call order stable across renders.
  // When ClerkProvider is absent, Clerk ≥ 5 returns { isLoaded: false, user: null }.
  const result = useUser();
  return {
    user: result.user ?? null,
    isLoaded: result.isLoaded ?? true,
    isSignedIn: result.isSignedIn ?? false,
  };
}

/**
 * Returns the subset of Clerk we actually use.
 * Falls back gracefully when ClerkProvider is not mounted.
 */
export function useSafeClerk(): SafeClerkHook {
  // Always call useClerk — keeps hook call order stable across renders.
  const clerk = useClerk();
  return {
    openSignIn: () => {
      if (typeof (clerk as any).openSignIn === "function") {
        (clerk as any).openSignIn();
      } else if (typeof window !== "undefined") {
        window.location.href = "/sign-in";
      }
    },
    signOut: () =>
      typeof (clerk as any).signOut === "function"
        ? (clerk as any).signOut()
        : Promise.resolve(),
    loaded: !!(clerk as any).loaded,
  };
}

/** True iff Clerk env config is present. Useful to short-circuit auth UI. */
export function isClerkEnabled(): boolean {
  return clerkKeyPresent();
}
