import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';

import { JwtUserPayload } from '../interfaces/jwt-user-payload.interface';
import { UnauthorizedException } from '../../../exceptions/unauthorized.exception';
import { Types } from 'mongoose';
import { BaseRepository } from 'src/modules/repository/base.repository';
import { User } from 'src/modules/user/user.schema';
import { Repositories } from 'src/shared/enums';

@Injectable()
export class JwtUserDefaultStrategy extends PassportStrategy(Strategy, 'authDefaultUser') {
  constructor(
    private readonly configService: ConfigService,
    @Inject(Repositories.UserRepository) private readonly userRepository: BaseRepository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('development.jwt.privateKey'),
      // secretOrKey: configService.get('production.jwt.privateKey'),
    });
  }

  async validate(payload: JwtUserPayload) {
    const user = await this.userRepository.findById(new Types.ObjectId(payload.user) as any);
    if (!user) {
      throw UnauthorizedException.UNAUTHORIZED_ACCESS();
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
