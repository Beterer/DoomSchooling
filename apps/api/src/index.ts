import { config } from 'dotenv';
config({ path: new URL('../../../.env', import.meta.url) });

import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import healthRoutes from './routes/health.js';
import feedsRoutes from './routes/feeds.js';

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';

const fastify = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  },
});

await fastify.register(cors, {
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
});

await fastify.register(sensible);
await fastify.register(healthRoutes);
await fastify.register(feedsRoutes);

// Global error handler — always returns { error: { code, message } }
fastify.setErrorHandler((error: FastifyError, _request, reply) => {
  fastify.log.error(error);
  const statusCode = error.statusCode ?? 500;
  return reply.code(statusCode).send({
    error: {
      code: error.code ?? 'INTERNAL_ERROR',
      message: error.message,
    },
  });
});

try {
  await fastify.listen({ port: PORT, host: HOST });
} catch (err) {
  fastify.log.error(err);
  process.exit(1);
}
