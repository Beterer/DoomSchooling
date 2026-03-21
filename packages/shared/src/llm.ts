import type { FeedRequest, GeneratedFeed } from './types.js';

export interface ILLMProvider {
  generateFeed(request: FeedRequest): Promise<GeneratedFeed>;
  generateImage(prompt: string): Promise<Buffer | null>;
  readonly supportsImageGeneration: boolean;
  readonly providerName: string;
}
