import { IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class DeleteBulletinsDto {
  @IsNotEmpty({ message: '[$property]不能为空' })
  @IsArray({ message: '[$property]必须为整数数组' })
  @IsInt({ each: true, message: '[$property]成员只能是整数' })
  ids: number[];
}
