
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(payload: any) {
    // 从 DB 实时读取 currentOrgId，token 不再携带 orgId
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { currentOrgId: true, systemRole: true },
    });

    return { 
      sub: payload.sub, 
      phone: payload.phone, 
      orgId: user?.currentOrgId ?? null,
      systemRole: user?.systemRole || 'user',
    };
  }
}
