import { BulletinController } from './bulletin.controller';
import { BulletinEntity } from 'src/entities/bulletin/bulletin.entity';
import { BulletinService } from './bulletin.service';
import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from 'src/modules/shared/typeorm/typeorm.module';
import { UtilModule } from 'src/modules/shared/util/util.module';
import { UtilService } from 'src/modules/shared/util/util.service';
import { UserEntity } from 'src/entities/user/user.entity';

@Module({
  imports: [
    NestTypeOrmModule.forFeature([BulletinEntity, UserEntity]),
    UtilModule,
  ],
  controllers: [BulletinController],
  providers: [BulletinService, UtilService],
})
export class BulletinModule {}
