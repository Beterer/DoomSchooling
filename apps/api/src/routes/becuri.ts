import { createHash, timingSafeEqual } from 'node:crypto';
import type { FastifyPluginAsync, FastifyRequest } from 'fastify';
import { BulbBookingSchema } from '@doomschooling/shared';
import { BecuriService, BookingStoreFullError } from '../services/becuri.service.js';

const ADMIN_TOKEN_HEADER = 'x-becuri-token';
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_BOOKINGS = 10;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

/**
 * The booking endpoint is public — she has no account — so a small in-memory
 * per-IP limit keeps a stranger with the URL from filling the log.
 */
function createRateLimiter() {
  const hits = new Map<string, RateLimitEntry>();

  return function isAllowed(request: FastifyRequest): boolean {
    const now = Date.now();

    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }

    const existing = hits.get(request.ip);
    if (!existing) {
      hits.set(request.ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
      return true;
    }

    if (existing.count >= RATE_LIMIT_MAX_BOOKINGS) return false;

    existing.count += 1;
    return true;
  };
}

function matchesAdminToken(provided: unknown, expected: string): boolean {
  if (typeof provided !== 'string' || provided.length === 0) return false;

  // Hashing first keeps the comparison constant-time for any input length.
  const providedHash = createHash('sha256').update(provided).digest();
  const expectedHash = createHash('sha256').update(expected).digest();

  return timingSafeEqual(providedHash, expectedHash);
}

const becuriRoutes: FastifyPluginAsync = async (fastify) => {
  const service = new BecuriService();
  const isAllowed = createRateLimiter();
  const adminToken = process.env['BECURI_ADMIN_TOKEN'] ?? '';

  if (!adminToken) {
    fastify.log.warn(
      'BECURI_ADMIN_TOKEN is not set; bookings are still recorded but /api/becuri/answers stays closed',
    );
  }

  fastify.post('/api/becuri', async (request, reply) => {
    if (!isAllowed(request)) {
      return reply.code(429).send({
        error: {
          code: 'TOO_MANY_BOOKINGS',
          message: 'Prea multe programări de la aceeași adresă. Mai încearcă mai târziu.',
        },
      });
    }

    const parsed = BulbBookingSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: {
          code: 'INVALID_REQUEST',
          message: parsed.error.issues.map((issue) => issue.message).join('; '),
        },
      });
    }

    let entry;
    try {
      entry = await service.save(parsed.data);
    } catch (error) {
      if (error instanceof BookingStoreFullError) {
        return reply.code(507).send({
          error: {
            code: 'BOOKING_LOG_FULL',
            message: 'Nu mai am loc de programări. Sună-l pe electrician direct.',
          },
        });
      }
      throw error;
    }

    // Also surfaces in Grafana Loki, so the answer is never only on one disk.
    request.log.info(
      {
        bookingId: entry.id,
        refusals: entry.refusals,
        date: entry.date,
        time: entry.time,
        burntBulbs: entry.burntBulbs,
        extras: entry.extras,
      },
      'becuri booking received',
    );

    return reply.code(201).send({ data: { id: entry.id, receivedAt: entry.receivedAt } });
  });

  fastify.get('/api/becuri/answers', async (request, reply) => {
    if (!adminToken) {
      return reply.code(503).send({
        error: {
          code: 'ADMIN_TOKEN_NOT_CONFIGURED',
          message: 'BECURI_ADMIN_TOKEN is not set on this server',
        },
      });
    }

    if (!matchesAdminToken(request.headers[ADMIN_TOKEN_HEADER], adminToken)) {
      return reply.code(401).send({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Token invalid',
        },
      });
    }

    return reply.send({ data: await service.list() });
  });
};

export default becuriRoutes;
