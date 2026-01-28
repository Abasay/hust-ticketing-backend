import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional, IsMongoId, IsNumber } from 'class-validator';

export class CreateMedicalRecordDto {
  @IsNotEmpty()
  @IsMongoId()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  illnessOrReason: string;

  @IsOptional()
  @IsDateString()
  dateTime?: string;

  // Medical Record Fee Components - All optional
  @IsOptional()
  @IsNumber()
  registrationFee?: number;

  @IsOptional()
  @IsNumber()
  medicalReportFee?: number;

  @IsOptional()
  @IsNumber()
  laboratoryTestFee?: number;

  @IsOptional()
  @IsNumber()
  bedFee?: number;

  @IsOptional()
  @IsNumber()
  consultationFee?: number;

  @IsOptional()
  @IsNumber()
  surgicalProcedureFee?: number;

  @IsOptional()
  @IsNumber()
  medicalProcedureFee?: number;

  @IsOptional()
  @IsNumber()
  admissionFee?: number;

  @IsOptional()
  @IsNumber()
  medicalAndNursingCareFee?: number;

  @IsOptional()
  @IsNumber()
  consumablesFee?: number;

  @IsOptional()
  @IsNumber()
  feedingFee?: number;

  @IsOptional()
  @IsNumber()
  referralFee?: number;

  @IsOptional()
  @IsNumber()
  ambulanceServicesFee?: number;

  @IsOptional()
  @IsNumber()
  othersFee?: number;

  // Other optional fields
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
