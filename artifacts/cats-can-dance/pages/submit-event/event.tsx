/**
 * /submit-event/event — authenticated promoter event submission form
 * ssr: false — uses Clerk hooks, must be client-only.
 */
import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/PromoterEventSubmit"), { ssr: false });
