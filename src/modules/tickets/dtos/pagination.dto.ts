import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max, IsString, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { TicketStatus, TicketType } from 'src/shared/constants';

export class PaginationDto {
  @ApiProperty({ 
    description: 'Page number (1-based)', 
    example: 1, 
    minimum: 1,
    required: false,
    default: 1
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    description: 'Number of items per page', 
    example: 10, 
    minimum: 1,
    maximum: 100,
    required: false,
    default: 10
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class TicketFilterDto extends PaginationDto {
  @ApiProperty({ 
    description: 'Filter by ticket status', 
    enum: TicketStatus,
    required: false
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: string;

  @ApiProperty({ 
    description: 'Filter by ticket type', 
    enum: TicketType,
    required: false
  })
  @IsOptional()
  @IsEnum(TicketType)
  ticketType?: string;

  @ApiProperty({
    description: 'Search by ticket number',
    example: 'TKT-2024',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by cashier ID',
    example: '507f1f77bcf86cd799439011',
    required: false
  })
  @IsOptional()
  @IsString()
  cashierId?: string;
}

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: 'Array of items' })
  data: T[];

  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page' })
  hasPrev: boolean;
}
