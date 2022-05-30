import { Module } from '@nestjs/common';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [NestScheduleModule.forRoot()],
})
export class ScheduleModule {}
