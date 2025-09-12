import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customer: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  cashier: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticket: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['POS', 'Cash', 'Transfer'], required: true })
  paymentType: string;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
