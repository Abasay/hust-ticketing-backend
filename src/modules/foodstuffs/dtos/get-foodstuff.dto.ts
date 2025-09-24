import { ApiProperty } from '@nestjs/swagger';

export class GetFoodstuffResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Foodstuff data' })
  foodstuff: {
    _id: string;
    name: string;
    unit: string;
    currentQuantity: number;
    averageCostPrice: number;
    lastUpdateDate: string;
    createdAt: string;
    updatedAt: string;
  };
}