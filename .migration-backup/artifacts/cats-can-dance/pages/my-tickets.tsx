import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/MyTickets"), { ssr: false });
