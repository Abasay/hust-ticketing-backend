import { ApiProperty } from '@nestjs/swagger';

export class FoodstuffDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  unit: string;

  @ApiProperty()
  currentQuantity: number;

  @ApiProperty()
  averageCostPrice: number;

  @ApiProperty()
  lastUpdateDate: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
