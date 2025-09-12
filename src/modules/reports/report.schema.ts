import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReportDocument = Report & Document;

@Schema({ timestamps: true })
export class Report {
  @Prop({ required: true })
  date: Date;

  @Prop()
  totalTickets: number;

  @Prop()
  totalRedeemed: number;

  @Prop()
  totalRevenue: number;

  @Prop({ type: Object }) // breakdown { POS: xx, Cash: yy, Transfer: zz }
  channelTotals: Record<string, number>;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
