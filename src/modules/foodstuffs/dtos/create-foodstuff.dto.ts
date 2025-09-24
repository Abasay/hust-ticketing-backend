import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateFoodstuffReqDto {
  @ApiProperty({ description: 'Name of the foodstuff', example: 'Rice' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: 'Initial quantity', example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQuantity?: number;
}

export class CreateFoodstuffResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Created foodstuff data' })
  foodstuff: {
    _id: string;
    name: string;
    unit: string;
    currentQuantity: number;
    averageCostPrice: number;
    lastUpdateDate: string;
    createdAt: string;
    updatedAt: string;
  };
}