import type {
  FeedRequest,
  GeneratedFeed,
  ContinueFeedRequest,
  FeedContinuation,
  SurpriseTopicRequest,
  SurpriseTopic,
} from './types.js';

export interface ILLMProvider {
  generateFeed(request: FeedRequest): Promise<GeneratedFeed>;
  continueFeed(request: ContinueFeedRequest): Promise<FeedContinuation>;
  suggestSurpriseTopic(request: SurpriseTopicRequest): Promise<SurpriseTopic>;
  generateImage(prompt: string): Promise<Buffer | null>;
  readonly supportsImageGeneration: boolean;
  readonly providerName: string;
}
