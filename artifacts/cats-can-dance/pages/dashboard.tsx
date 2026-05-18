import dynamic from "next/dynamic";
const Dashboard = dynamic(() => import("@/pages/UserDashboard"), { ssr: false });
export default Dashboard;
