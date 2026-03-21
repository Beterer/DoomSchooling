import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai';
import {
  type ILLMProvider,
  type FeedRequest,
  type GeneratedFeed,
  GeneratedFeedSchema,
} from '@doomschooling/shared';
import { buildFeedSystemPrompt, buildFeedUserPrompt } from '../prompts/feed.prompt.js';

const FEED_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  required: ['id', 'topic', 'posts', 'suggestedNextTopics', 'generatedAt'],
  properties: {
    id: { type: SchemaType.STRING },
    topic: { type: SchemaType.STRING },
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

export class GeminiProvider implements ILLMProvider {
  readonly supportsImageGeneration = false;
  readonly providerName = 'gemini';

  private readonly model;

  constructor() {
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required when LLM_PROVIDER=gemini');
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite-preview',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: FEED_RESPONSE_SCHEMA,
        temperature: 0.9,
      },
    });
  }

  async generateFeed(request: FeedRequest): Promise<GeneratedFeed> {
    const systemPrompt = buildFeedSystemPrompt();
    const userPrompt = buildFeedUserPrompt(request);

    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const result = await this.model.generateContent({
          systemInstruction: systemPrompt,
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        });

        const text = result.response.text();
        const parsed = JSON.parse(text) as unknown;
        return GeneratedFeedSchema.parse(parsed);
      } catch (error) {
        lastError = error;
      }
    }

    throw Object.assign(
      new Error(
        `Gemini feed generation failed after 2 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
      ),
      { statusCode: 502 },
    );
  }

  async generateImage(_prompt: string): Promise<Buffer | null> {
    return null;
  }
}
