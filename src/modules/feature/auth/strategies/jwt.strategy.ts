import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  /**
   * @description: Jwt策略解码后调用的函数
   * @param {any} payload 解码后的Jwt Payload
   * @return {*} 构建的user对象的属性
   */
  async validate(payload: any): Promise<object> {
    return { id: payload.sub, username: payload.username };
  }
}
