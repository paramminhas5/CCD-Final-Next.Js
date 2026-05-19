import dynamic from "next/dynamic";
const AdminPanel = dynamic(() => import("@/pages/AdminPanel"), { ssr: false });
export default AdminPanel;
