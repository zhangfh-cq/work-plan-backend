import { IsArray, IsUUID } from 'class-validator';

export class DeleteUserDto {
  @IsArray({ message: '[$property]必须是数组' })
  @IsUUID('all', {
    each: true,
    message: '[$property]数组值必须是UUID格式字符串',
  })
  ids: string[];
}
