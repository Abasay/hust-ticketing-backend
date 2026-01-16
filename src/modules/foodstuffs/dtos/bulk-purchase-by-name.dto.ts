import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PurchaseItemByNameDto {
  @ApiProperty({ description: 'Name of the foodstuff', example: 'Rice' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Unit of measurement', example: 'kg' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: 'Quantity purchased (must be positive)' })
  @IsNumber()
  @Min(0)
  quantityChanged: number;

  @ApiProperty({ description: 'Unit cost for this purchase' })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiProperty({ description: 'Total cost for this purchase' })
  @IsNumber()
  @Min(0)
  totalCost: number;

  @ApiProperty({ description: 'Reason for the purchase' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  // @ApiProperty({ description: 'Requisition ID if this purchase fulfills a requisition', required: false })
  // @IsOptional()
  // @IsString()
  // requisitionId?: string;
}

export class BulkPurchaseByNameReqDto {
  @ApiProperty({
    description: 'Array of purchase items with foodstuff names',
    type: [PurchaseItemByNameDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemByNameDto)
  purchases: PurchaseItemByNameDto[];
}

export class PurchaseResultDto {
  @ApiProperty({ description: 'Foodstuff name' })
  name: string;

  @ApiProperty({ description: 'Whether the foodstuff was newly created' })
  isNewFoodstuff: boolean;

  @ApiProperty({ description: 'Created activity data' })
  activity: any;

  @ApiProperty({ description: 'Updated foodstuff data' })
  foodstuff: any;
}

export class BulkPurchaseByNameResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({
    description: 'Results for each purchase item',
    type: [PurchaseResultDto],
  })
  results: PurchaseResultDto[];

  @ApiProperty({ description: 'Summary of the bulk purchase operation' })
  summary: {
    totalItems: number;
    newFoodstuffsCreated: number;
    existingFoodstuffsUpdated: number;
    totalCost: number;
  };
}
