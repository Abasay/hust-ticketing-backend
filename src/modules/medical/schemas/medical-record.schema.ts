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

  @Prop({ required: false })
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

  // Medical Record Components - All optional with their own fees
  @Prop({ required: false })
  registrationFee?: number;

  @Prop({ required: false })
  medicalReportFee?: number;

  @Prop({ required: false })
  laboratoryTestFee?: number;

  @Prop({ required: false })
  bedFee?: number;

  @Prop({ required: false })
  consultationFee?: number;

  @Prop({ required: false })
  surgicalProcedureFee?: number;

  @Prop({ required: false })
  medicalProcedureFee?: number;

  @Prop({ required: false })
  admissionFee?: number;

  @Prop({ required: false })
  medicalAndNursingCareFee?: number;

  @Prop({ required: false })
  consumablesFee?: number;

  @Prop({ required: false })
  feedingFee?: number;

  @Prop({ required: false })
  referralFee?: number;

  @Prop({ required: false })
  ambulanceServicesFee?: number;

  @Prop({ required: false })
  othersFee?: number;

  // Total calculation
  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({ required: true, enum: ['paid', 'unpaid'] })
  paymentStatus: 'paid' | 'unpaid';

  @Prop({ required: true })
  walletBalanceAfter: number;

  @Prop({ required: true })
  session: string; // academic session e.g. 2023/2024
}

export const MedicalRecordSchema = SchemaFactory.createForClass(MedicalRecord);
