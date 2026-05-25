import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomResponse } from '../responses/custom.response';

export interface Response<T> {
  status: {
    code: number;
    msg: string;
  };
  data: T[];
  property: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();

    return next.handle().pipe(
      map((data) => {
        // 如果是 HTML 响应等非 JSON 类型，直接返回原始数据
        const contentType = response.getHeader ? response.getHeader('Content-Type') : '';
        if (contentType && typeof contentType === 'string' && contentType.includes('text/html')) {
          return data;
        }

        let resultData = [];
        let property = {};
        
        // Handle CustomResponse
        if (data instanceof CustomResponse) {
          // 如果返回的是 CustomResponse，直接返回它
          // 注意：CustomResponse 内部结构需要符合 Response<T> 接口，或者这里做适配
          return {
              status: data.status,
              data: data.data,
              property: data.property || {},
              pagination: data.pagination // 添加 pagination 支持
          } as any;
        } else {
            // Default handling
            if (data === null || data === undefined) {
                resultData = [];
            } else if (Array.isArray(data)) {
                resultData = data;
            } else {
                resultData = [data];
            }
        }

        return {
          status: {
            code: 0,
            msg: '请求成功',
          },
          data: resultData,
          property: property,
        };
      }),
    );
  }
}
