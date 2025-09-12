import { ApiProperty } from '@nestjs/swagger';

export class AddAuthorizedUserResDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Authorized user added successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Created authorized user information',
    example: {
      _id: '507f1f77bcf86cd799439011',
      email: 'john.doe@example.com',
      accountType: 'CASHIER',
      addedBy: '507f1f77bcf86cd799439012',
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
    },
  })
  authorizedUser: {
    _id: string;
    email: string;
    accountType: string;
    addedBy: string;
    createdAt: Date;
    updatedAt: Date;
  };
}
