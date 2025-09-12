import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class GetUserResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'User details retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'User details',
    type: UserDto,
  })
  user: UserDto;
}
