import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { DatabaseModelNames } from 'src/shared/constants';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: DatabaseModelNames.USER, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  walletBalance: number; // total funds available

  @Prop({ required: true, default: 0 })
  walletUsed: number; // total funds consumed

  @Prop({ required: true, default: 0 })
  get availableBalance(): number {
    return this.walletBalance - this.walletUsed;
  }
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);