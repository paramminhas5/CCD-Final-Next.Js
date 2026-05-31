import dynamic from "next/dynamic";
const CcdxSocialSeries = dynamic(() => import("@/pages/CcdxSocialSeries"), { ssr: false });
export default CcdxSocialSeries;
