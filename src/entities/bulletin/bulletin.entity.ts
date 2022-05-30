import {
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('bulletin')
export class BulletinEntity {
  @PrimaryGeneratedColumn({ comment: '公告ID' })
  id: number;

  @Column({ comment: '公告标题' })
  title: string;

  @Column({ length: 1100, comment: '公告内容' })
  content: string;

  @Column({ name: 'publish_id', comment: '发布人ID' })
  publisherId: string;

  @Column({ default: null, comment: '发布人' })
  publisher: string;

  @CreateDateColumn({ name: 'create_date', comment: '创建时间' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', comment: '更新时间' })
  updateDate: Date;
}
