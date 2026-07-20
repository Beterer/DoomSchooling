import { config } from 'dotenv';
config({ path: new URL('../../../.env', import.meta.url) });

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import sensible from '@fastify/sensible';
import { clerkPlugin } from '@clerk/fastify';
import healthRoutes from './routes/health.js';
import feedsRoutes from './routes/feeds.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const clerkPublishableKey = process.env['CLERK_PUBLISHABLE_KEY'];
const clerkSecretKey = process.env['CLERK_SECRET_KEY'];
const isClerkConfigured = Boolean(clerkPublishableKey && clerkSecretKey);
const hasDevAuthBypass =
  process.env['NODE_ENV'] !== 'production' && process.env['DEV_AUTH_BYPASS'] === 'true';

if (!isClerkConfigured && !hasDevAuthBypass) {
  throw new Error(
    'Clerk keys are required unless DEV_AUTH_BYPASS=true outside production',
  );
}

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
if (isClerkConfigured) {
  await fastify.register(clerkPlugin, {
    publishableKey: clerkPublishableKey,
    secretKey: clerkSecretKey,
  });
} else {
  fastify.log.warn('DEV_AUTH_BYPASS is enabled; API auth is disabled for this local dev session');
}
await fastify.register(fastifyStatic, {
  root: join(__dirname, 'uploads'),
  prefix: '/uploads/',
  decorateReply: false,
});
await fastify.register(healthRoutes);
await fastify.register(feedsRoutes, { requireAuth: !hasDevAuthBypass });

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
