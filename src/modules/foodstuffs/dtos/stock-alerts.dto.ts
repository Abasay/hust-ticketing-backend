import { ApiProperty } from '@nestjs/swagger';

export class StockAlertsResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Stock alerts' })
  alerts: Array<{
    foodstuff: {
      _id: string;
      name: string;
      currentQuantity: number;
      unit: string;
    };
    alertLevel: string;
    recommendedAction: string;
  }>;
}