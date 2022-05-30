import { Exclude } from 'class-transformer';
import {
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '用户ID' })
  id: string;

  @Column({
    default: null,
    comment: '头像',
  })
  avatar: string;

  @Column({ unique: true, comment: '用户名称' })
  username: string;

  @Column({ name: 'real_name', comment: '真实姓名' })
  realName: string;

  @Exclude()
  @Column({ comment: '用户密码' })
  password: string;

  @Exclude()
  @Column({ name: 'password_salt', comment: '密码盐' })
  passwordSalt: string;

  @Column({ comment: '性别' })
  gender: string;

  @Column({ comment: '年龄' })
  age: number;

  @Column({ unique: true, name: 'phone_number', comment: '电话号码' })
  phoneNumber: string;

  @Column({ name: 'party_branch', comment: '所在支部' })
  partyBranch: string;

  @Column({ comment: '角色(0-用户|1-管理员|2-超级管理员)' })
  role: number;

  @Column({ comment: '用户状态' })
  status: string;

  @CreateDateColumn({ name: 'create_date', comment: '创建时间' })
  createDate: Date;

  @UpdateDateColumn({ name: 'update_date', comment: '更新时间' })
  updateDate: Date;
}
