import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type MedicalWalletDocument = MedicalWallet & Document;

@Schema({ timestamps: true })
export class MedicalWallet extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.STUDENT, required: true, unique: true })
  studentId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  balance: number;

  @Prop({ required: true, default: () => new Date() })
  lastUpdated: Date;
}

export const MedicalWalletSchema = SchemaFactory.createForClass(MedicalWallet);
