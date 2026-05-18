import dynamic from "next/dynamic";

const SignInPage = dynamic(
  () => import("@/components/clerk/SignInPage"),
  { ssr: false },
);

export default SignInPage;
