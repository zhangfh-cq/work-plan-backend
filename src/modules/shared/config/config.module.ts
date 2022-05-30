import { ConfigModule as NestConfigModule } from '@nestjs/config';

export const ConfigModule = NestConfigModule.forRoot({
  isGlobal: false,
  envFilePath: '.env',
});
