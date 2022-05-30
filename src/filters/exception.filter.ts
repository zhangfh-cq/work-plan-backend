import { Response } from 'express';
import {
  Catch,
  Logger,
  ArgumentsHost,
  HttpException,
  ExceptionFilter as NestExceptionFilter,
} from '@nestjs/common';

@Catch() // 捕获所有异常
export class ExceptionFilter implements NestExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    // 记录日志
    const req = host.switchToHttp().getRequest();
    Logger.error(
      `Request: ${req.user?.username ?? ''} ${req.method} ${req.originalUrl}`,
    );
    Logger.error(`${exception.stack}${exception.message}`);

    // 根据异常类型确定错误信息
    let errorMsg: unknown;
    if (exception instanceof HttpException) {
      const exceptionRes: any = exception.getResponse();
      errorMsg = exceptionRes?.message ?? exceptionRes;
    } else {
      errorMsg = 'Unknown Exception';
    }

    // 响应数据
    const response: Response = host.switchToHttp().getResponse<Response>();
    response.send({
      code: -1,
      msg: errorMsg,
      data: null,
    });
  }
}
