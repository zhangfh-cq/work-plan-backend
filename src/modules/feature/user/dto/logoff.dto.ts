import { IsString, Length } from 'class-validator';

export class LogoffDto {
  @IsString({ message: '[$property]必须为字符串' })
  @Length(6, 16, {
    message: '[$property]长度与只能在$constraint1与$constraint2之间',
  })
  password: string;
}
