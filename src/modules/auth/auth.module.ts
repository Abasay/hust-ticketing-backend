import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { PassportModule, PassportStrategy } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { HttpModule } from '@nestjs/axios';

import { JwtUserStrategy } from './strategies/jwt-user.strategy';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles.guard';
import { MailerModule } from '../mailer/mailer.module';
import { RepositoryModule } from '../repository/repository.module';
import { MongooseModelsModule } from '../mongoose-models/mongoose.models.module';
import { JwtUserDefaultStrategy } from './strategies/jwt.user.default.strategy';
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const env = configService.get('NODE_ENV');
        return {
          secret: configService.get(`${env + '.jwt.privateKey'}`),
          signOptions: { expiresIn: configService.get(`${env + '.jwt.expiresIn'}`), algorithm: 'HS256' },
          // signOptions: { algorithm: 'HS256' },
          verifyOptions: {
            algorithms: ['HS256'],
          },
        };
      },
    }),
    HttpModule,
    MailerModule,
    RepositoryModule,
    MongooseModelsModule,
  ],
  providers: [JwtUserStrategy, AuthService, JwtUserDefaultStrategy, RolesGuard, Reflector],
  controllers: [AuthController],
  exports: [JwtUserStrategy, JwtUserDefaultStrategy],
})
export class AuthModule {}
