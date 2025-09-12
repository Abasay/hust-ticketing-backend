import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Current password of the user', example: 'OldPassword123!' })
  currentPassword!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
    @ApiProperty({ description: 'New password of the user', minLength: 8, example: 'OldPassword123!' })

  newPassword!: string;
}
