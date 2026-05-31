import { SignUp } from "@clerk/react";
import Nav from "@/components/Nav";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Nav />
      <div className="flex-1 flex items-center justify-center p-6">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
