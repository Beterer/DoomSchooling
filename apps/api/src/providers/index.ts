import type { ILLMProvider } from '@doomschooling/shared';
import { MockProvider } from './mock.provider.js';

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
      throw new Error('GeminiProvider not yet implemented');
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
