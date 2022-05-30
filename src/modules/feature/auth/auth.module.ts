import { APP_GUARD } from '@nestjs/core';
import { AuthService } from './auth.service';
import { ConfigModule } from '../../shared/config/config.module';
import { JwtModule } from '../../shared/jwt/jwt.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from '../../shared/typeorm/typeorm.module';
import { PassportModule } from '@nestjs/passport';
import { RoleGuard } from 'src/guards/role.guard';
import { StatusGuard } from 'src/guards/status.guard';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilModule } from '../../shared/util/util.module';
import { UtilService } from '../../shared/util/util.service';

@Module({
  imports: [
    NestTypeOrmModule.forFeature([UserEntity]),
    PassportModule,
    ConfigModule,
    JwtModule,
    UtilModule,
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UtilService,
    { provide: APP_GUARD, useClass: RoleGuard },
    { provide: APP_GUARD, useClass: StatusGuard },
  ],
})
export class AuthModule {}
