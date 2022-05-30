import { PlanEntity } from './plan.entity';
import { SUBMIT_STATUS } from 'src/enums/plan/submit-status.enum';
import {
  Column,
  Entity,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('submit_history')
export class SubmitHistoryEntity {
  @PrimaryGeneratedColumn({ comment: '提交记录ID' })
  id: number;

  @Column({ name: 'submitter_id', comment: '提交者ID' })
  submitterId: string;

  @Column({ default: '', comment: '提交者' })
  submitter: string;

  @Column({ comment: '提交文件' })
  file: string;

  @Column({ default: SUBMIT_STATUS.AWAIT_AUDIT, comment: '状态' })
  status: SUBMIT_STATUS;

  @Column({ name: 'approver_id', default: null, comment: '审核人ID' })
  approverId: string;

  @Column({ default: null, comment: '审核人' })
  approver: string;

  @CreateDateColumn({ name: 'create_date', comment: '创建时间' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', comment: '更新时间' })
  updateDate: Date;

  @ManyToOne(() => PlanEntity, (PlanEntity) => PlanEntity.submitHistory)
  plan: PlanEntity;
}
