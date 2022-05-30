import { AddPlanDto } from './dto/add.dto';
import { AuditSubmitDto } from './dto/audit.dto';
import { AuthGuard } from '@nestjs/passport';
import { DeletePlanDto } from './dto/delete.dto';
import { DeleteSubmitDto } from './dto/delete-submit.dto';
import { DownloadFilesDto } from './dto/download-files.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { LockPlanDto } from './dto/lock.dto';
import { PlanSearchOption } from 'src/types/plan/plan-search-option.type';
import { PlanService } from './plan.service';
import { RenameSubmitFileDto } from './dto/rename-submit.dto';
import { Role } from 'src/decorators/role.decorator';
import { ROLE } from 'src/enums/user/role.enum';
import { SUBMIT_STATUS } from 'src/enums/plan/submit-status.enum';
import { SubmitSearchOption } from 'src/types/plan/submit-search-option.type';
import { UnlockPlanDto } from './dto/unlock.dto';
import { UpdatePlanDto } from './dto/update.dto';
import { UpdateSearchOption } from 'src/types/plan/update-search-option.type';
import {
  Get,
  Post,
  Body,
  Query,
  Request,
  UseGuards,
  Controller,
  UploadedFile,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';

@Controller('plan') // 工作计划控制器
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(ClassSerializerInterceptor)
export class PlanController {
  constructor(private planService: PlanService) {}

  @Get('await/list') // 获取未提交的工作计划
  async getUserAwaitSubmitPlans(
    @Request() request: any,
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option') option: PlanSearchOption,
    @Query('value') optionValue: string,
  ) {
    return await this.planService.getUserAwaitSubmitPlans(
      request.user.id,
      start,
      count,
      option,
      optionValue,
    );
  }

  @Get('submit/list') // 获取用户提交记录
  async getUserSubmitHistory(
    @Request() request: any,
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option') option: PlanSearchOption,
    @Query('value') optionValue: string,
    @Query('status') status: SUBMIT_STATUS,
  ) {
    return await this.planService.getUserSubmitHistory(
      request.user.id,
      start,
      count,
      option,
      optionValue,
      status,
    );
  }

  @Post('submit/file') // 提交工作计划材料
  @UseInterceptors(FileInterceptor('file'))
  async submitPlanFile(
    @Request() request: any,
    @Body('id') planId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.planService.submitPlanFile(request.user.id, planId, file);
  }

  @Get('file') // 下载计划文件
  async downloadPlanFile(@Query('id') planId: number) {
    return await this.planService.downloadPlanFile(planId);
  }

  @Get('submit/file') // 下载提交文件
  async downloadSubmitFile(
    @Request() request: any,
    @Query('id') submitId: number,
  ) {
    return await this.planService.downloadSubmitFile(request.user.id, submitId);
  }

  // *************************************************************
  // *************************** 管理员 ***************************
  // *************************************************************

  @Post('add') // 添加工作计划
  @Role(ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async addPlan(
    @Request() request: any,
    @Body() addPlanDto: AddPlanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.planService.addPlan(request.user.id, addPlanDto, file);
  }

  @Post('update') // 更新工作计划
  @Role(ROLE.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async updatePlan(
    @Request() request: any,
    @Body() updatePlanDto: UpdatePlanDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.planService.updatePlan(
      request.user.id,
      updatePlanDto,
      file,
    );
  }

  @Get('list') // 获取工作计划列表
  @Role(ROLE.ADMIN)
  async getPlanList(
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option') option: PlanSearchOption,
    @Query('value') optionValue: string,
  ) {
    return await this.planService.getPlanList(
      start,
      count,
      option,
      optionValue,
    );
  }

  @Post('delete') // 删除工作计划
  @Role(ROLE.ADMIN)
  async deletePlans(@Body() deletePlanDto: DeletePlanDto) {
    return await this.planService.deletePlans(deletePlanDto);
  }

  @Post('lock') // 锁定工作计划
  @Role(ROLE.ADMIN)
  async lockPlan(@Body() lockPlanDto: LockPlanDto) {
    return await this.planService.lockPlans(lockPlanDto);
  }

  @Post('unlock') // 解锁工作计划
  @Role(ROLE.ADMIN)
  async unlockPlans(@Body() unlockPlanDto: UnlockPlanDto) {
    return await this.planService.unlockPlans(unlockPlanDto);
  }

  @Get('submit/history') // 获取提交记录
  @Role(ROLE.ADMIN)
  async getSubmitHistory(
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('submit-option') submitOption: SubmitSearchOption,
    @Query('submit-value') submitValue: string,
    @Query('submit-extra') submitExtra: SubmitSearchOption,
    @Query('extra-value') extraValue: string,
    @Query('plan-option') planOption: PlanSearchOption,
    @Query('plan-value') planValue: string,
  ) {
    return await this.planService.getSubmitHistory(
      start,
      count,
      submitOption,
      submitValue,
      submitExtra,
      extraValue,
      planOption,
      planValue,
    );
  }

  @Post('submit/audit') // 审核提交记录
  @Role(ROLE.ADMIN)
  async auditSubmit(
    @Request() request: any,
    @Body() auditSubmitDto: AuditSubmitDto,
  ) {
    return await this.planService.auditSubmit(request.user.id, auditSubmitDto);
  }

  @Post('submit/delete') // 删除提交记录
  @Role(ROLE.ADMIN)
  async deleteSubmitHistory(@Body() deleteSubmitDto: DeleteSubmitDto) {
    return await this.planService.deleteSubmitHistory(deleteSubmitDto);
  }

  @Get('update/history') // 获取计划更新历史
  @Role(ROLE.ADMIN)
  async getPlanUpdateHistory(
    @Query('id') planId: number,
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option') option: UpdateSearchOption,
    @Query('value') optionValue: string,
  ) {
    return await this.planService.getPlanUpdateHistory(
      planId,
      start,
      count,
      option,
      optionValue,
    );
  }

  @Get('complete') // 获取计划完成情况
  @Role(ROLE.ADMIN)
  async getPlanCompleteStatus(
    @Query('id') planId: number,
    @Query('complete') complete: string,
    @Query('start') start: number,
    @Query('count') count: number,
  ) {
    return await this.planService.getPlanCompleteStatus(
      planId,
      complete === 'true' ? true : false,
      start,
      count,
    );
  }

  @Get('submit/user-file') // 下载用户提交文件
  @Role(ROLE.ADMIN)
  async downloadAnySubmitFile(@Query('id') submitId: number) {
    return await this.planService.downloadAnySubmitFile(submitId);
  }

  @Post('submit/files') // 下载任意数量的提交文件
  @Role(ROLE.ADMIN)
  async downloadSubmitFiles(
    @Request() request: any,
    @Body() downloadFilesDto: DownloadFilesDto,
  ) {
    return await this.planService.downloadSubmitFiles(
      request.user.id,
      downloadFilesDto,
    );
  }

  @Get('submit/all-file') // 下载计划所有的提交文件
  @Role(ROLE.ADMIN)
  async downloadPlanAllSubmitFile(
    @Request() request: any,
    @Query('id') planId: number,
    @Query('option') option: SubmitSearchOption,
    @Query('value') optionValue: string,
  ) {
    return await this.planService.downloadPlanAllSubmitFile(
      request.user.id,
      planId,
      option,
      optionValue,
    );
  }

  @Post('submit/rename-file') // 重命名提交文件
  @Role(ROLE.ADMIN)
  async renameSubmitFile(@Body() renameFileDto: RenameSubmitFileDto) {
    return await this.planService.renameSubmitFile(renameFileDto);
  }
}
