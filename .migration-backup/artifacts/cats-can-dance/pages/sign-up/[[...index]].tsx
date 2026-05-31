import dynamic from "next/dynamic";

const SignUpPage = dynamic(
  () => import("@/components/clerk/SignUpPage"),
  { ssr: false },
);

export default SignUpPage;
