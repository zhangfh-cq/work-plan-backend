import { AuthService } from '../auth.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { UserEntity } from 'src/entities/user/user.entity';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  /**
   * @description: 本地策略验证方法
   * @param {string} username 用户名
   * @param {string} password 密码
   * @return {*} 用户实体
   */
  async validate(username: string, password: string): Promise<UserEntity> {
    const user: UserEntity = await this.authService.validateUser(
      username,
      password,
    );
    if (user) {
      return user;
    } else {
      throw new BadRequestException('用户名或密码错误');
    }
  }
}
