import type { FastifyPluginAsync } from 'fastify';
import type { Post } from '@doomschooling/shared';
import { FeedRequestSchema, ContinueFeedRequestSchema } from '@doomschooling/shared';
import { resolveProvider } from '../providers/index.js';
import { ImageService } from '../services/image.service.js';

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

const feedsRoutes: FastifyPluginAsync = async (fastify) => {
  const provider = resolveProvider();
  const imageService = new ImageService();

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

    const feed = await provider.generateFeed(parsed.data);
    await populateImages(feed.posts, provider, imageService);
    return reply.code(201).send({ data: feed });
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

    const continuation = await provider.continueFeed(parsed.data);
    await populateImages(continuation.posts, provider, imageService);
    return reply.code(200).send({ data: continuation });
  });
};

export default feedsRoutes;
