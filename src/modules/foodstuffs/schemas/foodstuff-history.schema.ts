import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type FoodstuffHistoryDocument = FoodstuffHistory & Document;

export enum ActionType {
  PURCHASE = 'purchase',
  USAGE = 'usage',
  WASTAGE = 'wastage',
  CORRECTION = 'correction',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class FoodstuffHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.FOODSTUFF, required: true })
  foodstuffId: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(ActionType) })
  actionType: string;

  @Prop({ required: true, type: Number })
  quantityChanged: number;

  @Prop({ type: Number, min: 0 })
  unitCost?: number;

  @Prop({ type: Number, min: 0 })
  totalCost?: number;

  @Prop({ required: true, trim: true })
  reason: string;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: true })
  doneBy: Types.ObjectId;

  // New field: Link to cooked food name for USAGE activities
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.COOKED_FOOD_NAME })
  cookedFoodNameId?: Types.ObjectId;

  // New field: Link to requisition if this activity fulfills a requisition
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.FOODSTUFF_REQUISITION })
  requisitionId?: Types.ObjectId;
}

export const FoodstuffHistorySchema = SchemaFactory.createForClass(FoodstuffHistory);
