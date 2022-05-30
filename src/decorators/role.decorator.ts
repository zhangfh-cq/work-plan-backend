import { CustomDecorator, SetMetadata } from '@nestjs/common';
import { ROLE } from 'src/enums/user/role.enum';

export function Role(role: ROLE): CustomDecorator<string> {
  return SetMetadata('Role', role);
}
