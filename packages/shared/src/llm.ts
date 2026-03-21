import type { FeedRequest, GeneratedFeed, ContinueFeedRequest, FeedContinuation } from './types.js';

export interface ILLMProvider {
  generateFeed(request: FeedRequest): Promise<GeneratedFeed>;
  continueFeed(request: ContinueFeedRequest): Promise<FeedContinuation>;
  generateImage(prompt: string): Promise<Buffer | null>;
  readonly supportsImageGeneration: boolean;
  readonly providerName: string;
}
