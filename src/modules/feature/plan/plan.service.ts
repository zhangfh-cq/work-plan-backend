import archiver, { Archiver } from 'archiver';
import path from 'path';
import { AddPlanDto } from './dto/add.dto';
import { AuditSubmitDto } from './dto/audit.dto';
import { ConfigService } from '@nestjs/config';
import { DeletePlanDto } from './dto/delete.dto';
import { DeleteSubmitDto } from './dto/delete-submit.dto';
import { DownloadFilesDto } from './dto/download-files.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { LockPlanDto } from './dto/lock.dto';
import { mkdir, rename } from 'fs/promises';
import { PLAN_STATUS } from 'src/enums/plan/plan-status.enum';
import { PlanEntity } from 'src/entities/plan/plan.entity';
import { PlanSearchOption } from 'src/types/plan/plan-search-option.type';
import { RenameSubmitFileDto } from './dto/rename-submit.dto';
import { Repository } from 'typeorm';
import { ROLE } from 'src/enums/user/role.enum';
import { SUBMIT_STATUS } from 'src/enums/plan/submit-status.enum';
import { SubmitHistoryEntity } from 'src/entities/plan/submit-history.entity';
import { SubmitSearchOption } from 'src/types/plan/submit-search-option.type';
import { UnlockPlanDto } from './dto/unlock.dto';
import { UpdateHistoryEntity } from 'src/entities/plan/update-history.entity';
import { UpdatePlanDto } from './dto/update.dto';
import { UpdateSearchOption } from 'src/types/plan/update-search-option.type';
import { USER_STATUS } from 'src/enums/user/status.enum';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilService } from 'src/modules/shared/util/util.service';
import {
  statSync,
  existsSync,
  ReadStream,
  WriteStream,
  createReadStream,
  createWriteStream,
} from 'fs';
import {
  Logger,
  Injectable,
  StreamableFile,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class PlanService {
  // 计划材料文件夹
  private readonly PLAN_FOLDER: string = path.resolve(
    this.configService.get<string>('PLAN_FILE_FOLDER'),
  );
  // 提交材料文件夹
  private readonly SUBMIT_FOLDER: string = path.resolve(
    this.configService.get<string>('SUBMIT_FILE_FOLDER'),
  );

  constructor(
    @InjectRepository(PlanEntity)
    private planRepository: Repository<PlanEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(UpdateHistoryEntity)
    private updateHistoryRepository: Repository<UpdateHistoryEntity>,
    @InjectRepository(SubmitHistoryEntity)
    private submitHistoryRepository: Repository<SubmitHistoryEntity>,
    private utilService: UtilService,
    private configService: ConfigService,
  ) {}

  /**
   * @description: 查找用户未提交的计划
   * @param {string} userId 用户ID
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @param {PlanSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @return {*} {count: number, plans: PlanEntity[]}
   */
  async getUserAwaitSubmitPlans(
    userId: string,
    start: number,
    count: number,
    option: PlanSearchOption,
    optionValue: string,
  ): Promise<{ count: number; plans: PlanEntity[] }> {
    if (option && option === 'publisher') {
      option = 'publisherId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 获取全部计划
    const plans: PlanEntity[] = await this.planRepository.find({
      relations: ['submitHistory'],
      where: {
        [option]: optionValue,
      },
      order: {
        limitDate: 'ASC',
      },
    });
    // 遍历计划数组取出未提交计划
    const awaitSubmitPlans: PlanEntity[] = [];
    let isSubmittedPlan = false;
    for (let i = 0; i < plans.length; i++) {
      isSubmittedPlan = false;
      for (const history of plans[i].submitHistory) {
        if (history.submitterId === userId) {
          isSubmittedPlan = true;
          break;
        }
      }
      if (!isSubmittedPlan) {
        // 删除提交历史
        delete plans[i].submitHistory;
        awaitSubmitPlans.push(plans[i]);
      }
    }
    // 获取发布者名称
    for (const plan of awaitSubmitPlans) {
      plan.publisher = await this.utilService.getUsernameById(plan.publisherId);
      this.planRepository.save(plan);
    }
    return {
      count: awaitSubmitPlans.length,
      plans: awaitSubmitPlans.slice(start, start + count),
    };
  }

  /**
   * @description: 获取用户指定提交记录
   * @param {string} userId 用户ID
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @param {PlanSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @param {SUBMIT_STATUS} status 提交状态
   * @return {*} {count: number, submitHistory: SubmitHistoryEntity[]}
   */
  async getUserSubmitHistory(
    userId: string,
    start: number,
    count: number,
    option: PlanSearchOption,
    optionValue: string,
    status: SUBMIT_STATUS,
  ): Promise<{ count: number; submitHistory: SubmitHistoryEntity[] }> {
    if (option && option === 'publisher') {
      option = 'publisherId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 获取指定条件的提交历史数量
    const submitHistoryCount: number = await this.submitHistoryRepository.count(
      {
        relations: ['plan'],
        where: {
          submitterId: userId,
          status: status,
          plan: { [option]: optionValue },
        },
      },
    );
    // 获取指定条件的提交历史
    const submitHistory: SubmitHistoryEntity[] =
      await this.submitHistoryRepository.find({
        relations: ['plan'],
        where: {
          submitterId: userId,
          status: status,
          plan: { [option]: optionValue },
        },
        skip: start,
        take: count,
        order: {
          updateDate: 'DESC',
        },
      });
    // 获取发布者名称
    for (const history of submitHistory) {
      history.plan.publisher = await this.utilService.getUsernameById(
        history.plan.publisherId,
      );
      this.submitHistoryRepository.save(history);
    }
    return { count: submitHistoryCount, submitHistory: submitHistory };
  }

  /**
   * @description: 提交计划文件
   * @param {string} submitterId 提交者ID
   * @param {number} planId 计划ID
   * @param {Express.Multer.File} file 提交的文件
   * @return {*}
   */
  async submitPlanFile(
    submitterId: string,
    planId: number,
    file: Express.Multer.File,
  ): Promise<void> {
    // 查找计划
    const foundPlan: PlanEntity = await this.planRepository.findOne({
      relations: ['submitHistory'],
      where: {
        id: planId,
      },
    });
    if (foundPlan) {
      // 过期检查
      if (Date.now() > Date.parse(foundPlan.limitDate.toISOString())) {
        throw new ForbiddenException('已经超过限制日期，禁止再提交文件');
      }
      // 锁定检查
      if (foundPlan.status === PLAN_STATUS.LOCKED) {
        throw new ForbiddenException('计划已锁定，禁止提交文件');
      }
      // 文件大小检查
      if (file.size / 1024 / 1024 > 100) {
        throw new BadRequestException('提交文件不能大于100MB');
      }
      // 重复提交检查
      const foundSubmitHistory: SubmitHistoryEntity =
        await this.submitHistoryRepository.findOne({
          where: {
            submitterId: submitterId,
            plan: { id: planId },
          },
        });
      if (foundSubmitHistory) {
        // 更新提交
        foundSubmitHistory.file = file.originalname;
        await this.submitHistoryRepository.save(foundSubmitHistory);
      } else {
        // 创建提交记录
        const submitHistory: SubmitHistoryEntity = new SubmitHistoryEntity();
        submitHistory.submitterId = submitterId;
        submitHistory.file = file.originalname;
        // 保存记录
        await this.submitHistoryRepository.save(submitHistory);
        foundPlan.submitHistory.push(submitHistory);
        await this.planRepository.save(foundPlan);
      }
      // 写入文件
      this.utilService.createFolderExclusiveFile(
        path.join(this.SUBMIT_FOLDER, String(planId), submitterId),
        file.originalname,
        file.buffer,
      );
    } else {
      throw new BadRequestException('计划不存在');
    }
  }

  /**
   * @description: 下载计划文件
   * @param {number} planId 计划ID
   * @return {*} StreamableFile
   */
  async downloadPlanFile(planId: number): Promise<StreamableFile> {
    // 查找计划
    const foundPlan: PlanEntity = await this.planRepository.findOne({
      select: ['planFile'],
      where: { id: planId },
    });
    if (foundPlan) {
      const filePath = path.join(
        this.PLAN_FOLDER,
        String(planId),
        foundPlan.planFile,
      );
      if (existsSync(filePath)) {
        // 获取文件读取流
        const planFileStream: ReadStream = createReadStream(filePath);
        // 响应文件
        const streamableFile = new StreamableFile(planFileStream);
        streamableFile.options.length = statSync(filePath).size;
        return streamableFile;
      } else {
        throw new BadRequestException('文件不存在');
      }
    } else {
      throw new BadRequestException('计划不存在');
    }
  }

  /**
   * @description: 下载提交文件
   * @param {number} submitId 提交记录ID
   * @return {*} StreamableFile
   */
  async downloadSubmitFile(
    userId: string,
    submitId: number,
  ): Promise<StreamableFile> {
    // 查找提交记录
    const foundSubmit: SubmitHistoryEntity =
      await this.submitHistoryRepository.findOne({
        relations: ['plan'],
        where: {
          id: submitId,
          submitterId: userId,
        },
      });
    if (foundSubmit) {
      const filePath = path.join(
        this.SUBMIT_FOLDER,
        String(foundSubmit.plan.id),
        userId,
        foundSubmit.file,
      );
      console.log(filePath);
      if (existsSync(filePath)) {
        // 获取文件读取流
        const submitFileSteam: ReadStream = createReadStream(filePath);
        // 响应文件
        const streamableFile = new StreamableFile(submitFileSteam);
        streamableFile.options.length = statSync(filePath).size;
        return streamableFile;
      } else {
        throw new BadRequestException('文件不存在');
      }
    } else {
      throw new BadRequestException('提交记录不存在');
    }
  }

  // *************************************************************
  // *************************** 管理员 ***************************
  // *************************************************************

  /**
   * @description: 添加工作计划
   * @param {string} publisherId 发布者ID
   * @param {AddPlanDto} addPlanDto 数据传输对象
   * @param {Express.Multer.File} file 提交的文件
   * @return {*} void
   */
  async addPlan(
    publisherId: string,
    addPlanDto: AddPlanDto,
    file?: Express.Multer.File,
  ): Promise<void> {
    // 创建计划
    const createdPlan: PlanEntity = await this.planRepository.create({
      title: addPlanDto.title,
      content: addPlanDto.content,
      limitDate: addPlanDto.limitDate,
      planFile: file ? file.originalname : null,
      publisherId: publisherId,
    });
    // 添加计划
    const savedPlan: PlanEntity = await this.planRepository.save(createdPlan);
    if (file) {
      // 写入文件
      this.utilService.createFolderExclusiveFile(
        path.join(this.PLAN_FOLDER, String(savedPlan.id)),
        file.originalname,
        file.buffer,
      );
    }
  }

  /**
   * @description: 获取计划
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @param {PlanSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @return {*} {count: number, plans: PlanEntity[]}
   */
  async getPlanList(
    start: number,
    count: number,
    option?: PlanSearchOption,
    optionValue?: string,
  ): Promise<{
    count: number;
    plans: PlanEntity[];
  }> {
    if (option && option === 'publisher') {
      option = 'publisherId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 获取指定条件的计划数量
    const planCount: number = await this.planRepository.count({
      where: { [option]: optionValue },
    });
    // 获取指定条件的计划
    const plans: PlanEntity[] = await this.planRepository.find({
      where: { [option]: optionValue },
      skip: start,
      take: count,
      order: {
        limitDate: 'ASC',
      },
    });
    // 获取发布者名称
    for (const plan of plans) {
      plan.publisher = await this.utilService.getUsernameById(plan.publisherId);
      this.planRepository.save(plan);
    }
    return { count: planCount, plans: plans };
  }

  /**
   * @description: 更新计划
   * @param {string} updaterId 更新者ID
   * @param {UpdatePlanDto} updatePlanDto 数据传输对象
   * @param {Express.Multer.File} file 更新的文件
   * @return {*} void
   */
  async updatePlan(
    updaterId: string,
    updatePlanDto: UpdatePlanDto,
    file?: Express.Multer.File,
  ): Promise<void> {
    // 查找计划
    const foundPlan: PlanEntity = await this.planRepository.findOne({
      where: { id: updatePlanDto.id },
      relations: ['updateHistory'],
    });
    if (foundPlan) {
      // 检查锁定
      if (foundPlan.status === PLAN_STATUS.LOCKED) {
        throw new ForbiddenException('此计划已被锁定，禁止更改');
      }
      // 更新计划
      delete updatePlanDto.id;
      for (const key in updatePlanDto) {
        if (updatePlanDto[key] !== undefined) {
          foundPlan[key] = updatePlanDto[key];
        }
      }
      if (file) {
        foundPlan.planFile = file.originalname;
      }
      // 添加更新记录
      const updateHistory: UpdateHistoryEntity = new UpdateHistoryEntity();
      updateHistory.updaterId = updaterId;
      updateHistory.date = new Date();
      updateHistory.changeComments = updatePlanDto.changeComments;
      // 保存更新
      await this.updateHistoryRepository.save(updateHistory);
      foundPlan.updateHistory.push(updateHistory);
      await this.planRepository.save(foundPlan);
      if (file) {
        // 更新文件
        this.utilService.createFolderExclusiveFile(
          path.join(this.PLAN_FOLDER, String(foundPlan.id)),
          file.originalname,
          file.buffer,
        );
      }
    } else {
      throw new BadRequestException('计划不存在');
    }
  }

  /**
   * @description: 删除计划
   * @param {DeletePlanDto} deletePlanDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async deletePlans(deletePlanDto: DeletePlanDto): Promise<void> {
    const ids = { planIds: [], submitIds: [], updateIds: [] };
    const errors: Array<{ id: number; msg: string }> = [];
    for (const planId of deletePlanDto.ids) {
      // 查找计划
      const foundPlan: PlanEntity = await this.planRepository.findOne({
        relations: ['submitHistory', 'updateHistory'],
        where: { id: planId },
      });
      if (foundPlan) {
        // 锁定检查
        if (foundPlan.status === PLAN_STATUS.LOCKED) {
          errors.push({ id: planId, msg: '计划已被锁定，禁止操作' });
        } else {
          for (const submitHistory of foundPlan.submitHistory) {
            ids.submitIds.push(submitHistory.id);
          }
          for (const updateHistory of foundPlan.updateHistory) {
            ids.updateIds.push(updateHistory.id);
          }
          ids.planIds.push(planId);
        }
      } else {
        errors.push({ id: planId, msg: '计划不存在' });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 删除计划
      if (ids.submitIds.length !== 0) {
        await this.submitHistoryRepository.delete(ids.submitIds);
      }
      if (ids.updateIds.length !== 0) {
        await this.updateHistoryRepository.delete(ids.updateIds);
      }
      await this.planRepository.delete(ids.planIds);
      // 删除文件
      for (const planId of ids.planIds) {
        await this.utilService.rmFolder(
          path.join(this.PLAN_FOLDER, String(planId)),
        );
      }
    }
  }

  /**
   * @description: 锁定计划
   * @param {LockPlanDto} lockPlanDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async lockPlans(lockPlanDto: LockPlanDto): Promise<void> {
    const lockedPlans: PlanEntity[] = [];
    const errors: Array<{ id: number; msg: string }> = [];
    for (const planId of lockPlanDto.ids) {
      // 查找计划
      const foundPlan: PlanEntity = await this.planRepository.findOne({
        where: { id: planId },
      });
      if (foundPlan) {
        lockedPlans.push(foundPlan);
      } else {
        errors.push({ id: planId, msg: '计划不存在' });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 锁定计划
      for (const lockedPlan of lockedPlans) {
        lockedPlan.status = PLAN_STATUS.LOCKED;
        await this.planRepository.save(lockedPlan);
      }
    }
  }

  /**
   * @description: 解锁计划
   * @param {UnlockPlanDto} unlockPlanDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async unlockPlans(unlockPlanDto: UnlockPlanDto): Promise<void> {
    const unlockPlans: PlanEntity[] = [];
    const errors: Array<{ id: number; msg: string }> = [];
    for (const planId of unlockPlanDto.ids) {
      // 查找计划
      const foundPlan: PlanEntity = await this.planRepository.findOne({
        where: { id: planId },
      });
      if (foundPlan) {
        unlockPlans.push(foundPlan);
      } else {
        errors.push({ id: planId, msg: '计划不存在' });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 解锁计划
      for (const unlockPlan of unlockPlans) {
        unlockPlan.status = PLAN_STATUS.NORMAL;
        await this.planRepository.save(unlockPlan);
      }
    }
  }

  /**
   * @description: 获取提交记录
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @param {SubmitSearchOption} submitOption 提交历史条件
   * @param {string} submitValue 提交历史条件值
   * @param {SubmitSearchOption} submitExtra 提交历史额外条件
   * @param {string} extraValue 提交历史条件额外值
   * @param {PlanSearchOption} planOption 计划条件
   * @param {string} submitValue 计划条件值
   * @return {*} {count: number, submitHistory: SubmitHistoryEntity[]}
   */
  async getSubmitHistory(
    start: number,
    count: number,
    submitOption?: SubmitSearchOption,
    submitValue?: string,
    submitExtra?: SubmitSearchOption,
    extraValue?: string,
    planOption?: PlanSearchOption,
    planValue?: string,
  ): Promise<{ count: number; submitHistory: SubmitHistoryEntity[] }> {
    // 用户参数解析
    if (
      submitOption &&
      (submitOption === 'submitter' || submitOption === 'approver')
    ) {
      submitOption =
        submitOption === 'submitter' ? 'submitterId' : 'approverId';
      submitValue = await this.utilService.getIdByUsername(submitOption);
    }
    // 获取指定条件的提交记录数量
    const historyCount: number = await this.submitHistoryRepository.count({
      relations: ['plan'],
      where: {
        [submitOption]: submitValue,
        [submitExtra]: extraValue,
        plan: { [planOption]: planValue },
      },
    });
    // 获取指定条件的提交记录
    const submitHistory: SubmitHistoryEntity[] =
      await this.submitHistoryRepository.find({
        relations: ['plan'],
        where: {
          [submitOption]: submitValue,
          [submitExtra]: extraValue,
          plan: { [planOption]: planValue },
        },
        skip: start,
        take: count,
        order: {
          createDate: 'DESC',
        },
      });
    // 获取提交者和计划发布者名称
    for (const history of submitHistory) {
      history.submitter = await this.utilService.getUsernameById(
        history.submitterId,
      );
      history.approver = await this.utilService.getUsernameById(
        history.approverId,
      );
      history.plan.publisher = await this.utilService.getUsernameById(
        history.plan.publisherId,
      );
      this.submitHistoryRepository.save(history);
    }
    return { count: historyCount, submitHistory: submitHistory };
  }

  /**
   * @description: 审核提交记录
   * @param {AuditSubmitDto} auditSubmitDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async auditSubmit(
    approverId: string,
    auditSubmitDto: AuditSubmitDto,
  ): Promise<void> {
    const auditSubmitList: SubmitHistoryEntity[] = [];
    const errors: Array<{ id: number; msg: string }> = [];
    for (const auditId of auditSubmitDto.ids) {
      // 查找提交记录
      const foundSubmitHistory: SubmitHistoryEntity =
        await this.submitHistoryRepository.findOne({
          where: { id: auditId },
        });
      // 重复审核检查
      if (foundSubmitHistory) {
        if (foundSubmitHistory.status !== SUBMIT_STATUS.AWAIT_AUDIT) {
          errors.push({ id: auditId, msg: '提交记录已审核，请勿重复审核' });
        }
        auditSubmitList.push(foundSubmitHistory);
      } else {
        errors.push({ id: auditId, msg: '提交记录不存在' });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 更改记录
      for (const auditSubmit of auditSubmitList) {
        auditSubmit.status = auditSubmitDto.status;
        auditSubmit.approverId = approverId;
        await this.submitHistoryRepository.save(auditSubmit);
      }
    }
  }

  /**
   * @description: 删除提交记录
   * @param {DeleteSubmitDto} deleteSubmitDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async deleteSubmitHistory(deleteSubmitDto: DeleteSubmitDto): Promise<void> {
    const deleteSubmitList: SubmitHistoryEntity[] = [];
    const errors: Array<{ id: number; msg: string }> = [];
    for (const submitId of deleteSubmitDto.ids) {
      // 查找提交记录
      const foundSubmitHistory: SubmitHistoryEntity =
        await this.submitHistoryRepository.findOne({
          relations: ['plan'],
          where: { id: submitId },
        });
      if (foundSubmitHistory) {
        deleteSubmitList.push(foundSubmitHistory);
      } else {
        errors.push({ id: submitId, msg: '计划不存在' });
      }
    }
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      for (const deleteSubmit of deleteSubmitList) {
        // 删除提交
        await this.submitHistoryRepository.delete({ id: deleteSubmit.id });
        // 删除文件
        await this.utilService.rmFolder(
          path.join(
            this.SUBMIT_FOLDER,
            String(deleteSubmit.plan.id),
            deleteSubmit.submitterId,
          ),
        );
      }
    }
  }

  /**
   * @description: 获取计划更新历史
   * @param {number} planId 计划ID
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @param {UpdateSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @return {*} { count: number; updateHistory: UpdateHistoryEntity[] }
   */
  async getPlanUpdateHistory(
    planId: number,
    start: number,
    count: number,
    option?: UpdateSearchOption,
    optionValue?: string,
  ): Promise<{ count: number; updateHistory: UpdateHistoryEntity[] }> {
    if (option && option === 'updater') {
      option = 'updaterId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 查找符合条件的更新记录数量
    const updateHistoryCount: number = await this.updateHistoryRepository.count(
      {
        relations: ['plan'],
        where: {
          [option]: optionValue,
          plan: {
            id: planId,
          },
        },
      },
    );
    // 查找符合条件的更新记录
    const foundUpdateHistory: UpdateHistoryEntity[] =
      await this.updateHistoryRepository.find({
        relations: ['plan'],
        where: {
          [option]: optionValue,
          plan: {
            id: planId,
          },
        },
        skip: start,
        take: count,
        order: {
          createDate: 'DESC',
        },
      });
    // 获取更新者名称
    for (const history of foundUpdateHistory) {
      history.updater = await this.utilService.getUsernameById(
        history.updaterId,
      );
      this.updateHistoryRepository.save(history);
    }
    // 删除响应中的plan
    for (const history of foundUpdateHistory) {
      delete history.plan;
    }
    return { count: updateHistoryCount, updateHistory: foundUpdateHistory };
  }

  /**
   * @description: 获取计划完成情况
   * @param {number} planId 计划ID
   * @param {boolean} complete 已完成/未完成情况
   * @param {number} start 拉取起始位置
   * @param {number} count 拉取数量
   * @return {*} { count: number; users: UserEntity[] }
   */
  async getPlanCompleteStatus(
    planId: number,
    complete: boolean,
    start: number,
    count: number,
  ): Promise<{ count: number; users: UserEntity[] }> {
    // 查找所有正常用户
    const users: UserEntity[] = await this.userRepository.find({
      where: {
        status: USER_STATUS.NORMAL,
        role: ROLE.USER,
      },
    });
    // 查找计划已完成的提交
    const completedSubmit: SubmitHistoryEntity[] =
      await this.submitHistoryRepository.find({
        relations: ['plan'],
        where: {
          status: SUBMIT_STATUS.APPROVED,
          plan: { id: planId },
        },
      });
    // 计算已完成和未完成用户
    const completedUser: UserEntity[] = [];
    const incompleteUser: UserEntity[] = [];
    let isCompleteUser: boolean;
    for (const user of users) {
      isCompleteUser = false;
      for (const submitHistory of completedSubmit) {
        if (user.id === submitHistory.submitterId) {
          isCompleteUser = true;
          completedUser.push(user);
          break;
        }
      }
      if (!isCompleteUser) {
        incompleteUser.push(user);
      }
    }
    // 返回数据
    if (complete) {
      return {
        count: completedUser.length,
        users: completedUser.slice(start, start + count),
      };
    } else {
      return {
        count: incompleteUser.length,
        users: incompleteUser.slice(start, start + count),
      };
    }
  }

  /**
   * @description: 下载任意提交文件
   * @param {number} submitId 提交记录ID
   * @return {*} StreamableFile
   */
  async downloadAnySubmitFile(submitId: number): Promise<StreamableFile> {
    // 查找提交记录
    const foundSubmit: SubmitHistoryEntity =
      await this.submitHistoryRepository.findOne({
        relations: ['plan'],
        where: {
          id: submitId,
        },
      });
    if (foundSubmit) {
      const filePath = path.join(
        this.SUBMIT_FOLDER,
        String(foundSubmit.plan.id),
        foundSubmit.submitterId,
        foundSubmit.file,
      );
      if (existsSync(filePath)) {
        // 获取文件读取流
        const submitFileSteam: ReadStream = createReadStream(filePath);
        // 响应文件
        const streamableFile = new StreamableFile(submitFileSteam);
        streamableFile.options.length = statSync(filePath).size;
        return streamableFile;
      } else {
        throw new BadRequestException('文件不存在');
      }
    } else {
      throw new BadRequestException('提交记录不存在');
    }
  }

  /**
   * @description: 下载任意数量的提交文件
   * @param {string} userId 用户ID
   * @param {DownloadFilesDto} downloadFilesDto 数据传输对象
   * @return {*} StreamableFile
   */
  async downloadSubmitFiles(
    userId: string,
    downloadFilesDto: DownloadFilesDto,
  ): Promise<StreamableFile> {
    // 创建写入流
    const filesFolder = path.join(
      this.SUBMIT_FOLDER,
      userId,
      String(Date.now()),
    );

    await mkdir(filesFolder, { recursive: true });
    const zipWriteStream: WriteStream = createWriteStream(
      `${filesFolder}/files.zip`,
    );
    // archiver实例化并建立管道连接
    const archive: Archiver = archiver('zip');
    archive.pipe(zipWriteStream);
    // 查找提交记录
    for (const id of downloadFilesDto.ids) {
      const foundSubmit: SubmitHistoryEntity =
        await this.submitHistoryRepository.findOne({
          relations: ['plan'],
          where: {
            id: id,
          },
        });
      if (foundSubmit) {
        // 添加压缩文件
        archive.append(
          createReadStream(
            path.join(
              this.SUBMIT_FOLDER,
              String(foundSubmit.plan.id),
              foundSubmit.submitterId,
              foundSubmit.file,
            ),
          ),
          { name: `${foundSubmit.file}` },
        );
      } else {
        throw new BadRequestException('计划不存在');
      }
    }
    // 压缩文件
    await archive.finalize();
    // 返回文件
    const streamableFile = new StreamableFile(
      createReadStream(`${filesFolder}/files.zip`),
    );
    streamableFile.options.length = statSync(`${filesFolder}/files.zip`).size;
    return streamableFile;
  }

  /**
   * @description: 下载计划所有的提交文件
   * @param {number} planId 计划ID
   * @param {SubmitSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @return {*} StreamableFile
   */
  async downloadPlanAllSubmitFile(
    userId: string,
    planId: number,
    option?: SubmitSearchOption,
    optionValue?: string,
  ): Promise<StreamableFile> {
    // 参数解析
    if (option && (option === 'submitter' || option === 'approver')) {
      option = option === 'submitter' ? 'submitterId' : 'approverId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 查找计划所有提交
    const foundPlanAllSubmit: SubmitHistoryEntity[] =
      await this.submitHistoryRepository.find({
        relations: ['plan'],
        where: {
          [option]: optionValue,
          plan: { id: planId },
        },
      });
    if (foundPlanAllSubmit.length > 0) {
      // 创建写入流
      const filesFolder = path.join(
        this.SUBMIT_FOLDER,
        userId,
        String(Date.now()),
      );
      await mkdir(filesFolder, { recursive: true });
      const zipWriteStream: WriteStream = createWriteStream(
        `${filesFolder}/files.zip`,
      );
      // archiver实例化并建立管道连接
      const archive: Archiver = archiver('zip');
      archive.pipe(zipWriteStream);
      // 添加压缩文件
      for (const submit of foundPlanAllSubmit) {
        archive.append(
          createReadStream(
            path.join(
              this.SUBMIT_FOLDER,
              String(planId),
              submit.submitterId,
              submit.file,
            ),
          ),
          { name: `${submit.file}` },
        );
      }
      // 完成压缩
      await archive.finalize();
      // 返回文件
      const streamableFile = new StreamableFile(
        createReadStream(`${filesFolder}/files.zip`),
      );
      streamableFile.options.length = statSync(`${filesFolder}/files.zip`).size;
      return streamableFile;
    } else {
      throw new BadRequestException('此计划无提交记录');
    }
  }

  /**
   * @description: 重命名提交文件
   * @param {RenameSubmitFileDto} renameFileDto 数据传输对象
   * @return {*} void
   */
  async renameSubmitFile(renameFileDto: RenameSubmitFileDto): Promise<void> {
    // 查找提交记录
    const foundSubmit: SubmitHistoryEntity =
      await this.submitHistoryRepository.findOne({
        relations: ['plan'],
        where: {
          id: renameFileDto.id,
        },
      });
    if (foundSubmit) {
      // 更新文件名
      const oldName = path.join(
        this.SUBMIT_FOLDER,
        String(foundSubmit.plan.id),
        foundSubmit.submitterId,
        foundSubmit.file,
      );
      const newName = path.join(
        this.SUBMIT_FOLDER,
        String(foundSubmit.plan.id),
        foundSubmit.submitterId,
        renameFileDto.newName,
      );
      if (existsSync(oldName)) {
        await rename(oldName, newName);
      } else {
        throw new BadRequestException('文件不存在');
      }
      // 更新记录文件名
      await this.submitHistoryRepository.update(
        { id: renameFileDto.id },
        { file: renameFileDto.newName },
      );
    } else {
      throw new BadRequestException('提交记录不存在');
    }
  }

  /**
   * @description: 定时任务：检查计划过期
   */
  @Interval(60 * 1000)
  async checkPlanLimitDate() {
    // 查找所有计划
    const plans: PlanEntity[] = await this.planRepository.find();
    // 遍历计划检查是否过期
    for (const plan of plans) {
      const isExpired = Date.now() > Date.parse(plan.limitDate.toISOString());
      if (isExpired) {
        // 过期则更改状态
        plan.status = PLAN_STATUS.EXPIRED;
      } else if (!isExpired && plan.status === PLAN_STATUS.EXPIRED) {
        // 更改了过期时间，状态改为正常
        plan.status = PLAN_STATUS.NORMAL;
      }
      // 保存更改
      await this.planRepository.save(plan);
    }
    Logger.log('[ScheduledTask] Scheduled expiration check completed.');
  }
}
