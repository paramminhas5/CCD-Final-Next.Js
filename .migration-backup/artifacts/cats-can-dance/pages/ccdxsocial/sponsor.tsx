import dynamic from "next/dynamic";
const CcdxSocialSponsor = dynamic(() => import("@/pages/CcdxSocialSponsor"), { ssr: false });
export default CcdxSocialSponsor;
