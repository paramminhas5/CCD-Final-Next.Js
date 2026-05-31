import { SignIn } from "@clerk/react";
import { useLocation } from "wouter";
import Nav from "@/components/Nav";

export default function SignInPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const redirectUrl = params.get("redirect_url") || undefined;

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
