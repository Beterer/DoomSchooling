import { SignUp } from '@clerk/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SiteHeader } from '@/components/ui/SiteHeader';
import { hasClerk } from '@/lib/auth';

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-feed-bg">
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        {hasClerk ? (
          <SignUp
            signInUrl="/login"
            forceRedirectUrl="/"
            appearance={{
              variables: {
                colorPrimary: '#176b59',
                colorBackground: '#ffffff',
                colorForeground: '#17201d',
                borderRadius: '6px',
              },
            }}
          />
        ) : (
          <div className="max-w-md rounded-md border border-feed-border bg-feed-card p-6 text-center">
            <h1 className="font-display text-2xl font-bold text-feed-text">Local dev session is active</h1>
            <p className="mt-3 text-sm leading-6 text-feed-text-secondary">
              Clerk keys are not set, so account creation is skipped on this machine.
            </p>
            <Link
              to="/"
              className="mx-auto mt-5 flex h-10 w-fit items-center gap-2 rounded-md bg-feed-text px-4 text-sm font-bold text-white transition-colors hover:bg-feed-accent"
            >
              Continue
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
