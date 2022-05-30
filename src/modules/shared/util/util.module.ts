import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from '../typeorm/typeorm.module';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilService } from './util.service';

@Module({
  imports: [NestTypeOrmModule.forFeature([UserEntity])],
  providers: [UtilService],
  exports: [UtilService],
})
export class UtilModule {}
