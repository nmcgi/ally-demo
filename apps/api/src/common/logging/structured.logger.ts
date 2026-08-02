import { LoggerService, LogLevel } from '@nestjs/common';
import { getCorrelationId } from './correlation-context';

/**
 * Emits one JSON object per log line so CloudWatch Logs Insights can filter and
 * aggregate on structured fields (level, correlationId, context). Every entry
 * is automatically stamped with the current request's correlation ID.
 */
export class StructuredLogger implements LoggerService {
  private write(level: LogLevel, message: unknown, context?: string, stack?: string): void {
    const entry: Record<string, unknown> = {
      level,
      timestamp: new Date().toISOString(),
      correlationId: getCorrelationId(),
      context,
      message: message instanceof Error ? message.message : message,
    };
    if (stack) entry['stack'] = stack;

    const line = JSON.stringify(entry);
    if (level === 'error' || level === 'fatal') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, stack?: string, context?: string): void {
    this.write('error', message, context, stack);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }
}
