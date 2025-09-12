import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class LoginResDto {
  @ApiProperty({
    description: 'Message to the user',
    example: 'Login successful',
  })
  message: string;

  @ApiProperty({
    description: 'Access token for the user',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Access token for the user',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'User details',
    type: UserDto,
  })
  user: UserDto;
}
