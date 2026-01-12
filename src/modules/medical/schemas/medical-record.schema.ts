import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type MedicalRecordDocument = MedicalRecord & Document;

@Schema({ timestamps: true })
export class MedicalRecord extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.STUDENT, required: true })
  studentId: Types.ObjectId;

  @Prop({ required: true })
  illnessOrReason: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  dateTime: Date;

  @Prop({ type: [String], default: [] })
  medicinesPrescribed?: string[];

  @Prop({ type: [String], default: [] })
  injectionsReceived?: string[];

  @Prop({ required: false })
  diagnosis?: string;

  @Prop({ required: false })
  prescribedBy?: string;

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: true, enum: ['paid', 'unpaid'] })
  paymentStatus: 'paid' | 'unpaid';

  @Prop({ required: true })
  walletBalanceAfter: number;

  @Prop({ required: true })
  session: string; // academic session e.g. 2023/2024
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);
