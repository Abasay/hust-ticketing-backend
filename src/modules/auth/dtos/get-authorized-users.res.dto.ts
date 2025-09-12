import { ApiProperty } from '@nestjs/swagger';

export class AuthorizedUserDto {
  @ApiProperty({ description: 'Authorized user ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User role', example: 'CASHIER' })
  accountType: string;

  @ApiProperty({ description: 'Admin who added this user', example: '507f1f77bcf86cd799439012' })
  addedBy: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class GetAuthorizedUsersResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Authorized users retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Paginated authorized users data',
  })
  data: {
    users: AuthorizedUserDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
