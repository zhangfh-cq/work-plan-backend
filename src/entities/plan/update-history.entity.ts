import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PlanEntity } from './plan.entity';

@Entity('update_history')
export class UpdateHistoryEntity {
  @PrimaryGeneratedColumn({ comment: '更新记录ID' })
  id: number;

  @Column({ name: 'updater_id', comment: '更新者ID' })
  updaterId: string;

  @Column({ default: null, comment: '更新者' })
  updater: string;

  @Column({ comment: '更新时间' })
  date: Date;

  @Column({ name: 'change_comments', default: null, comment: '更新备注' })
  changeComments: string;

  @ManyToOne(() => PlanEntity, (PlanEntity) => PlanEntity.updateHistory)
  plan: PlanEntity;

  @CreateDateColumn({ name: 'create_date', comment: '创建时间' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', comment: '更新时间' })
  updateDate: Date;
}
