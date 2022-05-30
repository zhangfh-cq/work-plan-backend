import { IsUUID, IsBoolean, IsArray } from 'class-validator';

export class BlockedOperateDto {
  @IsArray({ message: '[$property]必须是数组' })
  @IsUUID('all', {
    each: true,
    message: '[$property]数组值必须是UUID格式字符串',
  })
  ids: string[];

  @IsBoolean({ message: '[$property]只能是布尔值' })
  blocked: boolean;
}
