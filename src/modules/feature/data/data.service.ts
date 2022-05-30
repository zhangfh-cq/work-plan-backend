import { Between, Repository } from 'typeorm';
import { GENDER } from 'src/enums/user/gender.enum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PlanEntity } from 'src/entities/plan/plan.entity';
import { ROLE } from 'src/enums/user/role.enum';
import { SUBMIT_STATUS } from 'src/enums/plan/submit-status.enum';
import { SubmitHistoryEntity } from 'src/entities/plan/submit-history.entity';
import { USER_STATUS } from 'src/enums/user/status.enum';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilService } from 'src/modules/shared/util/util.service';

@Injectable()
export class DataService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(PlanEntity)
    private planRepository: Repository<PlanEntity>,
    @InjectRepository(SubmitHistoryEntity)
    private submitHistoryRepository: Repository<SubmitHistoryEntity>,
    private utilService: UtilService,
  ) {}

  /**
   * @description: 获取计划完成数量情况
   * @param {number} planId 计划ID
   * @return {*}  {completed: number,incomplete: number}
   */
  async getPlanCompleteData(
    planId: number,
  ): Promise<{ completed: number; incomplete: number }> {
    const foundPlan: PlanEntity = await this.planRepository.findOne({
      where: { id: planId },
    });
    if (foundPlan) {
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
      return {
        completed: completedUser.length,
        incomplete: incompleteUser.length,
      };
    } else {
      throw new BadRequestException('计划不存在');
    }
  }

  /**
   * @description: 计划提交通过退回数
   * @param {number} planId 计划ID
   * @return {*} { approveCount, awaitAuditCount, unapprovedCount }
   */
  async getPlanAuditData(planId: number): Promise<{
    approveCount: number;
    awaitAuditCount: number;
    unapprovedCount: number;
  }> {
    const foundPlan: PlanEntity = await this.planRepository.findOne({
      where: { id: planId },
    });
    if (foundPlan) {
      // 已通过数
      const approveCount: number = await this.submitHistoryRepository.count({
        relations: ['plan'],
        where: {
          status: SUBMIT_STATUS.APPROVED,
          plan: {
            id: planId,
          },
        },
      });
      // 待审核数
      const awaitAuditCount: number = await this.submitHistoryRepository.count({
        relations: ['plan'],
        where: {
          status: SUBMIT_STATUS.AWAIT_AUDIT,
          plan: {
            id: planId,
          },
        },
      });
      // 未通过数
      const unapprovedCount: number = await this.submitHistoryRepository.count({
        relations: ['plan'],
        where: {
          status: SUBMIT_STATUS.UNAPPROVED,
          plan: {
            id: planId,
          },
        },
      });
      // 返回数据
      return { approveCount, awaitAuditCount, unapprovedCount };
    } else {
      throw new BadRequestException('计划不存在');
    }
  }

  /**
   * @description: 日期提交的计划数量
   * @param {number} planId 计划ID
   * @param {Date} startDate 查找开始日期
   * @param {Date} endDate 查找结束日期
   * @return {*} 每个日期对应的计划提交数量
   */
  async getPlanSubmitDateData(
    planId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<object> {
    // 获取符合条件的提交
    const foundSubmitHistory: SubmitHistoryEntity[] =
      await this.submitHistoryRepository.find({
        relations: ['plan'],
        where: {
          createDate: Between(startDate, endDate),
          plan: {
            id: planId,
          },
        },
      });
    // 提取日期数据
    const dateData: object = {};
    for (const submit of foundSubmitHistory) {
      const dateKey: string = this.getFormatDate(submit.createDate);
      if (dateData[dateKey]) {
        dateData[dateKey] += 1;
      } else {
        dateData[dateKey] = 1;
      }
    }
    // 响应
    return dateData;
  }

  /**
   * @description: 获取管理员发布的计划数量数据
   * @return {*} 每个管理员发布的计划数量
   */
  async getPlanPublisherData(): Promise<object> {
    // 获取所有计划
    const plans: PlanEntity[] = await this.planRepository.find();
    // 遍历计算数量
    const data: object = {};
    for (const plan of plans) {
      if (data[plan.publisherId]) {
        data[plan.publisherId].count += 1;
      } else {
        data[plan.publisherId] = { count: 1 };
      }
    }
    // 增加用户名
    for (const key in data) {
      data[key].name = await this.utilService.getUsernameById(key);
    }
    // 返回数据
    return data;
  }

  /**
   * @description: 获取用户性别数量数据
   * @return {*} 用户性别数据
   */
  async getUserGenderData(): Promise<{ man: number; woman: number }> {
    // 获取男性用户数量
    const manCount: number = await this.userRepository.count({
      where: { gender: GENDER.MAN },
    });
    // 获取女性用户数量
    const womanCount: number = await this.userRepository.count({
      where: { gender: GENDER.WOMAN },
    });
    // 返回数据
    return { man: manCount, woman: womanCount };
  }

  /**
   * @description: 获取用户年龄数据
   * @return {*} 用户年龄数据
   */
  async getUserAgeData(): Promise<object> {
    // 获取所有正常用户
    const users: UserEntity[] = await this.userRepository.find({
      where: {
        status: USER_STATUS.NORMAL,
        role: ROLE.USER,
      },
    });
    // 提取数据
    const data: object = {};
    for (const user of users) {
      if (data[user.age]) {
        data[user.age] += 1;
      } else {
        data[user.age] = 1;
      }
    }
    // 返回数据
    return data;
  }

  /**
   * @description: 获取格式化后的时间
   * @param {Date} date Date对象
   * @return {*} 格式化后的时间
   */
  getFormatDate(date: Date): string {
    const year: number = date.getFullYear();
    const month: number = date.getMonth() + 1;
    const day: number = date.getDate();
    return `${year}/${month}/${day}`;
  }
}
