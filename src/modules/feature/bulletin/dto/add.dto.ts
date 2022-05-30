import { IsString, Length } from 'class-validator';

export class AddBulletinDto {
  @IsString({ message: '[$property]只能为字符串' })
  @Length(1, 30, {
    message: '[$property]长度只能在$constraint1到$constraint2之间',
  })
  title: string;

  @IsString({ message: '[$property]只能为字符串' })
  @Length(1, 1000, {
    message: '[$property]长度只能在$constraint1到$constraint2之间',
  })
  content: string;
}
