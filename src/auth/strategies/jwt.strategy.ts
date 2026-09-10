import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // secretOrKey: config.getOrThrow<string>('security.jwtAccessSecret'),
      secretOrKey: 'secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Attached to req.user on every route guarded by JwtAuthGuard
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
