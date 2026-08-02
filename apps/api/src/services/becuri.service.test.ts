import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import type { BulbBooking } from '@doomschooling/shared';
import { BecuriService } from './becuri.service.js';

function makeBooking(overrides: Partial<BulbBooking> = {}): BulbBooking {
  return {
    refusals: 7,
    date: '2026-08-08',
    time: '18:00',
    burntBulbs: '3',
    extras: ['ladder'],
    message: 'vino cu scara ta',
    ...overrides,
  };
}

async function makeService(): Promise<{ service: BecuriService; dir: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'becuri-'));
  return { service: new BecuriService(dir), dir };
}

test('returns an empty list before anything is saved', async () => {
  const { service } = await makeService();

  assert.deepEqual(await service.list(), []);
});

test('saves a booking and stamps it with an id and a timestamp', async () => {
  const { service } = await makeService();

  const entry = await service.save(makeBooking());

  assert.equal(entry.message, 'vino cu scara ta');
  assert.ok(entry.id.length > 0);
  assert.ok(!Number.isNaN(Date.parse(entry.receivedAt)));
});

test('lists saved bookings newest first', async () => {
  const { service } = await makeService();

  await service.save(makeBooking({ message: 'prima' }));
  await service.save(makeBooking({ message: 'a doua' }));

  const entries = await service.list();

  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.message, 'a doua');
  assert.equal(entries[1]?.message, 'prima');
});

test('skips corrupted lines instead of failing the whole read', async () => {
  const { service, dir } = await makeService();

  await service.save(makeBooking({ message: 'buna' }));
  await writeFile(
    join(dir, 'becuri.jsonl'),
    `${JSON.stringify({ ...makeBooking({ message: 'buna' }), id: 'a', receivedAt: new Date().toISOString() })}\nnot json at all\n{"id":"b"}\n`,
    'utf8',
  );

  const entries = await service.list();

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.message, 'buna');
});
