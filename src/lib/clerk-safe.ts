/**
 * Clerk hooks stub — auth is removed from this build.
 * Provides the same API surface so existing code doesn't break.
 */

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

/** Returns `{ user, isLoaded, isSignedIn }`. Always returns no user. */
export function useSafeUser(): SafeUserHook {
  return { user: null, isLoaded: true, isSignedIn: false };
}

/** Returns the subset of Clerk we actually use — stub version. */
export function useSafeClerk(): SafeClerkHook {
  return {
    openSignIn: () => {
      if (typeof window !== "undefined") window.location.href = "/sign-in";
    },
    signOut: () => Promise.resolve(),
    loaded: false,
  };
}

/** Always false — Clerk is not available in this build. */
export function isClerkEnabled(): boolean {
  return false;
}
