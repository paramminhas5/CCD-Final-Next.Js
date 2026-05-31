/**
 * /ccdxsocial/events → redirect to /events
 * Keeps the URL alive for any external links, but the canonical home for
 * all events (including the CCDxSocial series) is the main /events page.
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

const CcdxSocialEvents = () => {
  const router = useRouter();
  useEffect(() => { router.replace("/events"); }, [router]);
  return null;
};

export default CcdxSocialEvents;
