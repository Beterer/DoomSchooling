import { BookOpen, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppUserButton, useAppAuth, useAppUser } from '@/lib/auth';

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { user } = useAppUser();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-feed-border bg-feed-bg/95 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-feed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent"
          aria-label="DoomSchooling home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-feed-text text-white transition-colors group-hover:bg-feed-accent">
            <BookOpen aria-hidden="true" size={19} strokeWidth={2} />
          </span>
          <span className="font-display text-xl font-bold">DoomSchooling</span>
        </Link>

        {isLoaded && (
          <div className="flex items-center gap-3">
            {isSignedIn ? (
              <>
                <span className="hidden max-w-48 truncate text-sm text-feed-text-secondary sm:block">
                  {user?.firstName ?? user?.primaryEmailAddress?.emailAddress}
                </span>
                <AppUserButton />
              </>
            ) : (
              <Link
                to="/login"
                className="flex h-9 items-center gap-2 rounded-md border border-feed-border bg-feed-card px-3.5 text-sm font-semibold text-feed-text transition-colors hover:border-feed-text-muted hover:bg-feed-card-hover"
              >
                <LogIn aria-hidden="true" size={16} />
                Sign in
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
