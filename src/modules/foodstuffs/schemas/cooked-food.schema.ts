import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type CookedFoodDocument = CookedFood & Document;

@Schema({ timestamps: true })
export class CookedFood extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.COOKED_FOOD_NAME, required: true })
  cookedFoodNameId: Types.ObjectId;

  @Prop({ required: true, type: Number, min: 0 })
  preparedQuantityKg: number;

  @Prop({ type: Number, default: 0, min: 0 })
  soldQuantityKg: number;

  @Prop({ type: Number, default: 0, min: 0 })
  leftoverQuantityKg: number;

  @Prop({ type: Date, default: Date.now })
  preparationDate: Date;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: true })
  preparedBy: Types.ObjectId;

  @Prop({ trim: true })
  notes?: string;
}

export const CookedFoodSchema = SchemaFactory.createForClass(CookedFood);