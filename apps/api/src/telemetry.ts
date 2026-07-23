import { FastifyOtelInstrumentation } from '@fastify/otel';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { UndiciInstrumentation } from '@opentelemetry/instrumentation-undici';
import { NodeSDK, logs, metrics, resources } from '@opentelemetry/sdk-node';

const SERVICE_NAME = 'doomschooling-api';
const HEALTH_PATH = '/api/health';
const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT']?.trim();
const otlpProtocol =
  process.env['OTEL_EXPORTER_OTLP_PROTOCOL']?.trim() || 'http/protobuf';

let sdk: NodeSDK | undefined;

export let telemetryEnabled = false;

if (otlpEndpoint) {
  try {
    if (otlpProtocol !== 'http/protobuf') {
      throw new Error('Only OTLP over HTTP/protobuf is supported');
    }

    // Exporters read OTEL_EXPORTER_OTLP_ENDPOINT and
    // OTEL_EXPORTER_OTLP_HEADERS directly. Batching keeps network work away
    // from the request path; console/Pino logging continues independently.
    sdk = new NodeSDK({
      resource: resources.resourceFromAttributes({
        'service.name': SERVICE_NAME,
        'deployment.environment.name':
          process.env['NODE_ENV'] ?? 'development',
      }),
      traceExporter: new OTLPTraceExporter(),
      metricReaders: [
        new metrics.PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter(),
          exportIntervalMillis: 60_000,
        }),
      ],
      logRecordProcessors: [
        new logs.BatchLogRecordProcessor({
          exporter: new OTLPLogExporter(),
        }),
      ],
      instrumentations: [
        new HttpInstrumentation({
          ignoreIncomingRequestHook: (request) =>
            request.url?.split('?', 1)[0] === HEALTH_PATH,
        }),
        new UndiciInstrumentation(),
        new FastifyOtelInstrumentation({
          registerOnInitialization: true,
          ignorePaths: HEALTH_PATH,
          instrumentHooks: false,
          recordExceptions: true,
        }),
        new PinoInstrumentation(),
        new RuntimeNodeInstrumentation({
          monitoringPrecision: 5_000,
        }),
      ],
    });

    sdk.start();
    telemetryEnabled = true;
  } catch {
    // Observability must never prevent the API from starting. Do not include
    // the caught error because exporter errors can contain endpoint details.
    console.error(
      'OpenTelemetry could not start; continuing with container logs only',
    );
    sdk = undefined;
  }
}

export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
  } catch {
    console.error('OpenTelemetry could not flush cleanly during shutdown');
  }
}
