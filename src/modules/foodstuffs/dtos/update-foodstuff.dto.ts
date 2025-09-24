import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class UpdateFoodstuffReqDto {
  @ApiProperty({ description: 'Name of the foodstuff', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiProperty({ description: 'Unit of measurement', required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  unit?: string;
}

export class UpdateFoodstuffResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Updated foodstuff data' })
  foodstuff: any;
}