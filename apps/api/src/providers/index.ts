import type { ILLMProvider } from '@doomschooling/shared';
import { MockProvider } from './mock.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenRouterProvider } from './openrouter.provider.js';

/**
 * Reads LLM_PROVIDER env var and returns the appropriate provider instance.
 * Defaults to mock if the variable is unset or unrecognised.
 */
export function resolveProvider(): ILLMProvider {
  const name = process.env['LLM_PROVIDER'] ?? 'mock';

  switch (name) {
    case 'mock':
      return new MockProvider();
    case 'gemini':
      return new GeminiProvider();
    case 'openrouter':
      return new OpenRouterProvider();
    case 'claude':
      throw new Error('ClaudeProvider not yet implemented');
    case 'openai':
      throw new Error('OpenAIProvider not yet implemented');
    default:
      console.warn(`Unknown LLM_PROVIDER "${name}", falling back to mock`);
      return new MockProvider();
  }
}

export { MockProvider } from './mock.provider.js';
export { GeminiProvider } from './gemini.provider.js';
export { OpenRouterProvider } from './openrouter.provider.js';
