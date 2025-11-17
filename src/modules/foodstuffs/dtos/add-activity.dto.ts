import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum, Min, ValidateIf, IsDateString } from 'class-validator';
import { ActionType } from '../schemas/foodstuff-history.schema';

export class AddActivityReqDto {
  @ApiProperty({ description: 'Type of activity', enum: ActionType })
  @IsEnum(ActionType)
  actionType: ActionType;

  @ApiProperty({ description: 'Quantity changed (positive for increase, negative for decrease)' })
  @IsNumber()
  quantityChanged: number;

  @ApiProperty({ description: 'Unit cost (required for purchases)', required: false })
  @ValidateIf((o) => o.actionType === ActionType.PURCHASE)
  @IsNumber()
  @Min(0)
  unitCost?: number;

  // Date is optional for USAGE activities
  @ApiProperty({ description: 'Date of the activity (ISO format)', required: false, example: '2023-06-01' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ description: 'Total cost (required for purchases)', required: false })
  @ValidateIf((o) => o.actionType === ActionType.PURCHASE)
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiProperty({ description: 'Reason for the activity' })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Cooked food name ID (required for USAGE activities)', required: false })
  @ValidateIf((o) => o.actionType === ActionType.USAGE)
  @IsString()
  @IsNotEmpty()
  cookedFoodNameId?: string;

  @ApiProperty({ description: 'Requisition ID if this activity fulfills a requisition', required: false })
  @IsOptional()
  @IsString()
  requisitionId?: string;
}

export class AddActivityResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Created activity data' })
  activity: any;

  @ApiProperty({ description: 'Updated foodstuff data' })
  updatedFoodstuff: any;
}
