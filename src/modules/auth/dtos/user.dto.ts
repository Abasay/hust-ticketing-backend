import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ 
    description: 'User ID', 
    example: '507f1f77bcf86cd799439011' 
  })
  _id: string;

  @ApiProperty({ 
    description: 'User first name', 
    example: 'John' 
  })
  firstName: string;

  @ApiProperty({ 
    description: 'User last name', 
    example: 'Doe' 
  })
  lastName: string;

  @ApiProperty({ 
    description: 'User email', 
    example: 'john.doe@example.com' 
  })
  email: string;

  @ApiProperty({ 
    description: 'User role', 
    example: 'ADMIN' 
  })
  role: string;

  @ApiProperty({ 
    description: 'Account status', 
    example: 'ACTIVE' 
  })
  accountStatus: string;

  @ApiProperty({ 
    description: 'Account creation date', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Account last update date', 
    example: '2024-01-15T10:30:00.000Z' 
  })
  updatedAt: Date;
}
