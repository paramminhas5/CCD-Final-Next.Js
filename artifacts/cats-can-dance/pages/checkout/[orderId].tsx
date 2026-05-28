import dynamic from "next/dynamic";
export default dynamic(() => import("@/pages/CheckoutPage"), { ssr: false });
