import { AddBulletinDto } from './dto/add.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { BulletinEntity } from 'src/entities/bulletin/bulletin.entity';
import { BulletinSearchOption } from 'src/types/bulletin/search-option.type';
import { DeleteBulletinsDto } from './dto/delete.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateBulletinDto } from './dto/update.dto';
import { UtilService } from 'src/modules/shared/util/util.service';

@Injectable()
export class BulletinService {
  constructor(
    @InjectRepository(BulletinEntity)
    private bulletinRepository: Repository<BulletinEntity>,
    private utilService: UtilService,
  ) {}

  /**
   * @description: 添加公告
   * @param {string} publisherId 发布者ID
   * @param {AddBulletinDto} addBulletinDto 数据传输对象
   * @return {*} void
   */
  async addBulletin(
    publisherId: string,
    addBulletinDto: AddBulletinDto,
  ): Promise<void> {
    // 创建公告
    const createdBulletin: BulletinEntity =
      await this.bulletinRepository.create({
        title: addBulletinDto.title,
        content: addBulletinDto.content,
        publisherId: publisherId,
      });
    // 保存公告
    await this.bulletinRepository.save(createdBulletin);
  }

  /**
   * @description: 查询公告
   * @param {number} start 起始位置
   * @param {number} count 数量
   * @param {BulletinSearchOption} option 条件
   * @param {string} optionValue 条件值
   * @return {*} { count: number; bulletins: BulletinEntity[] }
   */
  async getBulletins(
    start: number,
    count: number,
    option: BulletinSearchOption,
    optionValue: string,
  ): Promise<{ count: number; bulletins: BulletinEntity[] }> {
    // 处理参数
    if (option === 'publisher') {
      option = 'publisherId';
      optionValue = await this.utilService.getIdByUsername(optionValue);
    }
    // 查找符合条件公告数量
    const foundBulletinCount: number = await this.bulletinRepository.count({
      where: {
        [option]: optionValue,
      },
    });
    // 查找符合条件公告
    const foundBulletins: BulletinEntity[] = await this.bulletinRepository.find(
      {
        where: {
          [option]: optionValue,
        },
        skip: start,
        take: count,
        order: {
          createDate: 'DESC',
        },
      },
    );
    // 获取发布者名称
    for (const bulletin of foundBulletins) {
      bulletin.publisher = await this.utilService.getUsernameById(
        bulletin.publisherId,
      );
      this.bulletinRepository.save(bulletin);
    }
    return { count: foundBulletinCount, bulletins: foundBulletins };
  }

  /**
   * @description: 修改公告
   * @param {UpdateBulletinDto} updateBulletinDto 数据传输对象
   * @return {*} void
   */
  async updateBulletin(updateBulletinDto: UpdateBulletinDto): Promise<void> {
    // 查找公告
    const foundBulletin: BulletinEntity = await this.bulletinRepository.findOne(
      {
        where: {
          id: updateBulletinDto.id,
        },
      },
    );
    if (foundBulletin) {
      // 修改公告
      foundBulletin.title = updateBulletinDto.title;
      foundBulletin.content = updateBulletinDto.content;
      await this.bulletinRepository.save(foundBulletin);
    } else {
      throw new BadRequestException('公告不存在');
    }
  }

  /**
   * @description: 删除公告
   * @param {DeleteBulletinsDto} deleteBulletinsDto 数据传输对象
   * @return {*} void
   */
  async deleteBulletins(deleteBulletinsDto: DeleteBulletinsDto): Promise<void> {
    const ids: number[] = [];
    const errors: Array<{ id: number; msg: string }> = [];
    // 遍历查找
    for (const id of deleteBulletinsDto.ids) {
      const foundBulletin: BulletinEntity =
        await this.bulletinRepository.findOne({
          where: {
            id: id,
          },
        });
      if (foundBulletin) {
        ids.push(foundBulletin.id);
      } else {
        errors.push({ id: id, msg: '公告不存在' });
      }
    }
    // 错误检查
    if (errors.length > 0) {
      throw new BadRequestException(errors);
    } else {
      // 删除公告
      await this.bulletinRepository.delete(ids);
    }
  }
}
