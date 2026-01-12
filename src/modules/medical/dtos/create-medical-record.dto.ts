import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional, IsMongoId, IsNumber } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  illnessOrReason: string;

  @IsNumber()
  amount: number;

  @IsDateString()
  dateTime: string;

  @IsOptional()
  @IsString()
  session?: string;

  @IsOptional()
  @IsArray()
  medicinesPrescribed?: string[];

  @IsOptional()
  @IsArray()
  injectionsReceived?: string[];

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  prescribedBy?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
