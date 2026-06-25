/**
 * /admin — Password-based CMS admin.
 * No Clerk required. Enter password 84838281 (or ADMIN_PASSWORD env var).
 */
import dynamic from "next/dynamic";
const Admin = dynamic(() => import("@/pages/Admin"), { ssr: false });
export default Admin;
