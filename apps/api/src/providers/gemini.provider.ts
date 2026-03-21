import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import {
  type ILLMProvider,
  type FeedRequest,
  type GeneratedFeed,
  type ContinueFeedRequest,
  type FeedContinuation,
  GeneratedFeedSchema,
  FeedContinuationSchema,
} from '@doomschooling/shared';
import { buildFeedSystemPrompt, buildFeedUserPrompt, buildContinueFeedUserPrompt } from '../prompts/feed.prompt.js';

const FEED_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  required: ['id', 'topic', 'topicTitle', 'posts', 'suggestedNextTopics', 'generatedAt'],
  properties: {
    id: { type: SchemaType.STRING },
    topic: { type: SchemaType.STRING },
    topicTitle: { type: SchemaType.STRING },
    generatedAt: { type: SchemaType.STRING },
    suggestedNextTopics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    posts: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        required: ['id', 'persona', 'content', 'postType', 'depth', 'votes', 'timestamp'],
        properties: {
          id: { type: SchemaType.STRING },
          content: { type: SchemaType.STRING },
          postType: { type: SchemaType.STRING, format: 'enum', enum: ['text', 'code', 'image', 'divider'] },
          language: { type: SchemaType.STRING, nullable: true },
          imageUrl: { type: SchemaType.STRING, nullable: true },
          imageAlt: { type: SchemaType.STRING, nullable: true },
          depth: { type: SchemaType.INTEGER },
          parentId: { type: SchemaType.STRING, nullable: true },
          votes: { type: SchemaType.INTEGER },
          timestamp: { type: SchemaType.STRING },
          persona: {
            type: SchemaType.OBJECT,
            required: ['id', 'displayName', 'handle', 'role', 'avatarColor', 'avatarInitials'],
            properties: {
              id: { type: SchemaType.STRING },
              displayName: { type: SchemaType.STRING },
              handle: { type: SchemaType.STRING },
              role: { type: SchemaType.STRING, format: 'enum', enum: ['expert', 'practitioner', 'learner', 'skeptic', 'enthusiast'] },
              avatarColor: { type: SchemaType.STRING },
              avatarInitials: { type: SchemaType.STRING },
            },
          },
        },
      },
    },
  },
};

const CONTINUATION_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  required: ['posts'],
  properties: {
    posts: FEED_RESPONSE_SCHEMA.properties!['posts'] as Schema,
  },
};

export class GeminiProvider implements ILLMProvider {
  readonly supportsImageGeneration = true;
  readonly providerName = 'gemini';

  private readonly model;
  private readonly continuationModel;
  private readonly imageModel;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required when LLM_PROVIDER=gemini');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelName = 'gemini-3.1-flash-lite-preview';
    this.model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: FEED_RESPONSE_SCHEMA,
        temperature: 0.9,
      },
    });
    this.continuationModel = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: CONTINUATION_RESPONSE_SCHEMA,
        temperature: 0.9,
      },
    });
    this.imageModel = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-image',
      generationConfig: {
        // @ts-expect-error -- responseModalities is supported by the API but not yet in the SDK types
        responseModalities: ['IMAGE', 'TEXT'],
      },
    });
  }

  async generateFeed(request: FeedRequest): Promise<GeneratedFeed> {
    return this.callWithRetry(
      buildFeedUserPrompt(request),
      this.model,
      GeneratedFeedSchema,
    );
  }

  async continueFeed(request: ContinueFeedRequest): Promise<FeedContinuation> {
    return this.callWithRetry(
      buildContinueFeedUserPrompt(request),
      this.continuationModel,
      FeedContinuationSchema,
    );
  }

  async generateImage(prompt: string): Promise<Buffer | null> {
    try {
      const result = await this.imageModel.generateContent(
        `Generate an educational illustration for a social media post. The image should be clear, informative, and visually engaging. Subject: ${prompt}`,
      );

      const response = result.response;
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) return null;

      const parts = candidates[0]?.content?.parts;
      if (!parts) return null;

      for (const part of parts) {
        if (part.inlineData?.data) {
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }

      return null;
    } catch (error) {
      console.error('Image generation failed:', error instanceof Error ? error.message : error);
      return null;
    }
  }

  private async callWithRetry<T>(
    userPrompt: string,
    model: typeof this.model,
    schema: { parse: (data: unknown) => T },
  ): Promise<T> {
    const systemPrompt = buildFeedSystemPrompt();
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await model.generateContent({
          systemInstruction: systemPrompt,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        });

        const text = result.response.text();
        const parsed = JSON.parse(text) as unknown;
        return schema.parse(parsed);
      } catch (error) {
        lastError = error;
      }
    }

    throw Object.assign(
      new Error(
        `Gemini generation failed after 2 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      ),
      { statusCode: 502 },
    );
  }
}
