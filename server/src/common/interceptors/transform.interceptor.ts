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
    return next.handle().pipe(
      map((data) => {
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
