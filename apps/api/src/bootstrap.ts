import { config } from 'dotenv';

config({ path: new URL('../../../.env', import.meta.url) });

// Telemetry has to start before Fastify/Pino are imported so their modules can
// be instrumented. Keep the application import dynamic for that reason.
await import('./telemetry.js');
await import('./index.js');
