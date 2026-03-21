import type { FastifyPluginAsync } from 'fastify';
import { FeedRequestSchema } from '@doomschooling/shared';
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
};

export default feedsRoutes;
