import { z } from 'zod';

interface EmailAddressLike {
  emailAddress: string;
  verification: {
    status: string;
  } | null;
}

const EmailSchema = z.string().email();

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function parseGenerationEmailAllowlist(value: string | undefined): ReadonlySet<string> {
  if (!value?.trim()) return new Set();

  const emails = value
    .split(',')
    .map(normalizeEmail)
    .filter(Boolean);

  for (const email of emails) {
    if (!EmailSchema.safeParse(email).success) {
      throw new Error(`GENERATION_EMAIL_ALLOWLIST contains an invalid email: ${email}`);
    }
  }

  return new Set(emails);
}

export function hasAllowedVerifiedEmail(
  emailAddresses: EmailAddressLike[],
  allowlist: ReadonlySet<string>,
): boolean {
  return emailAddresses.some(
    ({ emailAddress, verification }) =>
      verification?.status === 'verified' && allowlist.has(normalizeEmail(emailAddress)),
  );
}
