import { DataController } from './data.controller';
import { DataService } from './data.service';
import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from 'src/modules/shared/typeorm/typeorm.module';
import { PlanEntity } from 'src/entities/plan/plan.entity';
import { SubmitHistoryEntity } from 'src/entities/plan/submit-history.entity';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilModule } from 'src/modules/shared/util/util.module';
import { UtilService } from 'src/modules/shared/util/util.service';

@Module({
  imports: [
    NestTypeOrmModule.forFeature([UserEntity, PlanEntity, SubmitHistoryEntity]),
    UtilModule,
  ],
  controllers: [DataController],
  providers: [DataService, UtilService],
})
export class DataModule {}
