import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FoodstuffDocument = Foodstuff & Document;

export enum StoreType {
  BAKERY = 'bakery',
  KITCHEN = 'kitchen',
  GENERAL = 'general',
  MAIN_STORE = 'main_store',
  INDOMIE = 'indomie',
}

export interface StockData {
  month: string;
  type: 'opening' | 'closing';
  value: number;
  date: Date;
}

@Schema({ timestamps: true })
export class Foodstuff extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  unit: string;

  @Prop({ type: Number, default: 0, min: 0 })
  currentQuantity: number;

  @Prop({ type: Number, default: 0, min: 0 })
  averageCostPrice: number;

  @Prop({ type: Date, default: Date.now })
  lastUpdateDate: Date;

  @Prop({ required: true, enum: Object.values(StoreType), default: StoreType.GENERAL })
  storeType: string;

  @Prop({
    // required: true,
    type: Array,
    default: [],
  })
  stocks: StockData[];
}

export const FoodstuffSchema = SchemaFactory.createForClass(Foodstuff);

// Create compound unique index: name + storeType
FoodstuffSchema.index({ name: 1, storeType: 1 }, { unique: true });
