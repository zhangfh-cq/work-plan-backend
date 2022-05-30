import { GENDER } from 'src/enums/user/gender.enum';
import {
  Min,
  Max,
  IsInt,
  IsEnum,
  Length,
  IsString,
  IsOptional,
} from 'class-validator';

export class UpdateDto {
  @IsString({ message: '[$property]必须为字符串' })
  @Length(1, 20, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  username: string;

  @IsOptional()
  @IsString({ message: '[$property]必须为字符串' })
  @Length(6, 16, {
    message: '[$property]长度与只能在$constraint1与$constraint2之间',
  })
  password: string;

  @IsEnum(GENDER, {
    message: `[$property]只能是${GENDER.MAN}或${GENDER.WOMAN}`,
  })
  gender: string;

  @IsInt({ message: '[$property]只能为整数' })
  @Max(150, { message: '[$property]不能超过$constraint1' })
  @Min(1, { message: '[$property]不能小于$constraint1' })
  age: number;

  @IsString({ message: '[$property]必须为字符串' })
  @Length(8, 20, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  phoneNumber: string;

  @IsString({ message: '[$property]必须为字符串' })
  @Length(1, 30, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  partyBranch: string;
}
