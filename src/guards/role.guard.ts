import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { ROLE } from 'src/enums/user/role.enum';
import { UserEntity } from 'src/entities/user/user.entity';
import {
  CanActivate,
  Injectable,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取Meta数据
    const requiredRole: ROLE = this.reflector.getAllAndOverride<ROLE>('Role', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRole === undefined) {
      return true;
    }

    // 从TOKEN中获取UserID
    const token: string = context
      .switchToHttp()
      .getRequest<Request>()
      .get('Authorization')
      ?.replace('Bearer', '')
      .trim();
    if (token === undefined) {
      throw new BadRequestException('请求TOKEN不存在');
    }
    const userId: string = this.jwtService.decode(token).sub;

    // 获取用户角色
    const userRole: ROLE = (
      await this.userRepository.findOne({
        select: ['role'],
        where: { id: userId },
      })
    )?.role;
    if (userRole === undefined) {
      throw new BadRequestException('用户不存在');
    }

    // 判断角色Level
    if (userRole >= requiredRole) {
      return true;
    } else {
      throw new ForbiddenException('用户无权进行此操作');
    }
  }
}
