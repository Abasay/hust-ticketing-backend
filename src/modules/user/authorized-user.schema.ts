import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { DatabaseModelNames, UserRole } from 'src/shared/constants';

export type AuthorizedUserDocument = HydratedDocument<AuthorizedUser>;

@Schema({
  collection: 'authorized_users',
  timestamps: true,
})
export class AuthorizedUser {
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: true, enum: UserRole })
  accountType: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: DatabaseModelNames.USER })
  addedBy: string;
}

export const AuthorizedUserSchema = SchemaFactory.createForClass(AuthorizedUser);
