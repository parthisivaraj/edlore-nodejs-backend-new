import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const skip = this.reflector.get<boolean>('isAdmin', context.getHandler());
    if (skip) {
      return next.handle(); // Skip the interceptor logic
    }

    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      map((responseData) => {
        const adminHeader = request.headers['admin'];

        if (adminHeader === 'true') {
          return {
            ...responseData,
            message: responseData?.message || 'Success',
          };
        } else {
          const code =
            typeof responseData?.status === 'number' &&
            Object.values(HttpStatus).includes(responseData?.status)
              ? responseData?.status
              : HttpStatus.OK;
          return {
            code: code,
            message: responseData?.message || 'Success',
            data: responseData?.data || responseData,
          };
        }
      }),
    );
  }
}
