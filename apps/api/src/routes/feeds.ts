import type { FastifyPluginAsync } from 'fastify';
import { FeedRequestSchema, ContinueFeedRequestSchema } from '@doomschooling/shared';
import { resolveProvider } from '../providers/index.js';

const feedsRoutes: FastifyPluginAsync = async (fastify) => {
  const provider = resolveProvider();

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
    return reply.code(200).send({ data: continuation });
  });
};

export default feedsRoutes;
