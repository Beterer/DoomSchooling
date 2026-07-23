import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { LogController, type FastifyError } from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import sensible from '@fastify/sensible';
import { clerkPlugin } from '@clerk/fastify';
import healthRoutes from './routes/health.js';
import feedsRoutes from './routes/feeds.js';
import {
  shutdownTelemetry,
  telemetryEnabled,
} from './telemetry.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env['PORT'] ?? 3000);
const HOST = process.env['HOST'] ?? '0.0.0.0';
const isProduction = process.env['NODE_ENV'] === 'production';
const publicOrigin = process.env['PUBLIC_ORIGIN'];
const clerkPublishableKey = process.env['CLERK_PUBLISHABLE_KEY'];
const clerkSecretKey = process.env['CLERK_SECRET_KEY'];
const isClerkConfigured = Boolean(clerkPublishableKey && clerkSecretKey);
const hasDevAuthBypass =
  !isProduction && process.env['DEV_AUTH_BYPASS'] === 'true';

if (!isClerkConfigured && !hasDevAuthBypass) {
  throw new Error(
    'Clerk keys are required unless DEV_AUTH_BYPASS=true outside production',
  );
}

if (isProduction && (!publicOrigin || !publicOrigin.startsWith('https://'))) {
  throw new Error('PUBLIC_ORIGIN must be an https origin in production');
}

const fastify = Fastify({
  logger: isProduction
    ? {
        level: process.env['LOG_LEVEL'] ?? 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'request.headers.authorization',
            'request.headers.cookie',
          ],
          censor: '[Redacted]',
        },
      }
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true },
        },
      },
  logController: new LogController({
    disableRequestLogging: true,
  }),
  trustProxy: isProduction,
});

if (isProduction && !telemetryEnabled) {
  fastify.log.warn(
    'OTEL_EXPORTER_OTLP_ENDPOINT is not set or invalid; telemetry stays in container logs only',
  );
}

await fastify.register(cors, {
  origin: publicOrigin
    ? [publicOrigin]
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
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

fastify.addHook('onResponse', async (request, reply) => {
  if (request.routeOptions.url === '/api/health') {
    return;
  }

  request.log.info(
    {
      req: request,
      res: reply,
      responseTime: reply.elapsedTime,
    },
    'request completed',
  );
});

// Global error handler — always returns { error: { code, message } }
fastify.setErrorHandler((error: FastifyError, request, reply) => {
  request.log.error({ err: error }, 'request failed');
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
  await shutdownTelemetry();
  process.exit(1);
}

let isShuttingDown = false;

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    void fastify
      .close()
      .then(shutdownTelemetry)
      .finally(() => process.exit(0));
  });
}
