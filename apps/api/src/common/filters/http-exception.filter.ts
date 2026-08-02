import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    // Reuse the per-request correlation ID from CorrelationMiddleware so the
    // error log and the client response share one trace identifier.
    const correlationId = request.correlationId ?? randomUUID();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    this.logger.error(
      { correlationId, path: request.url, method: request.method, status, message },
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      statusCode: status,
      correlationId,
      message: typeof message === 'object' && message !== null && 'message' in message
        ? (message as Record<string, unknown>)['message']
        : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
