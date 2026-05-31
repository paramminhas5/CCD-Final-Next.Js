import { SignIn } from "@clerk/react";
import { useRouter } from "next/router";
import Nav from "@/components/Nav";

export default function SignInPage() {
  const router = useRouter();
  const redirectUrl = router.query.redirect_url as string | undefined;

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center p-6">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl={redirectUrl ?? "/dashboard"}
        />
      </div>
    </div>
  );
}
