/**
 * /admin-panel — Clerk-based role management panel.
 * Requires Clerk login + admin role.
 */
import dynamic from "next/dynamic";
const AdminPanel = dynamic(() => import("@/pages/AdminPanel"), { ssr: false });
export default AdminPanel;
