import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/SingleTicket"), { ssr: false });
