import { useMutation } from '@tanstack/react-query';
import type { FeedRequest, GeneratedFeed } from '@doomschooling/shared';
import { generateFeed } from '@/lib/api';

export function useGenerateFeed() {
  return useMutation<GeneratedFeed, Error, FeedRequest>({
    mutationFn: generateFeed,
  });
}
