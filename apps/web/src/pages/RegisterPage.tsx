import { SignUp } from '@clerk/react';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-feed-bg flex items-center justify-center p-6">
      <SignUp signInUrl="/login" forceRedirectUrl="/" />
    </div>
  );
}
