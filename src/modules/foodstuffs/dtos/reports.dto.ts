import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional, IsDateString, IsString, IsInt, Min } from 'class-validator';

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

export class ReportDateRangeDto {
  @ApiProperty({
    description: 'Start date of the report',
    required: false,
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({
    description: 'End date of the report',
    required: false,
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({
    description: 'Page number for pagination',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    required: false,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

class OrderReportItemDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  quantityCooked: number;

  @ApiProperty()
  measurementUnit: string;

  @ApiProperty()
  quantitySold: number;

  @ApiProperty()
  purchaseUnit: string;

  @ApiProperty()
  pricePerQuantityForSold: number;

  @ApiProperty()
  amountRevenue: number;
}

class DailyReportDto {
  @ApiProperty()
  date: string;

  @ApiProperty({ type: [OrderReportItemDto] })
  orders: OrderReportItemDto[];

  @ApiProperty()
  ticketGenerated: number;

  @ApiProperty()
  ticketValueGenerated: number;

  @ApiProperty()
  ticketRedeemed: number;

  @ApiProperty()
  ticketValueRedeemed: number;
}

export class OrdersReportResDto {
  @ApiProperty({ type: [DailyReportDto] })
  data: DailyReportDto[];

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  totalPages: number;
}
