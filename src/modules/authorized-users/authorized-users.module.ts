import { Module } from '@nestjs/common';
import { AuthorizedUsersService } from './authorized-users.service';
import { AuthorizedUsersController } from './authorized-users.controller';

@Module({
  controllers: [AuthorizedUsersController],
  providers: [AuthorizedUsersService],
})
export class AuthorizedUsersModule {}
