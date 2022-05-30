import { map, Observable } from 'rxjs';
import {
  Logger,
  Injectable,
  CallHandler,
  NestInterceptor,
  ExecutionContext,
} from '@nestjs/common';

@Injectable()
export class LogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 获取请求对象
    const req = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        // 记录日志
        Logger.log(
          `Request: ${req.user?.username} ${req.method} ${req.originalUrl}`,
        );
        Logger.log(`Response: ${JSON.stringify(data)}`);
        return data;
      }),
    );
  }
}
