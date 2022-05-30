import { AuditUserDto } from './dto/audit.dto';
import { BadRequestException, OnApplicationBootstrap } from '@nestjs/common';
import { BlockedOperateDto } from './dto/blocked.dto';
import { ConfigService } from '@nestjs/config';
import { DeleteUserDto } from './dto/delete.dto';
import { GENDER } from 'src/enums/user/gender.enum';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { LogoffDto } from './dto/logoff.dto';
import { Not, Repository } from 'typeorm';
import { ROLE } from 'src/enums/user/role.enum';
import { SignupDto } from './dto/signup.dto';
import { UpdateAnyUserDto } from './dto/update-any.dto';
import { UpdateDto } from './dto/update.dto';
import { UpdateUserRoleDto } from './dto/update-role.dto';
import { USER_STATUS } from 'src/enums/user/status.enum';
import { UserEntity } from 'src/entities/user/user.entity';
import { UserSearchOption } from 'src/types/user/search-option.type';
import { UtilService } from 'src/modules/shared/util/util.service';

@Injectable()
export class UserService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private utilService: UtilService,
  ) {}

  /**
   * @description: 用户注册
   * @param {SignupDto} signupDto 用户注册数据传输对象
   * @return {*} void
   */
  async signup(signupDto: SignupDto): Promise<void> {
    if (await this.userRepository.findOneBy({ username: signupDto.username })) {
      //检查用户名重复
      throw new BadRequestException('用户名已存在');
    } else if (
      await this.userRepository.findOneBy({
        phoneNumber: signupDto.phoneNumber,
      })
    ) {
      // 检查电话号码重复
      throw new BadRequestException('电话号码已存在');
    } else {
      // 获取密码盐
      const passwordSalt: string = this.utilService.getSalt();
      // 创建用户
      const signupUser: UserEntity = await this.userRepository.create({
        username: signupDto.username,
        realName: signupDto.realName,
        password: this.utilService.encryptedData(
          signupDto.password + passwordSalt,
        ),
        passwordSalt: passwordSalt,
        gender: signupDto.gender,
        age: signupDto.age,
        phoneNumber: signupDto.phoneNumber,
        partyBranch: signupDto.partyBranch,
        role: ROLE.USER,
        status: USER_STATUS.AWAIT_SIGNUP_AUDIT,
      });
      // 保存创建的用户
      await this.userRepository.save(signupUser);
    }
  }

  /**
   * @description: 登录签发TOKEN
   * @param {UserEntity} loginUser 登录的用户名&ID
   * @return {*} 包含签发TOKEN的对象
   */
  async login(username: string, userId: string): Promise<object> {
    return {
      token: await this.jwtService.signAsync({
        username: username,
        sub: userId,
      }),
    };
  }

  /**
   * @description: 获取登录用户信息
   * @param {string} userId 登录用户ID
   * @return {*} 登录用户实体
   */
  async getInfo(userId: string): Promise<UserEntity> {
    const foundUser: UserEntity = await this.userRepository.findOneBy({
      id: userId,
    });
    if (foundUser) {
      return foundUser;
    } else {
      throw new BadRequestException('用户不存在');
    }
  }

  /**
   * @description: 更新登录用户信息
   * @param {*} userId 登录用户ID
   * @param {UpdateDto} updateDto 更新信息传输对象
   * @return {*} void
   */
  async updateInfo(userId, updateDto: UpdateDto): Promise<void> {
    if (
      await this.userRepository.findOneBy({
        id: Not(userId),
        username: updateDto.username,
      })
    ) {
      //检查用户名重复
      throw new BadRequestException('用户名已存在');
    } else if (
      await this.userRepository.findOneBy({
        id: Not(userId),
        phoneNumber: updateDto.phoneNumber,
      })
    ) {
      // 检查电话号码重复
      throw new BadRequestException('电话号码已存在');
    } else {
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: userId,
      });
      if (foundUser) {
        if (updateDto.password) {
          updateDto.password = this.utilService.encryptedData(
            updateDto.password + foundUser.passwordSalt,
          );
        }
        // 遍历更改用户实体属性
        for (const key in updateDto) {
          if (foundUser[key] !== undefined) {
            foundUser[key] = updateDto[key];
          }
        }
        // 保存更改
        await this.userRepository.save(foundUser);
      } else {
        throw new BadRequestException('用户不存在');
      }
    }
  }

  /**
   * @description: 登录用户注销
   * @param {string} userId 登录用户ID
   * @param {LogoffDto} logoffDto 注销数据传输对象
   * @return {*} void
   */
  async logoff(userId: string, logoffDto: LogoffDto): Promise<void> {
    const foundUser: UserEntity = await this.userRepository.findOneBy({
      id: userId,
      role: ROLE.ADMIN,
    });
    if (foundUser) {
      // 哈希运算密码
      logoffDto.password = this.utilService.encryptedData(
        logoffDto.password + foundUser.passwordSalt,
      );
      // 比对密码
      if (logoffDto.password === foundUser.password) {
        // 更改用户状态
        foundUser.status = USER_STATUS.AWAIT_LOGOFF_AUDIT;
        await this.userRepository.save(foundUser);
      } else {
        throw new BadRequestException('密码不正确');
      }
    } else {
      throw new BadRequestException('用户不存在');
    }
  }

  // *************************************************************
  // *************************** 管理员 ***************************
  // *************************************************************
  /**
   * @description: 获取用户列表
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @param {option} option? 查询选项
   * @param {optionValue} optionValue? 选项值
   * @return {*} 数量和用户列表
   */
  async getUserList(
    start: number,
    count: number,
    option?: UserSearchOption,
    optionValue?: string,
    status = USER_STATUS.NORMAL,
  ): Promise<{ count: number; users: UserEntity[] }> {
    // 获取符合条件的用户数量
    const userCount: number = await this.userRepository.countBy({
      role: ROLE.USER,
      [option]: optionValue,
      status: status,
    });
    // 获取指定的用户信息
    const users: UserEntity[] = await this.userRepository.find({
      select: [
        'id',
        'username',
        'realName',
        'gender',
        'age',
        'phoneNumber',
        'partyBranch',
        'role',
        'status',
        'createDate',
        'updateDate',
      ],
      where: { role: ROLE.USER, [option]: optionValue, status: status },
      skip: start,
      take: count,
      order: {
        username: 'ASC',
      },
    });
    return { count: userCount, users: users };
  }

  /**
   * @description: 更改任意用户信息
   * @param {UpdateAnyUserDto} updateAnyUserDto 数据传输对象
   * @return {*} void
   */
  async updateAnyUser(updateAnyUserDto: UpdateAnyUserDto): Promise<void> {
    // 查找用户
    const foundUser: UserEntity = await this.userRepository.findOneBy({
      id: updateAnyUserDto.id,
      role: ROLE.USER,
    });
    if (foundUser) {
      // 不能更改的项
      const prohibitKeys: Array<string> = [
        'avatar',
        'password',
        'passwordSalt',
        'role',
        'createDate',
        'updateDate',
      ];
      // 遍历数据传输对象
      for (const key in updateAnyUserDto) {
        if (
          !prohibitKeys.includes(key) &&
          updateAnyUserDto[key] !== undefined
        ) {
          // 不为空则赋值
          foundUser[key] = updateAnyUserDto[key];
        }
      }
      // 保存更改
      await this.userRepository.save(foundUser);
    } else {
      throw new BadRequestException('用户不存在');
    }
  }

  /**
   * @description: 根据ID批量删除用户
   * @param {DeleteUserDto} deleteUsersDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async deleteUsers(deleteUsersDto: DeleteUserDto): Promise<void> {
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    for (const deletedUserId of deleteUsersDto.ids) {
      // 查找用户
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: deletedUserId,
        role: ROLE.USER,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: deletedUserId, msg: '用户不存在' });
      }
    }
    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 删除用户
      await this.userRepository.delete(ids);
    }
  }

  /**
   * @description: 审核注册用户
   * @param {AuditUserDto} auditSignupDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async auditUsersSignup(auditSignupDto: AuditUserDto): Promise<void> {
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    // 注册通过
    for (const auditedUserId of auditSignupDto.ids) {
      // 查找用户
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: auditedUserId,
        status: USER_STATUS.AWAIT_SIGNUP_AUDIT,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: auditedUserId, msg: '用户未发现' });
      }
    }
    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      if (auditSignupDto.agree) {
        // 审核注册
        for (const userId of ids) {
          await this.userRepository.update(
            { id: userId, status: USER_STATUS.AWAIT_SIGNUP_AUDIT },
            { status: USER_STATUS.NORMAL },
          );
        }
      } else {
        // 注册不通过则删除
        await this.userRepository.delete(ids);
      }
    }
  }

  /**
   * @description: 审核注销用户
   * @param {AuditUserDto} auditLogoffDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async auditUsersLogoff(auditLogoffDto: AuditUserDto): Promise<void> {
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    // 查找用户
    for (const auditedUserId of auditLogoffDto.ids) {
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: auditedUserId,
        status: USER_STATUS.AWAIT_LOGOFF_AUDIT,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: auditedUserId, msg: '用户未发现' });
      }
    }
    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 注销通过则删除
      if (auditLogoffDto.agree) {
        await this.userRepository.delete(ids);
      } else {
        for (const userId of ids) {
          // 注销不通过则恢复正常
          await this.userRepository.update(
            { id: userId, status: USER_STATUS.AWAIT_LOGOFF_AUDIT },
            { status: USER_STATUS.NORMAL },
          );
        }
      }
    }
  }

  /**
   * @description: 用户封禁操作
   * @param {BlockedOperateDto} blockedOperateDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async operateBlockedUsers(
    blockedOperateDto: BlockedOperateDto,
  ): Promise<void> {
    // 识别操作
    const operate: USER_STATUS = blockedOperateDto.blocked
      ? USER_STATUS.LOCKED
      : USER_STATUS.NORMAL;
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    for (const operatedAdminId of blockedOperateDto.ids) {
      // 查找用户
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: operatedAdminId,
        role: ROLE.USER,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: operatedAdminId, msg: '用户未发现' });
      }
    }
    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      for (const userId of ids) {
        // 更新操作
        await this.userRepository.update(
          { id: userId, role: ROLE.USER },
          { status: operate },
        );
      }
    }
  }

  // *************************************************************
  // *************************** 超级管理员 ***********************
  // *************************************************************
  /**
   * @description: 根据ID批量更新用户角色为管理员
   * @param {UpdateUserRoleDto} updateUserRoleDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async updateUsersRole(updateUserRoleDto: UpdateUserRoleDto): Promise<void> {
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    for (const updateUserId of updateUserRoleDto.ids) {
      // 查找用户
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: updateUserId,
        role: ROLE.USER,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: updateUserId, msg: '用户未发现' });
      }
    }

    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      for (const userId of ids) {
        // 更改角色
        await this.userRepository.update(
          { id: userId, role: ROLE.USER },
          { role: ROLE.ADMIN },
        );
      }
    }
  }

  /**
   * @description: 获取管理员列表
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @param {option} option? 查询选项
   * @param {optionValue} optionValue? 选项值
   * @return {*} 数量和用户列表
   */
  async getAdminList(
    start: number,
    count: number,
    option?: UserSearchOption,
    optionValue?: string,
    status = USER_STATUS.NORMAL,
  ): Promise<{ count: number; admins: UserEntity[] }> {
    // 获取符合条件的用户数量
    const adminCount: number = await this.userRepository.countBy({
      role: ROLE.ADMIN,
      [option]: optionValue,
      status: status,
    });
    // 或取指定的用户信息
    const admins: UserEntity[] = await this.userRepository.find({
      select: [
        'id',
        'username',
        'realName',
        'gender',
        'age',
        'phoneNumber',
        'partyBranch',
        'role',
        'status',
        'createDate',
        'updateDate',
      ],
      where: { role: ROLE.ADMIN, [option]: optionValue, status: status },
      skip: start,
      take: count,
      order: {
        username: 'ASC',
      },
    });
    return { count: adminCount, admins: admins };
  }

  /**
   * @description: 添加管理员
   * @param {SignupDto} addAdminDto 数据传输对象
   * @return {*} void
   */
  async addAdmin(addAdminDto: SignupDto): Promise<void> {
    if (
      await this.userRepository.findOneBy({ username: addAdminDto.username })
    ) {
      //检查用户名重复
      throw new BadRequestException('用户名已存在');
    } else if (
      await this.userRepository.findOneBy({
        phoneNumber: addAdminDto.phoneNumber,
      })
    ) {
      // 检查电话号码重复
      throw new BadRequestException('电话号码已存在');
    } else {
      // 获取密码盐
      const passwordSalt: string = this.utilService.getSalt();
      // 创建用户
      const signupUser: UserEntity = await this.userRepository.create({
        username: addAdminDto.username,
        realName: addAdminDto.realName,
        password: this.utilService.encryptedData(
          addAdminDto.password + passwordSalt,
        ),
        passwordSalt: passwordSalt,
        gender: addAdminDto.gender,
        age: addAdminDto.age,
        phoneNumber: addAdminDto.phoneNumber,
        partyBranch: addAdminDto.partyBranch,
        role: ROLE.ADMIN,
        status: USER_STATUS.NORMAL,
      });
      // 保存创建的用户
      await this.userRepository.save(signupUser);
    }
  }

  /**
   * @description: 更改任意管理员信息
   * @param {UpdateAnyUserDto} updateAnyAdminDto 数据传输对象
   * @return {*} void
   */
  async updateAnyAdmin(updateAnyAdminDto: UpdateAnyUserDto): Promise<void> {
    // 查找用户
    const foundUser: UserEntity = await this.userRepository.findOneBy({
      id: updateAnyAdminDto.id,
      role: ROLE.ADMIN,
    });
    if (foundUser) {
      // 不能更改的项
      const prohibitKeys: Array<string> = [
        'avatar',
        'password',
        'passwordSalt',
        'createDate',
        'updateDate',
      ];
      // 遍历数据传输对象
      for (const key in updateAnyAdminDto) {
        if (
          !prohibitKeys.includes(key) &&
          updateAnyAdminDto[key] !== undefined
        ) {
          // 不为空则赋值
          foundUser[key] = updateAnyAdminDto[key];
        }
      }
      // 保存更改
      await this.userRepository.save(foundUser);
    } else {
      throw new BadRequestException('用户不存在');
    }
  }

  /**
   * @description: 根据ID批量删除管理员
   * @param {DeleteUserDto} deleteAdminsDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async deleteAdmins(deleteAdminsDto: DeleteUserDto): Promise<void> {
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    for (const deletedUserId of deleteAdminsDto.ids) {
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: deletedUserId,
        role: ROLE.ADMIN,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: deletedUserId, msg: '用户未发现' });
      }
    }
    // 抛出错误
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      await this.userRepository.delete(ids);
    }
  }

  /**
   * @description: 管理员封禁操作
   * @param {BlockedOperateDto} blockedOperateDto 数据传输对象
   * @return {*} void
   * @throws {id: number;msg: string;} 错误信息
   */
  async operateBlockedAdmins(
    blockedOperateDto: BlockedOperateDto,
  ): Promise<void> {
    // 解析操作
    const operate: USER_STATUS = blockedOperateDto.blocked
      ? USER_STATUS.LOCKED
      : USER_STATUS.NORMAL;
    const ids: string[] = [];
    const errors: Array<{ id: string; msg: string }> = [];
    for (const operatedAdminId of blockedOperateDto.ids) {
      // 查找用户
      const foundUser: UserEntity = await this.userRepository.findOneBy({
        id: operatedAdminId,
        role: ROLE.ADMIN,
      });
      if (foundUser) {
        ids.push(foundUser.id);
      } else {
        errors.push({ id: operatedAdminId, msg: '用户未发现' });
      }
      // 抛出错误
      if (errors.length > 0) {
        throw new BadRequestException(errors);
      } else {
        for (const userId of ids) {
          // 更新操作
          await this.userRepository.update(
            { id: userId, role: ROLE.ADMIN },
            { status: operate },
          );
        }
      }
    }
  }

  /**
   * @description: 启动时检查超级管理员账号
   * @return {*} void
   */
  async onApplicationBootstrap(): Promise<void> {
    // 查找超级管理员
    const foundSuperAdmin: UserEntity = await this.userRepository.findOne({
      where: {
        role: ROLE.SUPER_ADMIN,
      },
    });
    // 未发现则创建
    if (!foundSuperAdmin) {
      const passwordSalt: string = this.utilService.getSalt();
      const password: string = this.utilService.encryptedData(
        this.configService.get<string>('SUPER_ADMIN_PASSWORD') + passwordSalt,
      );
      const defaultSuperAdmin: UserEntity = await this.userRepository.create({
        username: this.configService.get<string>('SUPER_ADMIN_USERNAME'),
        realName: 'SuperAdmin',
        password: password,
        passwordSalt: passwordSalt,
        gender: GENDER.MAN,
        age: 0,
        phoneNumber: '',
        partyBranch: '',
        role: ROLE.SUPER_ADMIN,
        status: USER_STATUS.NORMAL,
      });
      await this.userRepository.save(defaultSuperAdmin);
    }
  }
}
