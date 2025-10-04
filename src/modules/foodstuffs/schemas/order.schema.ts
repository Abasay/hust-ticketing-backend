import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames, OrderStatus } from 'src/shared/constants';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class OrderItem extends Document {
  @Prop({ required: true, ref: DatabaseModelNames.COOKED_FOOD_NAME })
  itemId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  pricePerQuantity: number;
}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: false, ref: DatabaseModelNames.USER })
  user?: Types.ObjectId;

  @Prop({ required: true, type: Array })
  orders: [OrderItem];

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, default: OrderStatus.PENDING, enum: [...Object.values(OrderStatus)] })
  status: string;

  @Prop({ trim: true, required: true, unique: true })
  orderId: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
