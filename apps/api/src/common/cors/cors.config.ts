import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/** Local dev origins — the host shell plus each micro-frontend. */
const LOCAL_ORIGINS = [
  'http://localhost:3000', // web-host
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
];

/**
 * Browser calls from the Next.js apps are cross-origin (they run on their own
 * ports), so every POST triggers a preflight. Origins come from `CORS_ORIGINS`
 * (comma-separated) and fall back to the local dev ports.
 */
export function corsOptions(): CorsOptions {
  const configured = (process.env['CORS_ORIGINS'] ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return {
    origin: configured.length > 0 ? configured : LOCAL_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  };
}
