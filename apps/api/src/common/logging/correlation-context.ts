import { AsyncLocalStorage } from 'async_hooks';

export interface CorrelationStore {
  correlationId: string;
}

/**
 * Request-scoped storage for the correlation ID so any logger — even in a
 * service far from the HTTP layer — can stamp its output without the ID being
 * threaded through every call.
 */
export const correlationStorage = new AsyncLocalStorage<CorrelationStore>();

export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore()?.correlationId;
}
