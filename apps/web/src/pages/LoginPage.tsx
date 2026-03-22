import { SignIn } from '@clerk/react';
import { useSearchParams } from 'react-router-dom';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') ?? '/';

  return (
    <div className="min-h-screen bg-feed-bg flex items-center justify-center p-6">
      <SignIn signUpUrl="/register" forceRedirectUrl={redirectUrl} />
    </div>
  );
}
