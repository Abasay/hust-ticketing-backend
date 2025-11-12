import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, Matches } from 'class-validator';

export class DateRangeReqDto {
  @ApiPropertyOptional({
    description: 'Start date for filtering (format: yyyy-MM-dd)',
    example: '2025-01-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'startDate must be in format yyyy-MM-dd',
  })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for filtering (format: yyyy-MM-dd)',
    example: '2025-01-31',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'endDate must be in format yyyy-MM-dd',
  })
  endDate?: string;
}
