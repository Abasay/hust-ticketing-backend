import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type FoodstuffRequisitionDocument = FoodstuffRequisition & Document;

export enum RequisitionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  FULFILLED = 'fulfilled',
}

export enum RequisitionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class FoodstuffRequisition extends Document {
  @Prop({ required: true, unique: true })
  requisitionNumber: string;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.COOKED_FOOD_NAME, required: true })
  cookedFoodNameId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: true })
  requestedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER })
  approvedBy?: Types.ObjectId;

  @Prop({ required: true, enum: Object.values(RequisitionStatus), default: RequisitionStatus.PENDING })
  status: string;

  @Prop({ required: true, enum: Object.values(RequisitionPriority), default: RequisitionPriority.MEDIUM })
  priority: string;

  @Prop({ required: true, type: Date })
  requiredDate: Date;

  @Prop({ trim: true })
  notes?: string;

  @Prop({ trim: true })
  rejectionReason?: string;

  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date })
  fulfilledAt?: Date;

  @Prop([{
    foodstuffId: { type: Types.ObjectId, ref: DatabaseModelNames.FOODSTUFF, required: true },
    requestedQuantity: { type: Number, required: true, min: 0 },
    approvedQuantity: { type: Number, min: 0 },
    fulfilledQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, required: true },
    notes: { type: String, trim: true },
  }])
  items: Array<{
    foodstuffId: Types.ObjectId;
    requestedQuantity: number;
    approvedQuantity?: number;
    fulfilledQuantity: number;
    unit: string;
    notes?: string;
  }>;
}

export const FoodstuffRequisitionSchema = SchemaFactory.createForClass(FoodstuffRequisition);