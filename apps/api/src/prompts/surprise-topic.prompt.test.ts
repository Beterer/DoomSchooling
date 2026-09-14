import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSurpriseTopicUserPrompt, pickSurpriseSeed } from './surprise-topic.prompt.js';

test('picks a field and angle for any random value', () => {
  for (const value of [0, 0.5, 0.999999]) {
    const seed = pickSurpriseSeed(() => value);

    assert.ok(seed.field.length > 0);
    assert.ok(seed.angle.length > 0);
  }
});

test('different random values reach different seeds', () => {
  const first = pickSurpriseSeed(() => 0);
  const last = pickSurpriseSeed(() => 0.999999);

  assert.notEqual(first.field, last.field);
  assert.notEqual(first.angle, last.angle);
});

test('includes the seed and the topics to avoid in the prompt', () => {
  const prompt = buildSurpriseTopicUserPrompt(
    { depth: 'deep', avoidTopics: ['Why honey never spoils', '  '] },
    { field: 'food science and cooking', angle: 'an everyday thing with a hidden history' },
  );

  assert.match(prompt, /Field to draw from: food science and cooking/);
  assert.match(prompt, /Kind of topic: an everyday thing with a hidden history/);
  assert.match(prompt, /dig deep/);
  assert.match(prompt, /- "Why honey never spoils"/);
  assert.doesNotMatch(prompt, /- ""/);
});

test('leaves out the avoid list when there is nothing to avoid', () => {
  const prompt = buildSurpriseTopicUserPrompt(
    {},
    { field: 'mathematics', angle: 'a famous puzzle, paradox, or thought experiment' },
  );

  assert.doesNotMatch(prompt, /already seen/);
});
