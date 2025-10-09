import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames, OrderStatus } from 'src/shared/constants';

export type OrderDocument = Order & Document;

@Schema({ _id: false }) // 👈 important: embedded schema doesn't need its own _id
export class OrderItem {
  @Prop({ required: true, ref: DatabaseModelNames.COOKED_FOOD_NAME, type: Types.ObjectId })
  itemId: Types.ObjectId;

  @Prop({ required: true, type: Number })
  quantity: number;

  @Prop({ required: true, type: Number })
  pricePerQuantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: false, ref: DatabaseModelNames.USER, type: Types.ObjectId })
  user?: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  orders: OrderItem[];

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: String, default: OrderStatus.PENDING, enum: [...Object.values(OrderStatus)] })
  status: string;

  @Prop({ trim: true, required: true, unique: true })
  orderId: string;

  @Prop({ type: Number, default: 10, required: true })
  processingFee: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
