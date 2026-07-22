import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hasAllowedVerifiedEmail,
  parseGenerationEmailAllowlist,
} from './generation-access.js';

test('parses and normalizes a comma-separated allowlist', () => {
  const allowlist = parseGenerationEmailAllowlist(' Alice@Example.com, bob@example.com ');

  assert.deepEqual([...allowlist], ['alice@example.com', 'bob@example.com']);
});

test('rejects an invalid allowlist entry', () => {
  assert.throws(
    () => parseGenerationEmailAllowlist('valid@example.com,not-an-email'),
    /invalid email/,
  );
});

test('allows only a verified matching email', () => {
  const allowlist = parseGenerationEmailAllowlist('allowed@example.com');

  assert.equal(
    hasAllowedVerifiedEmail(
      [
        {
          emailAddress: 'Allowed@Example.com',
          verification: { status: 'verified' },
        },
      ],
      allowlist,
    ),
    true,
  );
  assert.equal(
    hasAllowedVerifiedEmail(
      [
        {
          emailAddress: 'allowed@example.com',
          verification: { status: 'unverified' },
        },
      ],
      allowlist,
    ),
    false,
  );
  assert.equal(
    hasAllowedVerifiedEmail(
      [
        {
          emailAddress: 'someone-else@example.com',
          verification: { status: 'verified' },
        },
      ],
      allowlist,
    ),
    false,
  );
});
