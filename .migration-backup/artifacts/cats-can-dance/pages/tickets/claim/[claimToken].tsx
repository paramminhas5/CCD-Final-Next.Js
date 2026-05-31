import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/ClaimTransfer"), { ssr: false });
