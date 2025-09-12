import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class GetAllUsersResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Users retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Paginated user data',
  })
  data: {
    users: UserDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
