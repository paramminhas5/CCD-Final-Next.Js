import dynamic from "next/dynamic";
const ProductDetail = dynamic(() => import("@/pages/ProductDetail"), { ssr: false });
export default ProductDetail;
