/**
 * /submit-event/event — authenticated promoter event submission form
 *
 * Only accessible to users with a verified promoter profile (claimed_by set).
 * Unauthenticated users are redirected to /sign-in.
 * Non-promoters are redirected to /submit-event (promoter application).
 */

import PromoterEventSubmit from "@/pages/PromoterEventSubmit";
export default PromoterEventSubmit;
