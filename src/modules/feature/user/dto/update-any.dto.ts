import { ROLE } from 'src/enums/user/role.enum';
import { GENDER } from 'src/enums/user/gender.enum';
import { USER_STATUS } from 'src/enums/user/status.enum';
import {
  IsEnum,
  IsInt,
  IsString,
  IsUUID,
  IsOptional,
  Length,
  Max,
  Min,
} from 'class-validator';

export class UpdateAnyUserDto {
  @IsUUID('all', { message: '[$property]必须为UUID格式' })
  id: string;

  @IsOptional()
  @IsString({ message: '[$property]必须为字符串' })
  @Length(1, 20, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  username: string;

  @IsOptional()
  @IsString({ message: '[$property]必须为字符串' })
  @Length(1, 20, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  realName: string;

  @IsOptional()
  @IsEnum(GENDER, { message: '[$property]只能是$constraint1或$constraint2' })
  gender: GENDER;

  @IsOptional()
  @IsInt({ message: '[$property]只能为整数' })
  @Max(150, { message: '[$property]不能超过$constraint1' })
  @Min(1, { message: '[$property]不能小于$constraint1' })
  age: number;

  @IsOptional()
  @IsString({ message: '[$property]必须为字符串' })
  @Length(8, 20, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString({ message: '[$property]必须为字符串' })
  @Length(1, 30, {
    message: '[$property]长度只能在$constraint1与$constraint2之间',
  })
  partyBranch: string;

  @IsOptional()
  @IsEnum(ROLE, {
    message: `[$property]只能为${ROLE.USER}${ROLE.ADMIN}${ROLE.SUPER_ADMIN}中的一个`,
  })
  role: ROLE;

  @IsOptional()
  @IsEnum(USER_STATUS, {
    message: `[$property]只能为${USER_STATUS.NORMAL}/${USER_STATUS.LOCKED}/${USER_STATUS.AWAIT_SIGNUP_AUDIT}/${USER_STATUS.AWAIT_LOGOFF_AUDIT}中的一个`,
  })
  status: USER_STATUS;
}
