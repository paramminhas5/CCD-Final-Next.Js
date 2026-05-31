import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/promoter/PromoterApply"), { ssr: false });
