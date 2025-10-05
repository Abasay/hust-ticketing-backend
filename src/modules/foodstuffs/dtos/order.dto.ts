import { ApiProperty } from '@nestjs/swagger';
import { OrderStatus } from 'src/shared/constants';

class OrderItemDto {
  @ApiProperty()
  itemId: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  pricePerQuantity: number;
}

export class OrderDto {
  @ApiProperty()
  _id: string;

  @ApiProperty({ required: false })
  user?: string;

  @ApiProperty({ type: [OrderItemDto] })
  orders: OrderItemDto[];

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ enum: OrderStatus })
  status: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}