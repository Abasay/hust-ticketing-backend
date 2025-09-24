import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FoodstuffDocument = Foodstuff & Document;

@Schema({ timestamps: true })
export class Foodstuff extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ type: Number, default: 0, min: 0 })
  currentQuantity: number;

  @Prop({ type: Number, default: 0, min: 0 })
  averageCostPrice: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdateDate: Date;
}

export const FoodstuffSchema = SchemaFactory.createForClass(Foodstuff);