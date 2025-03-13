import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class ErrorLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    console.log(
      '🚀 ~ ErrorLoggingInterceptor ~ intercept ~ request:',
      method,
      url,
      body,
    );

    return next.handle().pipe(
      catchError((error) => {
        console.error(`
          API Error:
          ---------------------
          Method: ${method}
          URL: ${url}
          Payload: ${JSON.stringify(body, null, 2)}
          Error Message: ${error.message || 'No error message available'}
          Stack Trace: ${error.stack || 'No stack trace available'}
        `);

        return throwError(() => error); // Re-throw the error for further handling
      }),
    );
  }
}
