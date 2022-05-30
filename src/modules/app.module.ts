import { AuthModule } from './feature/auth/auth.module';
import { BulletinModule } from './feature/bulletin/bulletin.module';
import { DataModule } from './feature/data/data.module';
import { Module } from '@nestjs/common';
import { PlanModule } from './feature/plan/plan.module';
import { ScheduleModule } from './shared/schedule/schedule.module';
import { TypeOrmModule } from './shared/typeorm/typeorm.module';
import { UserModule } from './feature/user/user.module';

@Module({
  imports: [
    TypeOrmModule,
    AuthModule,
    ScheduleModule,
    UserModule,
    PlanModule,
    BulletinModule,
    DataModule,
  ],
})
export class AppModule {}
