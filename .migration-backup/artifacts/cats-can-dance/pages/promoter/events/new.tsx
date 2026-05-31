import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/promoter/PromoterEventNew"), { ssr: false });
