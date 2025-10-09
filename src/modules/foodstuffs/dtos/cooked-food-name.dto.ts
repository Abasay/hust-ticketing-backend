import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength, MaxLength, IsNumber, Min } from 'class-validator';

export class CreateCookedFoodNameReqDto {
  @ApiProperty({ example: 'Jollof Rice', description: 'Name of the cooked food' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Traditional Nigerian rice dish', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 'Traditional Nigerian rice dish', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  category: string;

  @ApiProperty({ example: 'Price Per Quantity', required: false })
  @IsNumber()
  @Min(1)
  pricePerQuantity: number;
}

export class UpdateCookedFoodNameReqDto {
  @ApiProperty({ example: 'Jollof Rice', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Traditional Nigerian rice dish', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CookedFoodNameDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CreateCookedFoodNameResDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: CookedFoodNameDto })
  cookedFoodName: CookedFoodNameDto;
}

export class GetCookedFoodNamesResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    cookedFoodNames: CookedFoodNameDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UpdateCookedFoodNameResDto {
  @ApiProperty()
  message: string;

  @ApiProperty({ type: CookedFoodNameDto })
  cookedFoodName: CookedFoodNameDto;
}

export class DeleteCookedFoodNameResDto {
  @ApiProperty()
  message: string;
}
