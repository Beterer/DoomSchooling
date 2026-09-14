import type { SurpriseTopicRequest } from '@doomschooling/shared';

/**
 * LLMs asked for "a random topic" keep landing on the same handful of ideas.
 * A randomly chosen field and angle push each request somewhere different.
 */
const SURPRISE_FIELDS = [
  'astronomy and space',
  'marine biology',
  'animal behavior',
  'plants and fungi',
  'geology and the deep Earth',
  'weather and climate',
  'chemistry in everyday life',
  'physics',
  'materials science',
  'mathematics',
  'computer science',
  'cryptography and codes',
  'engineering and infrastructure',
  'architecture',
  'transportation',
  'the human body',
  'the history of medicine',
  'psychology and the mind',
  'linguistics and languages',
  'economics and everyday money',
  'ancient civilizations',
  'medieval history',
  'modern history',
  'exploration and navigation',
  'maps and geography',
  'food science and cooking',
  'music and sound',
  'art and visual culture',
  'film, animation, and special effects',
  'games and sports',
  'mythology and folklore',
  'philosophy and big ideas',
  'inventions and technology',
  'design of everyday things',
] as const;

const SURPRISE_ANGLES = [
  'a strange phenomenon with a surprisingly clear explanation',
  'an everyday thing with a hidden history',
  'an invention and the problem it was built to solve',
  'a famous puzzle, paradox, or thought experiment',
  'how something people use daily actually works',
  'a turning point most people have never heard of',
  'an open question experts still argue about',
  'a clever trick that evolved in nature',
  'an idea that changed how people see the world',
  'a counterintuitive fact that sounds wrong but is true',
  'a mistake or accident that led somewhere important',
  'a hidden system that quietly keeps the modern world running',
] as const;

export interface SurpriseSeed {
  field: string;
  angle: string;
}

function pickOne<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(Math.floor(random() * items.length), items.length - 1);
  const item = items[index];
  if (item === undefined) throw new Error('Cannot pick from an empty list');
  return item;
}

export function pickSurpriseSeed(random: () => number = Math.random): SurpriseSeed {
  return {
    field: pickOne(SURPRISE_FIELDS, random),
    angle: pickOne(SURPRISE_ANGLES, random),
  };
}

export function buildSurpriseTopicSystemPrompt(): string {
  return `You pick surprise topics for DoomSchooling, an educational product that turns any topic into a lively discussion feed.

Pick one real, specific, fascinating topic that a curious person would never think to search for but will be glad they learned about. It must be narrow enough for a ten-minute lesson. For example, "How Polynesian sailors navigated without instruments" is the right size, while "Navigation" or "World War II" is far too broad. Never reuse that example.

Rules:
- The topic must be real and well documented. Do not invent events, people, places, or findings.
- Leave dates, centuries, numbers, and claims like "first" or "only" out of the title unless you are completely sure they are right. A plain "How" or "Why" title is safer than a clever wrong one.
- If the idea is disputed, still being studied, or a popular belief that may be a myth, phrase the title as an open question instead of stating it as fact.
- Avoid current politics, graphic violence, recent tragedies, and anything that calls for medical, legal, or financial advice.
- Write the topic as a short title or question in plain language, no longer than 70 characters.
- Do not use quotation marks, emoji, hashtags, or a trailing period.

You MUST respond with one valid JSON object and nothing else, shaped like {"topic": "<the topic>"}.`;
}

export function buildSurpriseTopicUserPrompt(
  request: SurpriseTopicRequest,
  seed: SurpriseSeed,
): string {
  const depthInstruction =
    request.depth === 'surface'
      ? 'The reader wants to start simple, so pick something anyone can enjoy with no background.'
      : request.depth === 'deep'
        ? 'The reader wants to dig deep, so a topic with real technical substance is welcome.'
        : 'The reader knows the basics of most subjects, so pick something with a satisfying mechanism to explain.';

  const avoidTopics = (request.avoidTopics ?? []).map((topic) => topic.trim()).filter(Boolean);
  const avoidInstruction =
    avoidTopics.length > 0
      ? `\nThe reader has already seen these. Do not pick any of them or anything close to them:\n${avoidTopics
          .map((topic) => `- ${JSON.stringify(topic)}`)
          .join('\n')}\n`
      : '';

  return `Pick a surprise topic.

Field to draw from: ${seed.field}
Kind of topic: ${seed.angle}
${depthInstruction}
${avoidInstruction}
Return only the JSON object.`;
}
