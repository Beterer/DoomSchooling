import type { FeedRequest } from '@doomschooling/shared';

export type LearningDepth = NonNullable<FeedRequest['depth']>;

export const DEFAULT_DEPTH: LearningDepth = 'intermediate';

export const DEPTH_OPTIONS: ReadonlyArray<{
  value: LearningDepth;
  label: string;
  description: string;
}> = [
  { value: 'surface', label: 'Start simple', description: 'Clear foundations' },
  { value: 'intermediate', label: 'Go further', description: 'Ideas and examples' },
  { value: 'deep', label: 'Dig deep', description: 'Nuance and edge cases' },
];

export function parseLearningDepth(value: string | null): LearningDepth {
  if (value === 'surface' || value === 'deep' || value === 'intermediate') {
    return value;
  }

  return DEFAULT_DEPTH;
}

export function buildFeedUrl(topic: string, depth: LearningDepth): string {
  const params = new URLSearchParams({ topic, depth });
  return `/feed?${params.toString()}`;
}
