import { PLAN_STATUS } from '../../enums/plan/plan-status.enum';
import { SubmitHistoryEntity } from './submit-history.entity';
import { UpdateHistoryEntity } from './update-history.entity';
import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('plan')
export class PlanEntity {
  @PrimaryGeneratedColumn({ comment: '计划ID' })
  id: number;

  @Column({ comment: '计划标题' })
  title: string;

  @Column({ length: 1100, comment: '计划内容' })
  content: string;

  @Column({ name: 'plan_file', default: null, comment: '计划文件' })
  planFile: string;

  @Column({ name: 'limit_date', comment: '时间限制' })
  limitDate: Date;

  @Column({ name: 'publisher_id', comment: '发布者ID' })
  publisherId: string;

  @Column({ default: null, comment: '发布者' })
  publisher: string;

  @Column({ default: PLAN_STATUS.NORMAL, comment: '计划状态' })
  status: PLAN_STATUS;

  @CreateDateColumn({ name: 'create_date', comment: '创建时间' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', comment: '更新时间' })
  updateDate: Date;

  @OneToMany(
    () => UpdateHistoryEntity,
    (UpdateHistoryEntity) => UpdateHistoryEntity.plan,
  )
  updateHistory: UpdateHistoryEntity[];

  @OneToMany(
    () => SubmitHistoryEntity,
    (SubmitHistoryEntity) => SubmitHistoryEntity.plan,
  )
  submitHistory: SubmitHistoryEntity[];
}
