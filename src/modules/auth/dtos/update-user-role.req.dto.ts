import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsMongoId } from 'class-validator';
import { UserRole } from 'src/shared/constants';

export class UpdateUserRoleReqDto {
  @ApiProperty({
    description: 'The ID of the user to update',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @IsMongoId({ message: 'Please provide a valid user ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    description: 'The new role to assign to the user',
    example: UserRole.CASHIER,
    enum: UserRole,
  })
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  newRole: UserRole;
}
