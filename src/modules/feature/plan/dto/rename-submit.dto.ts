import { IsNotEmpty, IsString, Length } from 'class-validator';

export class RenameSubmitFileDto {
  @IsNotEmpty({ message: '[$property]不能为空' })
  id: number;

  @IsNotEmpty({ message: '[$property]不能为空' })
  @IsString({ message: '[$property]只能为字符串' })
  @Length(1, 100, {
    message: '[$property]长度只能在$constraint1到$constraint2之间',
  })
  newName: string;
}
