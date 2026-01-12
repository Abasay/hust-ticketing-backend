import { IsNumber, IsIn, IsString, IsOptional } from 'class-validator';

export class UpdateWalletDto {
  @IsNumber()
  amount: number;

  @IsString()
  reason: string;

  @IsString()
  @IsIn(['credit', 'debit'])
  transactionType: 'credit' | 'debit';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  session?: string; // optional override for academic session
}
