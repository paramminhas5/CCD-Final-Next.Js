/**
 * Safe Clerk hooks — return graceful defaults when ClerkProvider isn't mounted
 * (e.g. NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY missing in Vercel). Keeps the UI
 * shell rendering instead of crashing the whole app.
 */
import * as ClerkReact from "@clerk/react";

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

/** Returns `{ user, isLoaded, isSignedIn }`. Falls back when Clerk is absent. */
export function useSafeUser(): SafeUserHook {
  try {
    const u = (ClerkReact as any).useUser?.();
    if (u) return { user: u.user ?? null, isLoaded: !!u.isLoaded, isSignedIn: !!u.isSignedIn };
  } catch {
    /* No ClerkProvider mounted — fall through to the disabled defaults. */
  }
  // When Clerk is disabled we still report `isLoaded = true` so the UI
  // doesn't get stuck on a permanent loading state. There's just no user.
  return { user: null, isLoaded: true, isSignedIn: false };
}

/** Returns the subset of Clerk we actually use. */
export function useSafeClerk(): SafeClerkHook {
  try {
    const c = (ClerkReact as any).useClerk?.();
    if (c) {
      return {
        openSignIn: () => {
          if (typeof c.openSignIn === "function") c.openSignIn();
          else if (typeof window !== "undefined") window.location.href = "/sign-in";
        },
        signOut: () => (typeof c.signOut === "function" ? c.signOut() : Promise.resolve()),
        loaded: true,
      };
    }
  } catch { /* no provider */ }
  return {
    openSignIn: () => {
      if (typeof window !== "undefined") window.location.href = "/sign-in";
    },
    signOut: () => Promise.resolve(),
    loaded: false,
  };
}

/** True iff Clerk env config is present. Useful to short-circuit auth UI. */
export function isClerkEnabled(): boolean {
  return !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "");
}
