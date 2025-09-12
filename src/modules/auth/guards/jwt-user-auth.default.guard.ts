  import { AuthGuard } from '@nestjs/passport';
  import { ExecutionContext, Injectable } from '@nestjs/common';

  import { UnauthorizedException } from '../../../exceptions/unauthorized.exception';

  @Injectable()
  export class JwtUserDefaultAuthGuard extends AuthGuard('authDefaultUser') {
    JSON_WEB_TOKEN_ERROR = 'JsonWebTokenError';

    TOKEN_EXPIRED_ERROR = 'TokenExpiredError';

    canActivate(context: ExecutionContext) {
      return super.canActivate(context);
    }

    handleRequest(err: any, user: any, info: Error, context: any, status: any) {
      if (info?.name === this.JSON_WEB_TOKEN_ERROR) {
        throw UnauthorizedException.JSON_WEB_TOKEN_ERROR();
      } else if (info?.name === this.TOKEN_EXPIRED_ERROR) {
        throw UnauthorizedException.TOKEN_EXPIRED_ERROR();
      } else if (info) {
        throw UnauthorizedException.UNAUTHORIZED_ACCESS(info.message);
      } else if (err) {
        throw err;
      }

      return super.handleRequest(err, user, info, context, status);
    }
  }
