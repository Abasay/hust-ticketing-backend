import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from 'src/shared/constants';

export class AddAuthorizedUserReqDto {
  @ApiProperty({
    description: 'Email address of the user to be authorized',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'Role to be assigned to the authorized user',
    example: UserRole.CASHIER,
    enum: UserRole,
  })
  @IsEnum(UserRole, { message: 'Role must be a valid user role' })
  @IsNotEmpty({ message: 'Role is required' })
  role: UserRole;
}
