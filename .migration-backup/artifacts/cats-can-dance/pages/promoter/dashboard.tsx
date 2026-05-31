/**
 * pages/promoter/dashboard.tsx
 * Next.js Pages Router entry — dynamically loads PromoterDashboard
 * so Clerk hooks (useUser, useAuth) work correctly client-side only.
 */
import dynamic from "next/dynamic";

const PromoterDashboard = dynamic(
  () => import("@/pages/PromoterDashboard"),
  { ssr: false, loading: () => null }
);

export default function PromoterDashboardPage() {
  return <PromoterDashboard />;
}
