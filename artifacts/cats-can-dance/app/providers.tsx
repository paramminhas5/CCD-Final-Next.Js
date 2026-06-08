"use client";
/**
 * providers.tsx — Client boundary wrapping all context providers.
 *
 * The App Router layout (layout.tsx) is a Server Component. To use
 * context providers (which need useState/useEffect), we push them into
 * this single "use client" wrapper. Everything inside runs on the client
 * while the layout shell stays server-rendered.
 *
 * This is the exact same provider stack as pages/_app.tsx so all existing
 * components work identically whether rendered from Pages Router or App Router.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/react";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiscoProvider } from "@/contexts/DiscoContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ScrollToTop from "@/components/ScrollToTop";
import { useCartSync } from "@/hooks/useCartSync";
import { useState } from "react";

// ── Cart sync — must live inside QueryClientProvider ──────────────────────────
function CartSyncProvider({ children }: { children: React.ReactNode }) {
  useCartSync();
  return <>{children}</>;
}

// ── Clerk wrapper — gracefully degrades when key is missing ──────────────────
function ClerkWrapper({ children }: { children: React.ReactNode }) {
  const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";

  if (!pubKey) return <>{children}</>;

  return (
    <ClerkProvider
      publishableKey={pubKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  );
}

// ── Root providers ────────────────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  // Create QueryClient once per component instance (not at module level)
  // so it's stable across HMR and doesn't bleed between server requests.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      }),
  );

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
                {children}
                <ThemeSwitcher />
              </CartSyncProvider>
            </DiscoProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkWrapper>
  );
}
