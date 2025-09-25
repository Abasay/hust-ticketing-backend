import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray, IsNumber, IsOptional, IsEnum, IsDateString, Min, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { RequisitionStatus, RequisitionPriority } from '../schemas/foodstuff-requisition.schema';

export class RequisitionItemDto {
  @ApiProperty({ description: 'Foodstuff ID' })
  @IsString()
  @IsNotEmpty()
  foodstuffId: string;

  @ApiProperty({ description: 'Requested quantity' })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseFloat(value))
  requestedQuantity: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  @IsNotEmpty()
  unit: string;

  @ApiProperty({ description: 'Item-specific notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRequisitionReqDto {
  @ApiProperty({ description: 'Cooked food name ID this requisition is for' })
  @IsString()
  @IsNotEmpty()
  cookedFoodNameId: string;

  @ApiProperty({ description: 'Priority level', enum: RequisitionPriority })
  @IsEnum(RequisitionPriority)
  priority: RequisitionPriority;

  @ApiProperty({ description: 'Required date for the materials' })
  @IsDateString()
  requiredDate: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'List of required items', type: [RequisitionItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items: RequisitionItemDto[];
}

export class UpdateRequisitionReqDto {
  @ApiProperty({ description: 'Priority level', enum: RequisitionPriority, required: false })
  @IsOptional()
  @IsEnum(RequisitionPriority)
  priority?: RequisitionPriority;

  @ApiProperty({ description: 'Required date', required: false })
  @IsOptional()
  @IsDateString()
  requiredDate?: string;

  @ApiProperty({ description: 'General notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Updated items list', type: [RequisitionItemDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitionItemDto)
  items?: RequisitionItemDto[];
}

export class ApproveRequisitionReqDto {
  @ApiProperty({ description: 'Approved items with quantities' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items: Array<{
    foodstuffId: string;
    approvedQuantity: number;
  }>;

  @ApiProperty({ description: 'Approval notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectRequisitionReqDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}

export class FulfillRequisitionReqDto {
  @ApiProperty({ description: 'Fulfilled items with actual quantities used' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  items: Array<{
    foodstuffId: string;
    fulfilledQuantity: number;
    reason: string;
  }>;
}

export class CreateRequisitionResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  requisition: any;
}

export class GetRequisitionsResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    requisitions: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UpdateRequisitionResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  requisition: any;
}

export class DeleteRequisitionResDto {
  @ApiProperty()
  message: string;
}