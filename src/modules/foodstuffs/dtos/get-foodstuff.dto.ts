import { ApiProperty } from '@nestjs/swagger';
import { FoodstuffDto } from './foodstuff.dto';

export class GetFoodstuffResDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  data: {
    foodstuffs: FoodstuffDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class GetFoodstuffReqDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 10 })
  limit?: number = 10;

  @ApiProperty({ description: 'Search term', required: false })
  search?: string;

  @ApiProperty({ description: 'Filter by unit', required: false })
  unit?: string;

  @ApiProperty({ description: 'Filter low stock items', required: false })
  lowStock?: boolean;

  @ApiProperty({ description: 'Sort by field', required: false, default: 'name' })
  sortBy?: string;

  @ApiProperty({ description: 'Sort order', required: false, default: 'asc' })
  sortOrder?: string;
}
