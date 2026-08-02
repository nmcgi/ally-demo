import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '@ally/shared-types';
import { Request } from 'express';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    return request.user;
  },
);
