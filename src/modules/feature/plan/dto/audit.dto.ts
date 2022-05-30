import { ArrayNotEmpty, IsArray, IsEnum, IsInt, Min } from 'class-validator';
import { SUBMIT_STATUS } from 'src/enums/plan/submit-status.enum';

export class AuditSubmitDto {
  @IsArray({ message: '[$property]必须是数组' })
  @ArrayNotEmpty({ message: '[$property]数组不能为空' })
  @IsInt({ each: true, message: '[$property]只能为整数数组' })
  @Min(1, { each: true, message: '[$property]数组中的值不能小于$constraint1' })
  ids: number[];

  @IsEnum(SUBMIT_STATUS, {
    message: `[$property]只能为${SUBMIT_STATUS.APPROVED}/${SUBMIT_STATUS.UNAPPROVED}${SUBMIT_STATUS.AWAIT_AUDIT}中的一个`,
  })
  status: SUBMIT_STATUS;
}
