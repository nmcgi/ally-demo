import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { correlationStorage } from './correlation-context';

export const CORRELATION_HEADER = 'x-correlation-id';

/**
 * Assigns a correlation ID to every request — reused from an inbound
 * `x-correlation-id` / `x-amzn-trace-id` header when present (so a trace can be
 * followed across API Gateway → Lambda → Step Functions), otherwise generated.
 * The ID is echoed back on the response and stored in AsyncLocalStorage for the
 * structured logger.
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const headerValue = req.headers[CORRELATION_HEADER] ?? req.headers['x-amzn-trace-id'];
    const incoming = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const correlationId = incoming?.trim() || randomUUID();

    req.correlationId = correlationId;
    res.setHeader(CORRELATION_HEADER, correlationId);

    correlationStorage.run({ correlationId }, () => next());
  }
}
