import type { FastifyPluginAsync } from 'fastify';

const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/health', async (_request, reply) => {
    return reply.send({ data: { status: 'ok', timestamp: new Date().toISOString() } });
  });
};

export default healthRoutes;
