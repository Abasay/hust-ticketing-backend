import { ApiProperty } from '@nestjs/swagger';

export class DeleteFoodstuffResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;
}