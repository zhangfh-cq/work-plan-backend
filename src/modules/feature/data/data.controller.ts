import { DataService } from './data.service';
import { Role } from 'src/decorators/role.decorator';
import { ROLE } from 'src/enums/user/role.enum';
import {
  Get,
  Query,
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

@Role(ROLE.ADMIN)
@Controller('data') // 数据统计控制器
@UseInterceptors(ClassSerializerInterceptor)
export class DataController {
  constructor(private dataService: DataService) {}

  @Get('plan/complete') // 获取计划完成数量情况
  async getPlanCompleteData(@Query('id') planId: number) {
    return await this.dataService.getPlanCompleteData(planId);
  }

  @Get('plan/audit') // 计划审核状态情况
  async getPlanAuditData(@Query('id') planId: number) {
    return await this.dataService.getPlanAuditData(planId);
  }

  @Get('plan/submit') // 计划提交时间状况
  async getPlanSubmitDateData(
    @Query('id') planId: number,
    @Query('start') startDate: Date,
    @Query('end') endDate: Date,
  ) {
    return await this.dataService.getPlanSubmitDateData(
      planId,
      startDate,
      endDate,
    );
  }

  @Get('plan/publisher') // 获取管理员发布的计划数量数据
  async getPlanPublisherData() {
    return await this.dataService.getPlanPublisherData();
  }

  @Get('user/gender') // 获取用户性别数量数据
  async getUserGenderData() {
    return await this.dataService.getUserGenderData();
  }

  @Get('user/age') // 获取用户年龄数据
  async getUserAgeData() {
    return await this.dataService.getUserAgeData();
  }
}
