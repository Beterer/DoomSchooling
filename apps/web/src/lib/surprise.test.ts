import assert from 'node:assert/strict';
import test from 'node:test';
import { pickFallbackTopic } from './surprise.ts';

const POOL = ['Black holes', 'The Silk Road', 'Game theory'];

test('skips topics the reader has just seen, ignoring case and spaces', () => {
  for (const value of [0, 0.5, 0.999999]) {
    const topic = pickFallbackTopic(POOL, [' black HOLES ', 'The Silk Road'], () => value);

    assert.equal(topic, 'Game theory');
  }
});

test('still picks something when every topic was seen', () => {
  const topic = pickFallbackTopic(POOL, POOL, () => 0.999999);

  assert.equal(topic, 'Game theory');
});

test('throws on an empty pool', () => {
  assert.throws(() => pickFallbackTopic([], []), /empty pool/);
});
