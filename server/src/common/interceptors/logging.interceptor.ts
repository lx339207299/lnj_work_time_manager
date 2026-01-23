
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest();
    const { method, url, body, query, params } = request;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);
    if (body && Object.keys(body).length > 0) {
        this.logger.debug(`Body: ${JSON.stringify(body)}`);
    }
    if (query && Object.keys(query).length > 0) {
        this.logger.debug(`Query: ${JSON.stringify(query)}`);
    }
    if (params && Object.keys(params).length > 0) {
        this.logger.debug(`Params: ${JSON.stringify(params)}`);
    }

    return next
      .handle()
      .pipe(
        tap((data) => {
            const delay = Date.now() - now;
            this.logger.log(`Response for ${method} ${url} - ${delay}ms`);
            // Optional: Log response data (can be verbose)
            // this.logger.debug(`Response Data: ${JSON.stringify(data)}`);
        }),
      );
  }
}
