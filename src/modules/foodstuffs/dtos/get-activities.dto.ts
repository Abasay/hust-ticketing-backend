import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, IsNumber, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { ActionType } from '../schemas/foodstuff-history.schema';

export class GetActivitiesReqDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({ description: 'Filter by activity type', enum: ActionType, required: false })
  @IsOptional()
  @IsEnum(ActionType)
  actionType?: ActionType;

  @ApiProperty({ description: 'Start date filter (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date filter (ISO format)', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class GetActivitiesResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Paginated activities data' })
  data: {
    activities: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}