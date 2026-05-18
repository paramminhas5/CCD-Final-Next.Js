import dynamic from "next/dynamic";
const EventDetail = dynamic(() => import("@/pages/EventDetail"), { ssr: false });
export default EventDetail;
