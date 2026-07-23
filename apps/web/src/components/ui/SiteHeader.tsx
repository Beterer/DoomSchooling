import { BookOpenText, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppUserButton, useAppAuth, useAppUser } from '@/lib/auth';

export function SiteHeader() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const { user } = useAppUser();

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-feed-border/80 bg-feed-bg/90 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="group flex items-center gap-2.5 rounded-xl text-feed-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-feed-accent focus-visible:ring-offset-4"
          aria-label="DoomSchooling home"
        >
          <span className="flex h-9 w-9 rotate-[-3deg] items-center justify-center rounded-xl bg-feed-text text-white shadow-[3px_3px_0_#62d9ff] transition-transform group-hover:rotate-0">
            <BookOpenText aria-hidden="true" size={18} strokeWidth={2.2} />
          </span>
          <span className="font-display text-lg font-black tracking-[-0.035em] sm:text-xl">DoomSchooling</span>
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
                className="flex h-9 items-center gap-2 rounded-full border border-feed-border bg-feed-card px-4 text-sm font-bold text-feed-text shadow-sm transition-all hover:-translate-y-0.5 hover:border-feed-text-muted"
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
