import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { DatabaseModelNames, RedemptionStatus } from 'src/shared/constants';

export type RedemptionDocument = HydratedDocument<Redemption>;

@Schema({
  collection: 'redemptions',
  timestamps: { createdAt: 'redeemedAt', updatedAt: false },
})
export class Redemption {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DatabaseModelNames.TICKET })
  ticketId: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DatabaseModelNames.USER })
  vendorId: string; // vendor staff

  @Prop({ required: true, enum: RedemptionStatus })
  status: string;

  redeemedAt: Date;
}

export const RedemptionSchema = SchemaFactory.createForClass(Redemption);
