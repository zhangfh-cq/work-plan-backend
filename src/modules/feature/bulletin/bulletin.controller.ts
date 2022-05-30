import { AddBulletinDto } from './dto/add.dto';
import { AuthGuard } from '@nestjs/passport';
import { BulletinSearchOption } from 'src/types/bulletin/search-option.type';
import { BulletinService } from './bulletin.service';
import { DeleteBulletinsDto } from './dto/delete.dto';
import { Role } from 'src/decorators/role.decorator';
import { ROLE } from 'src/enums/user/role.enum';
import { UpdateBulletinDto } from './dto/update.dto';
import {
  Get,
  Body,
  Post,
  Query,
  Request,
  UseGuards,
  Controller,
} from '@nestjs/common';

@Controller('bulletin') // 公告控制器
@UseGuards(AuthGuard('jwt'))
export class BulletinController {
  constructor(private bulletinService: BulletinService) {}

  @Post('add') // 添加公告
  @Role(ROLE.ADMIN)
  async addBulletin(
    @Request() request: any,
    @Body() addBulletinDto: AddBulletinDto,
  ) {
    return await this.bulletinService.addBulletin(
      request.user.id,
      addBulletinDto,
    );
  }

  @Get('list') // 获取公告
  async getBulletins(
    @Query('start') start: number,
    @Query('count') count: number,
    @Query('option') option: BulletinSearchOption,
    @Query('value') optionValue: string,
  ) {
    return await this.bulletinService.getBulletins(
      start,
      count,
      option,
      optionValue,
    );
  }

  @Post('update') // 更新公告
  @Role(ROLE.ADMIN)
  async updateBulletin(@Body() updateBulletinDto: UpdateBulletinDto) {
    return await this.bulletinService.updateBulletin(updateBulletinDto);
  }

  @Post('delete') // 删除公告
  @Role(ROLE.ADMIN)
  async deleteBulletins(@Body() deleteBulletinsDto: DeleteBulletinsDto) {
    return await this.bulletinService.deleteBulletins(deleteBulletinsDto);
  }
}
