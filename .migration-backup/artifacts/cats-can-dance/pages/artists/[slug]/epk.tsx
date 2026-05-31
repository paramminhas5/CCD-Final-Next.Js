import dynamic from "next/dynamic";
const ArtistEPK = dynamic(() => import("@/pages/ArtistEPK"), { ssr: false });
export default ArtistEPK;
