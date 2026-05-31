import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/UserProfile"), { ssr: false });
