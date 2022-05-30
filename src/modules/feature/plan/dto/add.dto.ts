import { IsDateString, IsString, Length } from 'class-validator';

export class AddPlanDto {
  @IsString({ message: '[$property]只能为字符串' })
  @Length(1, 50, {
    message: '[$property]长度只能在$constraint1到$constraint2之间',
  })
  title: string;

  @IsString({ message: '[$property]只能为字符串' })
  @Length(1, 1000, {
    message: '[$property]长度只能在$constraint1到$constraint2之间',
  })
  content: string;

  @IsDateString({ strict: true }, { message: '[$property]只能为ISO 8601格式' })
  limitDate: Date;
}
