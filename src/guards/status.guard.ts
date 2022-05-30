import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { USER_STATUS } from '../enums/user/status.enum';
import { UserEntity } from '../entities/user/user.entity';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class StatusGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 从TOKEN中获取UserID
    const token: string = context
      .switchToHttp()
      .getRequest<Request>()
      .get('Authorization')
      ?.replace('Bearer', '')
      .trim();
    const userId: string = token ? this.jwtService.decode(token).sub : null;
    if (userId === null) {
      return true;
    }

    // 查询角色状态
    const userStatus: string = (
      await this.userRepository.findOne({
        select: ['status'],
        where: { id: userId },
      })
    )?.status;
    if (userStatus === undefined) {
      throw new BadRequestException('用户不存在');
    }

    // 比对状态
    if (userStatus === USER_STATUS.NORMAL) {
      return true;
    } else {
      throw new ForbiddenException(`用户状态${userStatus}，禁止此操作`);
    }
  }
}
