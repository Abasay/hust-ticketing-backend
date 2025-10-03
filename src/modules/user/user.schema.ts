import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  student = 'STUDENT',
  staff = 'STAFF',
  cashier = 'CASHIER',
  vendor = 'VENDOR',
  admin = 'ADMIN',
  storeKeeper = 'STORE KEEPER',
}

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: false, default: null, type: String })
  password: string | null; // hash stored

  @Prop({ enum: Object.values(UserRole), default: UserRole.student })
  role: string;

  // for "authorized users" pre-added by admin
  @Prop({ default: false })
  isAuthorized: boolean;

  @Prop({ type: Date, default: null })
  lockedUntil: Date | null;

  @Prop({ type: Number, default: 0 })
  loginAttempts: number;

  @Prop({ unique: true, sparse: true })
  matricNumber?: string; // for students

  @Prop({ unique: true, sparse: true })
  staffId?: string; // for staff

  @Prop({ unique: false, sparse: true })
  staffLevel?: string;

  @Prop({ unique: false, sparse: true })
  staffDepartment?: string;

  @Prop({ default: false })
  isAccountLocked: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
