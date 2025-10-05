import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CookedFoodNameDocument = CookedFoodName & Document;

@Schema({ timestamps: true })
export class CookedFoodName extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ required: true, type: Number })
  pricePerQuantity: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  purchaseUnit: string;
}

export const CookedFoodNameSchema = SchemaFactory.createForClass(CookedFoodName);
