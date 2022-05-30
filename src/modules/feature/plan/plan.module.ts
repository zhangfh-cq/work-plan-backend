import { ConfigModule } from 'src/modules/shared/config/config.module';
import { ConfigService } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { NestTypeOrmModule } from 'src/modules/shared/typeorm/typeorm.module';
import { PlanController } from './plan.controller';
import { PlanEntity } from 'src/entities/plan/plan.entity';
import { PlanService } from './plan.service';
import { SubmitHistoryEntity } from 'src/entities/plan/submit-history.entity';
import { UpdateHistoryEntity } from 'src/entities/plan/update-history.entity';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilModule } from 'src/modules/shared/util/util.module';
import { UtilService } from 'src/modules/shared/util/util.service';

@Module({
  imports: [
    NestTypeOrmModule.forFeature([
      PlanEntity,
      UserEntity,
      SubmitHistoryEntity,
      UpdateHistoryEntity,
    ]),
    UtilModule,
    ConfigModule,
  ],
  controllers: [PlanController],
  providers: [PlanService, UtilService, ConfigService],
})
export class PlanModule {}
