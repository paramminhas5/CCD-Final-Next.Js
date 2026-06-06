import dynamic from "next/dynamic";

// Full content management panel (signups, playlists, videos, events,
// messages, blog, curated events, promoters, artists, SEO, marquees,
// theme, homepage copy, RSVPs).
//
// Password-gated only — does not require Clerk. Uses ADMIN_PASSWORD env var.
const Admin = dynamic(() => import("@/pages/Admin"), { ssr: false });
export default Admin;
