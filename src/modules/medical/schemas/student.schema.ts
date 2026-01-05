import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student extends Document {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: ['Male', 'Female'] })
  sex: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  faculty: string;

  @Prop({ required: false, unique: true, sparse: true })
  matricNo?: string;

  @Prop({ required: false })
  temporaryMatricNo?: string;

  @Prop({ required: false, unique: true, sparse: true })
  email?: string;

  @Prop({ required: false })
  phoneNumber?: string;

  @Prop({ required: false })
  dateOfBirth?: string;

  @Prop({ required: false })
  bloodGroup?: string;

  @Prop({ required: false })
  genotype?: string;

  @Prop({ required: false, type: [String] })
  allergies?: string[];

  @Prop({ required: false })
  emergencyContactName?: string;

  @Prop({ required: false })
  emergencyContactPhone?: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
