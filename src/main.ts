import { AppModule } from './modules/app.module';
import { ExceptionFilter } from './filters/exception.filter';
import { LogInterceptor } from './interceptors/log.interceptor';
import { NestFactory } from '@nestjs/core';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app
    // .useGlobalGuards(new RoleGuard(),new StatusGuard()) // 隐式全局角色&状态守卫
    .useGlobalPipes(new ValidationPipe({ stopAtFirstError: true })) // 使用全局验证管道
    .useGlobalInterceptors(new TransformInterceptor(), new LogInterceptor()) // 使用全局转化&日志拦截器
    .useGlobalFilters(new ExceptionFilter()) // 使用全局自定义异常过滤器
    .listen(3000);
}
bootstrap();
