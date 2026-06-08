/**
 * /admin-cms — redirects to /admin (unified admin panel)
 */
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function AdminCmsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin"); }, []);
  return null;
}
