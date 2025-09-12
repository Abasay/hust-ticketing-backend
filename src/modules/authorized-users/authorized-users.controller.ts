import { Controller } from '@nestjs/common';
import { AuthorizedUsersService } from './authorized-users.service';

@Controller('authorized-users')
export class AuthorizedUsersController {
  constructor(private readonly authorizedUsersService: AuthorizedUsersService) {}
}
