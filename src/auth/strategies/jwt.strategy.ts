import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../users/user.entity.js';
import { languages } from '../../language/language.cache.js';
import { AuthUser } from '../interfaces/auth-user.interface.js';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('security.jwtAccessSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.userRepository.findOne({
      where: { id: parseInt(payload.sub) },
      relations: {
        role: true,
      },
      select: { 
        id: true, 
        email: true, 
        role: true, 
        langIds: true,
        isActive: true,
      },
    })

    if (!user) throw new UnauthorizedException;

    if (!user.isActive) {
      throw new ForbiddenException();
    }

    // Attached to req.user on every route guarded by JwtAuthGuard
    return { 
      userId: +payload.sub, 
      email: payload.email, 
      role: user.role,
      langIds: Array.isArray(user.langIds) ? user.langIds : [],
      langCodes: Array.isArray(user.langIds)
        ? languages
            .filter((item) => user.langIds.includes(item.id))
            .map((item) => item.name.toLowerCase())
        : [],
    };
  }
}
