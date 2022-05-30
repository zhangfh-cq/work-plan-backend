import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user/user.entity';
import { UtilService } from '../../shared/util/util.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private utilService: UtilService,
  ) {}

  /**
   * @description: 验证用户登录具体实现
   * @param {string} username 用户名
   * @param {string} password 密码
   * @return {*} 用户实体
   */
  async validateUser(username: string, password: string): Promise<UserEntity> {
    // 查找用户
    const foundUser: UserEntity = await this.userRepository.findOne({
      select: ['id', 'username', 'password', 'passwordSalt'],
      where: { username: username },
    });
    if (foundUser) {
      // 比对密码
      if (
        this.utilService.encryptedData(password + foundUser.passwordSalt) ===
        foundUser.password
      ) {
        delete foundUser.password;
        delete foundUser.passwordSalt;
        return foundUser;
      } else {
        return null;
      }
    } else {
      throw new BadRequestException('用户不存在');
    }
  }
}
