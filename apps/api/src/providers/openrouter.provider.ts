import { z } from 'zod';
import {
  FeedContinuationSchema,
  GeneratedFeedSchema,
  type ContinueFeedRequest,
  type FeedContinuation,
  type FeedRequest,
  type GeneratedFeed,
  type ILLMProvider,
} from '@doomschooling/shared';
import {
  buildContinueFeedUserPrompt,
  buildFeedSystemPrompt,
  buildFeedUserPrompt,
} from '../prompts/feed.prompt.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

type JsonSchema = Record<string, unknown>;

const PERSONA_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    displayName: { type: 'string' },
    handle: { type: 'string' },
    role: {
      type: 'string',
      enum: ['expert', 'practitioner', 'learner', 'skeptic', 'enthusiast'],
    },
    avatarColor: { type: 'string' },
    avatarInitials: { type: 'string', maxLength: 2 },
  },
  required: ['id', 'displayName', 'handle', 'role', 'avatarColor', 'avatarInitials'],
};

const POST_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    persona: PERSONA_JSON_SCHEMA,
    content: { type: 'string' },
    postType: { type: 'string', enum: ['text', 'code', 'image', 'divider'] },
    language: { type: 'string' },
    imageUrl: { type: ['string', 'null'] },
    imageAlt: { type: ['string', 'null'] },
    depth: { type: 'integer', minimum: 0, maximum: 3 },
    parentId: { type: ['string', 'null'] },
    votes: { type: 'integer' },
    timestamp: { type: 'string' },
  },
  required: ['id', 'persona', 'content', 'postType', 'depth', 'parentId', 'votes', 'timestamp'],
};

const GENERATED_FEED_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    id: { type: 'string' },
    topic: { type: 'string' },
    topicTitle: { type: 'string', maxLength: 50 },
    posts: {
      type: 'array',
      minItems: 11,
      maxItems: 11,
      items: POST_JSON_SCHEMA,
    },
    suggestedNextTopics: {
      type: 'array',
      minItems: 4,
      maxItems: 6,
      items: { type: 'string' },
    },
    generatedAt: { type: 'string' },
  },
  required: ['id', 'topic', 'topicTitle', 'posts', 'suggestedNextTopics', 'generatedAt'],
};

const FEED_CONTINUATION_JSON_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    posts: {
      type: 'array',
      minItems: 4,
      maxItems: 8,
      items: POST_JSON_SCHEMA,
    },
  },
  required: ['posts'],
};

const OpenRouterResponseSchema = z
  .object({
    choices: z
      .array(
        z
          .object({
            message: z
              .object({
                content: z.string().nullable().optional(),
                refusal: z.string().nullable().optional(),
              })
              .passthrough(),
            finish_reason: z.string().nullable().optional(),
          })
          .passthrough(),
      )
      .min(1),
  })
  .passthrough();

const OpenRouterErrorSchema = z
  .object({
    error: z
      .object({
        message: z.string().optional(),
        code: z.union([z.string(), z.number()]).optional(),
      })
      .passthrough(),
  })
  .passthrough();

interface OutputParser<T> {
  parse(value: unknown): T;
}

class OpenRouterRequestError extends Error {
  readonly retryable: boolean;
  readonly statusCode = 502;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = 'OpenRouterRequestError';
    this.retryable = retryable;
  }
}

export class OpenRouterProvider implements ILLMProvider {
  readonly supportsImageGeneration = false;
  readonly providerName = 'openrouter';

  private readonly apiKey: string;
  private readonly model: string;
  private readonly siteUrl: string;

  constructor() {
    const apiKey = process.env['OPENROUTER_API_KEY'];
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required when LLM_PROVIDER=openrouter');
    }

    this.apiKey = apiKey;
    this.model = process.env['OPENROUTER_MODEL'] ?? DEFAULT_MODEL;
    this.siteUrl = process.env['OPENROUTER_SITE_URL'] ?? 'http://localhost:5173';
  }

  async generateFeed(request: FeedRequest): Promise<GeneratedFeed> {
    return this.callWithRetry(
      buildFeedUserPrompt(request),
      'generated_feed',
      GENERATED_FEED_JSON_SCHEMA,
      GeneratedFeedSchema,
    );
  }

  async continueFeed(request: ContinueFeedRequest): Promise<FeedContinuation> {
    return this.callWithRetry(
      buildContinueFeedUserPrompt(request),
      'feed_continuation',
      FEED_CONTINUATION_JSON_SCHEMA,
      FeedContinuationSchema,
    );
  }

  async generateImage(_prompt: string): Promise<Buffer | null> {
    return null;
  }

  private async callWithRetry<T>(
    userPrompt: string,
    schemaName: string,
    jsonSchema: JsonSchema,
    outputParser: OutputParser<T>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await this.call(userPrompt, schemaName, jsonSchema, outputParser);
      } catch (error) {
        lastError = error;
        if (error instanceof OpenRouterRequestError && !error.retryable) break;
        if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    if (lastError instanceof Error) throw lastError;
    throw new OpenRouterRequestError('OpenRouter generation failed', false);
  }

  private async call<T>(
    userPrompt: string,
    schemaName: string,
    jsonSchema: JsonSchema,
    outputParser: OutputParser<T>,
  ): Promise<T> {
    let response: Response;
    try {
      response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-OpenRouter-Title': 'DoomSchooling',
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: buildFeedSystemPrompt() },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 4_500,
          reasoning: {
            enabled: false,
          },
          provider: {
            require_parameters: true,
            sort: 'throughput',
          },
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: schemaName,
              strict: true,
              schema: jsonSchema,
            },
          },
        }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch (error) {
      const message = error instanceof Error && error.name === 'TimeoutError'
        ? 'OpenRouter request timed out'
        : 'Could not reach OpenRouter';
      throw new OpenRouterRequestError(message, true);
    }

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch (error) {
      const timedOut =
        error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError');
      throw new OpenRouterRequestError(
        timedOut
          ? 'OpenRouter timed out while generating the response'
          : `OpenRouter returned an unreadable response (${response.status})`,
        timedOut || response.status === 429 || response.status >= 500,
      );
    }

    if (!response.ok) {
      const parsedError = OpenRouterErrorSchema.safeParse(responseBody);
      const detail = parsedError.success
        ? parsedError.data.error.message ?? String(parsedError.data.error.code ?? 'unknown error')
        : 'unknown error';
      const retryable = response.status === 429 || response.status >= 500;
      throw new OpenRouterRequestError(
        `OpenRouter request failed (${response.status}): ${detail}`,
        retryable,
      );
    }

    const completion = OpenRouterResponseSchema.parse(responseBody);
    const message = completion.choices[0]?.message;
    if (!message?.content) {
      throw new OpenRouterRequestError(
        message?.refusal ? `OpenRouter refused the request: ${message.refusal}` : 'OpenRouter returned no content',
        false,
      );
    }

    let parsedContent: unknown;
    try {
      parsedContent = JSON.parse(message.content);
    } catch {
      throw new OpenRouterRequestError('OpenRouter returned invalid JSON', true);
    }

    return outputParser.parse(parsedContent);
  }
}
