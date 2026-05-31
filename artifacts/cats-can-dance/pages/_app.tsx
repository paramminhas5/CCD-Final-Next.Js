import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiscoProvider } from "@/contexts/DiscoContext";
import ScrollToTop from "@/components/ScrollToTop";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useCartSync } from "@/hooks/useCartSync";
import "@/index.css";
import "@/pages/ccd.css";
import React from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

/**
 * Resolves the Clerk publishable key. Returns "" if missing — callers must
 * handle the empty-key case so the rest of the app still renders.
 */
function resolveClerkKey(): string {
  if (typeof window !== "undefined") {
    const fromHost = publishableKeyFromHost(
      window.location.hostname,
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "",
    );
    if (fromHost) return fromHost;
  }
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
}

function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const clerkPubKey = resolveClerkKey();
  const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL || undefined;

  // No Clerk key → render the app without ClerkProvider so the rest still
  // works (Sign-In button gracefully links to /sign-in instead of opening a
  // modal). This unblocks dev / preview deploys without env vars.
  if (!clerkPubKey) {
    if (typeof window !== "undefined" && !(window as any).__ccdClerkWarned) {
      (window as any).__ccdClerkWarned = true;
      // eslint-disable-next-line no-console
      console.warn(
        "[CCD] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set — auth features disabled. " +
          "Set it in Vercel → Project Settings → Environment Variables.",
      );
    }
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
      routerPush={(to) => router.push(to)}
      routerReplace={(to) => router.replace(to)}
    >
      {children}
    </ClerkProvider>
  );
}

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ClerkWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ThemeProvider>
            <DiscoProvider>
              <CartSyncProvider>
                <ScrollToTop />
                <Component {...pageProps} />
                <ThemeSwitcher />
              </CartSyncProvider>
            </DiscoProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkWrapper>
  );
}
