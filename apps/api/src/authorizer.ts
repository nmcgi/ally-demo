import type {
  APIGatewayRequestAuthorizerEventV2,
  APIGatewaySimpleAuthorizerWithContextResult,
} from 'aws-lambda';
import { verify } from 'jsonwebtoken';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

/**
 * Lambda authorizer for the HTTP API (payload format 2.0, simple responses).
 *
 * API Gateway returns 401 when the identity source (Authorization header) is
 * absent — the authorizer is never invoked. When a token IS present but fails
 * verification we return `{ isAuthorized: false }`, which API Gateway surfaces
 * as 403. Valid tokens pass `sub`/`role` through as the authorizer context.
 */

export interface AuthorizerContext {
  sub: string;
  role: string;
}

type SimpleResult = APIGatewaySimpleAuthorizerWithContextResult<AuthorizerContext>;

const DENY: APIGatewaySimpleAuthorizerWithContextResult<Record<string, never>> = {
  isAuthorized: false,
  context: {},
};

let cachedSecret: string | undefined;

/**
 * Resolves the JWT signing key. Prefers a plaintext `JWT_SECRET` (used in local
 * dev and tests); otherwise fetches the SecureString referenced by
 * `JWT_SECRET_SSM` (name or ARN) and caches it across warm invocations so the
 * plaintext secret never lives in the Lambda's environment.
 */
export async function resolveSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;

  const direct = process.env['JWT_SECRET'];
  if (direct) {
    cachedSecret = direct;
    return direct;
  }

  const ref = process.env['JWT_SECRET_SSM'];
  if (!ref) {
    throw new Error('Neither JWT_SECRET nor JWT_SECRET_SSM is configured');
  }

  const ssm = new SSMClient({});
  const result = await ssm.send(new GetParameterCommand({ Name: ref, WithDecryption: true }));
  const value = result.Parameter?.Value;
  if (!value) {
    throw new Error('JWT secret parameter resolved to an empty value');
  }

  cachedSecret = value;
  return value;
}

function extractToken(event: APIGatewayRequestAuthorizerEventV2): string | null {
  const header =
    event.headers?.['authorization'] ??
    event.headers?.['Authorization'] ??
    event.identitySource?.[0];
  if (!header) return null;

  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

/**
 * Verifies a JWT and returns its identity claims, or null when the token is
 * expired, has an invalid signature, or is missing required claims. Pure and
 * side-effect free so it can be unit-tested without AWS.
 */
export function verifyToken(token: string, secret: string): AuthorizerContext | null {
  try {
    const decoded = verify(token, secret);
    if (typeof decoded === 'string') return null;

    const sub = decoded.sub;
    const role = (decoded as { role?: unknown }).role;
    if (typeof sub !== 'string' || typeof role !== 'string' || !sub || !role) {
      return null;
    }
    return { sub, role };
  } catch {
    // TokenExpiredError, JsonWebTokenError (bad signature/malformed), etc.
    return null;
  }
}

export const handler = async (
  event: APIGatewayRequestAuthorizerEventV2,
): Promise<SimpleResult | typeof DENY> => {
  const token = extractToken(event);
  if (!token) return DENY;

  let secret: string;
  try {
    secret = await resolveSecret();
  } catch (err) {
    // Fail closed — never authorize when the key can't be resolved.
    process.stderr.write(
      `${JSON.stringify({ level: 'error', context: 'authorizer', message: 'secret resolution failed', error: err instanceof Error ? err.message : String(err) })}\n`,
    );
    return DENY;
  }

  const identity = verifyToken(token, secret);
  if (!identity) return DENY;

  return { isAuthorized: true, context: identity };
};
