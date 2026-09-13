import { createContext, useContext, type ComponentProps, type ReactNode } from 'react';
import {
  ClerkProvider,
  UserButton as ClerkUserButton,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from '@clerk/react';
import { useThemeStore, type Theme } from '@/lib/theme';

type ClerkAppearance = NonNullable<ComponentProps<typeof ClerkProvider>['appearance']>;

const CLERK_APPEARANCE: Record<Theme, ClerkAppearance> = {
  light: {
    variables: {
      colorPrimary: '#176b59',
      colorBackground: '#ffffff',
      colorForeground: '#17201d',
      borderRadius: '6px',
    },
  },
  dark: {
    variables: {
      colorPrimary: '#4fbf9f',
      colorPrimaryForeground: '#0b1020',
      colorBackground: '#121829',
      colorForeground: '#e6ebf5',
      colorMutedForeground: '#aab4c8',
      colorNeutral: '#e6ebf5',
      colorInput: '#0b1020',
      colorInputForeground: '#e6ebf5',
      borderRadius: '6px',
    },
  },
};

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
  const theme = useThemeStore((state) => state.theme);

  if (hasClerk) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey!} appearance={CLERK_APPEARANCE[theme]}>
        {children}
      </ClerkProvider>
    );
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
      className="flex h-9 w-9 items-center justify-center rounded-full bg-feed-text text-xs font-bold text-feed-text-inverse"
      title="Local dev session"
    >
      LD
    </span>
  );
}
