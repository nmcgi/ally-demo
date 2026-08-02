import type { APIGatewayRequestAuthorizerEventV2 } from 'aws-lambda';
import { sign } from 'jsonwebtoken';
import { verifyToken, handler } from './authorizer';

const SECRET = 'test-authorizer-secret';

function makeEvent(authorization?: string): APIGatewayRequestAuthorizerEventV2 {
  return {
    version: '2.0',
    type: 'REQUEST',
    routeArn: 'arn:aws:execute-api:us-east-1:123456789012:api/$default/GET/accounts',
    identitySource: authorization ? [authorization] : [],
    routeKey: 'GET /accounts',
    rawPath: '/accounts',
    rawQueryString: '',
    headers: authorization ? { authorization } : {},
    requestContext: {} as APIGatewayRequestAuthorizerEventV2['requestContext'],
  } as APIGatewayRequestAuthorizerEventV2;
}

describe('authorizer verifyToken', () => {
  it('accepts a valid token and returns identity claims', () => {
    const token = sign({ sub: 'user-1', role: 'customer' }, SECRET, { expiresIn: '15m' });
    expect(verifyToken(token, SECRET)).toEqual({ sub: 'user-1', role: 'customer' });
  });

  it('rejects an expired token', () => {
    const token = sign(
      { sub: 'user-1', role: 'customer', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
    );
    expect(verifyToken(token, SECRET)).toBeNull();
  });

  it('rejects a token signed with the wrong secret', () => {
    const token = sign({ sub: 'user-1', role: 'customer' }, 'a-different-secret', {
      expiresIn: '15m',
    });
    expect(verifyToken(token, SECRET)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifyToken('not.a.jwt', SECRET)).toBeNull();
  });

  it('rejects a token missing the role claim', () => {
    const token = sign({ sub: 'user-1' }, SECRET, { expiresIn: '15m' });
    expect(verifyToken(token, SECRET)).toBeNull();
  });
});

describe('authorizer handler', () => {
  beforeAll(() => {
    process.env['JWT_SECRET'] = SECRET;
  });

  it('authorizes a request with a valid bearer token', async () => {
    const token = sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '15m' });
    const result = await handler(makeEvent(`Bearer ${token}`));
    expect(result).toEqual({ isAuthorized: true, context: { sub: 'user-1', role: 'admin' } });
  });

  it('denies a request with an expired bearer token', async () => {
    const token = sign(
      { sub: 'user-1', role: 'admin', exp: Math.floor(Date.now() / 1000) - 10 },
      SECRET,
    );
    const result = await handler(makeEvent(`Bearer ${token}`));
    expect(result.isAuthorized).toBe(false);
  });

  it('denies a request with no Authorization header', async () => {
    const result = await handler(makeEvent());
    expect(result.isAuthorized).toBe(false);
  });

  it('denies a non-bearer Authorization scheme', async () => {
    const result = await handler(makeEvent('Basic dXNlcjpwYXNz'));
    expect(result.isAuthorized).toBe(false);
  });
});
