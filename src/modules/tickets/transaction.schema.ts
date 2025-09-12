import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { DatabaseModelNames, PaymentType, TransactionStatus } from 'src/shared/constants';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({
  collection: 'transactions',
  timestamps: true,
})
export class Transaction {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DatabaseModelNames.USER })
  userId: string; // who paid

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DatabaseModelNames.USER })
  cashierId: string; // cashier processing

  @Prop({ required: true, type: mongoose.Schema.Types.Decimal128 })
  amount: number;

  @Prop({ required: true, enum: PaymentType })
  paymentType: string;

  @Prop()
  reference: string; // POS/Bank ref if applicable

  @Prop({ enum: TransactionStatus, default: TransactionStatus.SUCCESS })
  status: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
