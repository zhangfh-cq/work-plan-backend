import internal from 'stream';
import path from 'path';
import { BadRequestException, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { mkdir, rm, writeFile } from 'fs/promises';
import { Repository } from 'typeorm';
import { UserEntity } from 'src/entities/user/user.entity';

@Injectable()
export class UtilService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * @description: 获取伪随机密码盐
   * @param {number} length 盐的长度
   * @return 生成的伪随机密码盐
   */
  getSalt(length = 32): string {
    return randomBytes(length / 2).toString('hex');
  }

  /**
   * @description: 使用哈希函数加密数据
   * @param {string} data 要加密的数据
   * @param {string} algorithm 使用的哈希算法
   * @return 数据加密后的哈希摘要
   */
  encryptedData(data: string, algorithm = 'sha256'): string {
    return createHash(algorithm).update(data).digest('hex');
  }

  /**
   * @description: 通过ID获取用户名
   * @param {string} userId 用户ID
   * @return {*} 用户名
   */
  async getUsernameById(userId: string): Promise<string> {
    if (userId === null) {
      return null;
    }
    const foundUser: UserEntity = await this.userRepository.findOne({
      select: ['realName', 'username'],
      where: { id: userId },
    });
    if (foundUser) {
      return `${foundUser.username}(${foundUser.realName})`;
    } else {
      return '用户已注销';
    }
  }

  /**
   * @description: 通过用户名获取ID
   * @param {string} username 用户名
   * @return {*} 用户ID
   */
  async getIdByUsername(username: string): Promise<string> {
    console.log(username);
    const foundUser: UserEntity = await this.userRepository.findOne({
      select: ['id', 'username'],
      where: {
        username: username,
      },
    });
    if (foundUser) {
      return foundUser.id;
    } else {
      throw new BadRequestException('用户不存在');
    }
  }

  /**
   * @description: 删除文件夹
   * @param {string} path 文件夹路径
   * @return {*} void
   */
  async rmFolder(path: string): Promise<void> {
    await rm(path, { force: true, recursive: true });
  }

  /**
   * @description: 创建文件夹独占文件
   * @param {string} folder 文件单独占有的文件夹
   * @param {string} fileName 文件名
   * @param {*} data 写入的数据
   * @return {*} void
   */
  async createFolderExclusiveFile(
    folder: string,
    fileName: string,
    data:
      | string
      | NodeJS.ArrayBufferView
      | Iterable<string | NodeJS.ArrayBufferView>
      | AsyncIterable<string | NodeJS.ArrayBufferView>
      | internal.Stream,
  ): Promise<void> {
    // 删除可能已存在的文件
    await rm(folder, { force: true, recursive: true });
    // 创建目录
    await mkdir(folder, { recursive: true });
    // 写入文件
    await writeFile(path.join(folder, fileName), data);
  }
}
