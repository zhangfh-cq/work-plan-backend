import { ConfigModule } from 'src/modules/shared/config/config.module';
import { JwtModule } from 'src/modules/shared/jwt/jwt.module';
import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from 'src/modules/shared/typeorm/typeorm.module';
import { UserController } from './user.controller';
import { UserEntity } from 'src/entities/user/user.entity';
import { UserService } from './user.service';
import { UtilModule } from 'src/modules/shared/util/util.module';
import { UtilService } from 'src/modules/shared/util/util.service';

@Module({
  imports: [
    NestTypeOrmModule.forFeature([UserEntity]),
    JwtModule,
    ConfigModule,
    UtilModule,
  ],
  controllers: [UserController],
  providers: [UserService, UtilService],
})
export class UserModule {}
