import { createContext, useContext, type ReactNode } from 'react';
import {
  ClerkProvider,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/react';

const clerkPublishableKey =
  window.__DOOMSCHOOLING_CONFIG__?.clerkPublishableKey ||
  (import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined);

export const hasDevAuthBypass =
  import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
export const hasClerk = !hasDevAuthBypass && Boolean(clerkPublishableKey);

const DevAuthContext = createContext({
  isLoaded: true,
  isSignedIn: true,
});

const devUser = {
  firstName: 'Local dev',
  primaryEmailAddress: {
    emailAddress: 'local@doomschooling.dev',
  },
};

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (hasClerk) {
    return <ClerkProvider publishableKey={clerkPublishableKey!}>{children}</ClerkProvider>;
  }

  if (!hasDevAuthBypass) {
    throw new Error(
      'VITE_CLERK_PUBLISHABLE_KEY is required unless VITE_DEV_AUTH_BYPASS=true in development',
    );
  }

  return <DevAuthContext.Provider value={{ isLoaded: true, isSignedIn: true }}>{children}</DevAuthContext.Provider>;
}

export function useAppAuth() {
  if (hasClerk) {
    return useClerkAuth();
  }

  return useContext(DevAuthContext);
}

export function useAppUser() {
  if (hasClerk) {
    return useClerkUser();
  }

  return { user: devUser };
}

export function AppUserButton() {
  if (hasClerk) {
    return <ClerkUserButton appearance={{ elements: { avatarBox: 'w-9 h-9' } }} />;
  }

  return (
    <span
      className="flex h-9 w-9 items-center justify-center rounded-full bg-feed-text text-xs font-bold text-white"
      title="Local dev session"
    >
      LD
    </span>
  );
}
