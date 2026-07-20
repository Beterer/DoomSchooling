import type { FastifyPluginAsync } from 'fastify';
import type { GeneratedFeed, Post } from '@doomschooling/shared';
import { FeedRequestSchema, ContinueFeedRequestSchema } from '@doomschooling/shared';
import { getAuth } from '@clerk/fastify';
import { resolveProvider } from '../providers/index.js';
import { ImageService } from '../services/image.service.js';

const MAX_CONTINUATIONS_PER_TOPIC = 10;
const topicContinuationCounts = new Map<string, number>();
const activeRequests = new Set<string>();
const activeFeedGenerations = new Map<string, Promise<GeneratedFeed>>();

interface FeedsRouteOptions {
  requireAuth?: boolean;
}

async function populateImages(
  posts: Post[],
  provider: ReturnType<typeof resolveProvider>,
  imageService: ImageService,
): Promise<void> {
  if (!provider.supportsImageGeneration) return;

  const imagePromises = posts.map(async (post) => {
    if (post.postType !== 'image' || !post.imageAlt) return;

    const buffer = await provider.generateImage(post.imageAlt);
    if (!buffer) return;

    const url = await imageService.save(buffer);
    post.imageUrl = url;
  });

  await Promise.all(imagePromises);
}

const feedsRoutes: FastifyPluginAsync<FeedsRouteOptions> = async (fastify, options) => {
  const provider = resolveProvider();
  const imageService = new ImageService();
  const requireAuth = options.requireAuth ?? true;

  if (requireAuth) {
    // Require a valid Clerk session for all routes in this plugin
    fastify.addHook('preHandler', async (request, reply) => {
      const auth = getAuth(request);
      if (!auth.userId) {
        return reply.code(401).send({
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }
    });
  }

  fastify.post('/api/feeds/generate', async (request, reply) => {
    const parsed = FeedRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        },
      });
    }

    const requestKey = `${parsed.data.depth ?? 'intermediate'}:${parsed.data.topic.trim().toLowerCase()}`;
    let generation = activeFeedGenerations.get(requestKey);

    if (!generation) {
      generation = (async () => {
        const feed = await provider.generateFeed(parsed.data);
        await populateImages(feed.posts, provider, imageService);
        return feed;
      })();
      activeFeedGenerations.set(requestKey, generation);
    }

    try {
      const feed = await generation;
      return reply.code(201).send({ data: feed });
    } finally {
      if (activeFeedGenerations.get(requestKey) === generation) {
        activeFeedGenerations.delete(requestKey);
      }
    }
  });

  fastify.post('/api/feeds/continue', async (request, reply) => {
    const parsed = ContinueFeedRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues.map((i) => i.message).join('; '),
        },
      });
    }

    const { topic } = parsed.data;

    // Reject if a request for this topic is already in flight
    if (activeRequests.has(topic)) {
      return reply.code(429).send({
        error: {
          code: 'REQUEST_IN_FLIGHT',
          message: 'A generation request for this topic is already in progress',
        },
      });
    }

    // Enforce per-topic continuation limit
    const count = topicContinuationCounts.get(topic) ?? 0;
    if (count >= MAX_CONTINUATIONS_PER_TOPIC) {
      return reply.code(429).send({
        error: {
          code: 'TOPIC_LIMIT_REACHED',
          message: `Maximum of ${MAX_CONTINUATIONS_PER_TOPIC} continuations reached for this topic`,
        },
      });
    }

    activeRequests.add(topic);
    try {
      const continuation = await provider.continueFeed(parsed.data);
      await populateImages(continuation.posts, provider, imageService);
      topicContinuationCounts.set(topic, count + 1);
      return reply.code(200).send({ data: continuation });
    } finally {
      activeRequests.delete(topic);
    }
  });
};

export default feedsRoutes;
