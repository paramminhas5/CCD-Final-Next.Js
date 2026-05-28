/**
 * /talent/[slug] — canonical talent profile page.
 * Delegates to the existing /artists/[slug] page (same component —
 * artists of all kinds share the same magazine-style profile).
 * This route exists so URLs like /talent/sunburn-photography work
 * and remain kind-aware for future divergence.
 */
import dynamic from "next/dynamic";
import { useRouter } from "next/router";

const ArtistDetail = dynamic(
  () => import("@/pages/ArtistDetail"),
  { ssr: false, loading: () => null }
);

export default function TalentProfilePage() {
  // ArtistDetail reads slug from router.query.slug automatically.
  return <ArtistDetail />;
}
