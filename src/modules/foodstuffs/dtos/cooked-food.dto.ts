import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCookedFoodReqDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'ID of the cooked food name' })
  @IsString()
  cookedFoodNameId: string;

  @ApiProperty({ example: 25.5, description: 'Quantity prepared in kg' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  preparedQuantityKg: number;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  preparationDate?: string;

  @ApiProperty({ example: 'Extra spicy today', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateCookedFoodReqDto {
  @ApiProperty({ example: 20.0, description: 'Sold quantity in kg', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  soldQuantityKg?: number;

  @ApiProperty({ example: 5.5, description: 'Leftover quantity in kg', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  leftoverQuantityKg?: number;

  @ApiProperty({ example: 'Updated notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CookedFoodDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  cookedFoodNameId: any;

  @ApiProperty()
  preparedQuantityKg: number;

  @ApiProperty()
  soldQuantityKg: number;

  @ApiProperty()
  leftoverQuantityKg: number;

  @ApiProperty()
  preparationDate: Date;

  @ApiProperty()
  preparedBy: any;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateCookedFoodResDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: CookedFoodDto })
  cookedFood: CookedFoodDto;
}

export class GetCookedFoodsResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    cookedFoods: CookedFoodDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UpdateCookedFoodResDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: CookedFoodDto })
  cookedFood: CookedFoodDto;
}

export class DeleteCookedFoodResDto {
  @ApiProperty()
  message: string;
}

export class CookedFoodStatsResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    totalPreparedToday: number;
    totalSoldToday: number;
    totalLeftoverToday: number;
    mostPreparedFood: string;
    totalWastePercentage: number;
  };
}
