import { map, Observable } from 'rxjs';
import { Response } from 'express';
import {
  Injectable,
  CallHandler,
  StreamableFile,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<object> {
    return next.handle().pipe(
      map((data) => {
        // 格式化响应数据
        if (data instanceof StreamableFile) {
          const response: Response = context.switchToHttp().getResponse();
          response.setHeader('Content-Length', data.getHeaders().length);
          return data;
        } else {
          return {
            code: 0,
            msg: 'success',
            data: data,
          };
        }
      }),
    );
  }
}
