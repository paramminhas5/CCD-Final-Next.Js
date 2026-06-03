/**
 * /admin — Password-based CMS admin.
 * No Clerk required. Uses ADMIN_PASSWORD env var.
 */
import dynamic from "next/dynamic";
const Admin = dynamic(() => import("@/pages/Admin"), { ssr: false });
export default Admin;
