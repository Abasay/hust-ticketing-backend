import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type TicketDocument = Ticket & Document;

export enum TicketStatus {
  ISSUED = 'ISSUED',
  REDEEMED = 'REDEEMED',
  EXPIRED = 'EXPIRED',
}

@Schema({ timestamps: true })
export class Ticket extends Document {
  @Prop({ required: true, unique: true })
  ticketNo: string; // unique generated code

  @Prop({ type: String, required: true })
  ticketType: string; // e.g., Meal, Water, Snack

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: false })
  customer?: Types.ObjectId; // student/staff - optional for guest users

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: true })
  cashierId: Types.ObjectId; // issued by

  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER })
  redeemedBy?: Types.ObjectId; // redeemed by (formerly vendor)

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: ['POS', 'CASH', 'BANK_TRANSFER', 'WALLET'], required: true })
  paymentType: string;

  @Prop({ enum: TicketStatus, default: TicketStatus.ISSUED })
  status: TicketStatus;

  @Prop()
  expiryDate: Date; // ticket expiry date
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
