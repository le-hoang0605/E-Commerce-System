import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUserResponse } from '../../modules/auth/dto/auth-user-response.dto';


export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthUserResponse => {
        const request = ctx.switchToHttp().getRequest();
        return request.user;
    },
);