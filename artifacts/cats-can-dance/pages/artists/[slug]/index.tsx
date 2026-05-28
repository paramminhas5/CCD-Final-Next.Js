import dynamic from "next/dynamic";
const ArtistDetail = dynamic(() => import("@/pages/ArtistDetail"), { ssr: false });
export default ArtistDetail;
