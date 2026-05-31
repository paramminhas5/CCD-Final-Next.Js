import dynamic from "next/dynamic";
const ArtistPortal = dynamic(() => import("@/pages/ArtistPortal"), { ssr: false });
export default ArtistPortal;
