import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsMongoId } from 'class-validator';
import { AccountStatus } from 'src/shared/constants';

export class UpdateUserStatusReqDto {
  @ApiProperty({
    description: 'The ID of the user to update',
    example: '60f7b3b3b3b3b3b3b3b3b3b3',
  })
  @IsMongoId({ message: 'Please provide a valid user ID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;

  @ApiProperty({
    description: 'The new status to assign to the user',
    example: AccountStatus.ACTIVE,
    enum: AccountStatus,
  })
  @IsEnum(AccountStatus, { message: 'Status must be a valid account status' })
  @IsNotEmpty({ message: 'Status is required' })
  accountStatus: AccountStatus;
}
