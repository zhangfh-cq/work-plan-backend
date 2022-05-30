import { ConfigModule } from '../config/config.module';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';

export const TypeOrmModule = NestTypeOrmModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  async useFactory(configService: ConfigService) {
    return {
      type: 'mysql',
      host: configService.get<string>('DATABASE_HOST'),
      port: configService.get<number>('DATABASE_PORT'),
      username: configService.get<string>('DATABASE_USERNAME'),
      password: configService.get<string>('DATABASE_PASSWORD'),
      database: configService.get<string>('DATABASE_DATABASE'),
      synchronize: configService.get<boolean>('DATABASE_SYNCHRONIZE'),
      autoLoadEntities: true,
    };
  },
});

export { TypeOrmModule as NestTypeOrmModule } from '@nestjs/typeorm';
