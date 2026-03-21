import { SignIn } from '@clerk/react';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-feed-bg flex items-center justify-center p-6">
      <SignIn signUpUrl="/register" forceRedirectUrl="/"/>
    </div>
  );
}
