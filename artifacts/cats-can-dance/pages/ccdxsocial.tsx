import dynamic from "next/dynamic";
const CcdxSocial = dynamic(() => import("@/pages/CcdxSocial"), { ssr: false });
export default CcdxSocial;
