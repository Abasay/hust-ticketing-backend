import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsDateString, IsString } from 'class-validator';

export enum ReportType {
  PURCHASES = 'purchases',
  USAGE = 'usage',
  WASTAGE = 'wastage',
  STOCK_LEVELS = 'stock-levels',
  USAGE_VS_WASTAGE = 'usage-vs-wastage',
}

export enum GroupBy {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class GenerateReportReqDto {
  @ApiProperty({ description: 'Report type', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Start date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Filter by specific foodstuff ID', required: false })
  @IsOptional()
  @IsString()
  foodstuffId?: string;

  @ApiProperty({ description: 'Group data by period', enum: GroupBy, required: false })
  @IsOptional()
  @IsEnum(GroupBy)
  groupBy?: GroupBy;
}

export class ReportResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Report data' })
  report: {
    type: string;
    data: any[];
    summary: {
      totalItems: number;
      totalValue: number;
      totalQuantity: number;
    };
    generatedAt: string;
  };
}