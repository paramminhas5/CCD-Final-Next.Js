/**
 * /admin-panel — redirects to /admin (unified admin panel)
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminPanelRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin"); }, []);
  return null;
}
