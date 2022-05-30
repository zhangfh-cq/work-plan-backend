import { ConfigModule } from '../config/config.module';
import { ConfigService } from '@nestjs/config';
import { JwtModule as NestJwtModule } from '@nestjs/jwt';

export const JwtModule = NestJwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async function (configService: ConfigService) {
    return {
      secret: configService.get<string>('JWT_SECRET'),
      signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') },
    };
  },
});
