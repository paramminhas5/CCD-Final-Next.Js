/**
 * clerk-safe.ts — Clerk hooks that are safe during SSG/SSR static rendering.
 *
 * THE PROBLEM:
 * Next.js static generation renders pages server-side without _app.tsx
 * providers. Calling useUser() / useClerk() during that pass throws:
 *   "useUser can only be used within the <ClerkProvider /> component"
 *
 * This crashed all 40+ statically-generated pages at build time.
 *
 * THE FIX:
 * Use a client-only guard. On the server (typeof window === "undefined"),
 * return safe defaults immediately without calling any Clerk hooks.
 * On the client, ClerkProvider from _app.tsx is always mounted, so the
 * real hooks work correctly.
 *
 * WHY NOT try/catch?
 * React errors inside hooks corrupt the hook call count and cause
 * React error #300 on the next render. Module-level try/catch is also
 * wrong — it runs once at import time, not per component render.
 *
 * WHY NOT useEffect?
 * useEffect doesn't run on server at all, but the component tree IS
 * rendered on server during SSG. The hooks would still be called.
 *
 * THE CORRECT PATTERN:
 * Conditional hook calls are illegal in React, BUT we can use a
 * custom hook that uses `useSyncExternalStore` with a server snapshot
 * that returns safe defaults — OR more simply, we check `typeof window`
 * at the TOP of each hook before any hook calls, which is valid because
 * the check result is stable per environment (always server or always client).
 * React's rules prohibit conditionals based on *state*, not on stable
 * environment constants.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── Server-safe defaults (returned during SSG/SSR) ────────────────────────────

const SSR_USER: SafeUserHook = {
  user: null,
  isLoaded: false,
  isSignedIn: false,
};

const SSR_CLERK: SafeClerkHook = {
  openSignIn: () => {},
  signOut: () => Promise.resolve(),
  loaded: false,
};

// ── isServer: true during Next.js SSG/SSR, false in the browser ───────────────
// This is a build-time / runtime constant, not React state — safe to use
// as a hook conditional guard per the React rules.
const isServer = typeof window === "undefined";

// ── Conditional imports: only load Clerk on the client ───────────────────────
// We use require() inside functions (not top-level import) so that the
// Clerk module itself is never evaluated during the server render pass
// of static generation. This prevents Clerk's module init from throwing.

function getClerkHooks() {
  if (isServer) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("@clerk/react") as {
      useUser: () => { user: any; isLoaded: boolean; isSignedIn: boolean };
      useClerk: () => any;
    };
  } catch {
    return null;
  }
}

// Cache the require result — modules are singletons so this is safe.
const _clerkModule = isServer ? null : getClerkHooks();

// ── Public hooks ──────────────────────────────────────────────────────────────

/**
 * Returns `{ user, isLoaded, isSignedIn }`.
 * Safe to call during SSG — returns `{ user: null, isLoaded: false, isSignedIn: false }`
 * on the server. On the client, delegates to the real `useUser()`.
 */
export function useSafeUser(): SafeUserHook {
  if (isServer || !_clerkModule) return SSR_USER;

  // On client: ClerkProvider from _app.tsx is always present here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const result = _clerkModule.useUser();
  return {
    user:       result.user      ?? null,
    isLoaded:   result.isLoaded  ?? true,
    isSignedIn: result.isSignedIn ?? false,
  };
}

/**
 * Returns a subset of Clerk actions we actually use.
 * Safe to call during SSG — returns no-op functions on the server.
 * On the client, delegates to the real `useClerk()`.
 */
export function useSafeClerk(): SafeClerkHook {
  if (isServer || !_clerkModule) return SSR_CLERK;

  // On client: ClerkProvider from _app.tsx is always present here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const clerk = _clerkModule.useClerk();

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

/** True iff Clerk env config is present (client-side check). */
export function isClerkEnabled(): boolean {
  if (isServer) return false;
  return !!(
    typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}
