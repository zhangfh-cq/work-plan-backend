import { ArrayNotEmpty, IsArray, IsInt, Min } from 'class-validator';

export class UnlockPlanDto {
  @IsArray({ message: '[$property]必须是数组' })
  @ArrayNotEmpty({ message: '[$property]数组不能为空' })
  @IsInt({ each: true, message: '[$property]只能为整数数组' })
  @Min(1, { each: true, message: '[$property]数组中的值不能小于$constraint1' })
  ids: number[];
}
