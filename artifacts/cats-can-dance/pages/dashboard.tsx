import dynamic from "next/dynamic";
const UserDashboard = dynamic(() => import("@/pages/UserDashboard"), { ssr: false });
export default UserDashboard;
