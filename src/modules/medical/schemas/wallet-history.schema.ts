import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type MedicalWalletHistoryDocument = MedicalWalletHistory & Document;

@Schema({ timestamps: true })
export class MedicalWalletHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.STUDENT, required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  balanceBefore: number;

  @Prop({ required: true })
  balanceAfter: number;

  @Prop({ required: true, enum: ['credit', 'debit', 'medical'] })
  transactionType: 'credit' | 'debit' | 'medical';

  @Prop({ required: true })
  reason: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: false })
  createdBy?: Types.ObjectId;

  @Prop({ required: false })
  session?: string; // academic session e.g. 2023/2024
}

export const MedicalWalletHistorySchema = SchemaFactory.createForClass(MedicalWalletHistory);
