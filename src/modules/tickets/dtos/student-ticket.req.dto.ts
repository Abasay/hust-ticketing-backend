import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, IsArray } from 'class-validator';
import { TicketType, PaymentType } from 'src/shared/constants';

export class StudentTicketReqDto {
  @ApiProperty({
    description: 'Student matric number',
    example: 'MAT/2024/001',
  })
  @IsNotEmpty()
  @IsString()
  matricNumber: string;

  @ApiProperty({
    description: 'Type of ticket being generated',
    example: TicketType.MEAL,
  })
  @IsNotEmpty()
  ticketType: string;

  @ApiProperty({
    description: 'Amount for the ticket',
    example: 500,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentType,
    example: PaymentType.CASH,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: string;

  @ApiProperty({
    description: 'Expiry date for the ticket (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate: string;
}

export class StudentBulkPurchaseReqDto {
  @ApiProperty({
    description: 'Student matric number',
    example: 'MAT/2024/001',
  })
  @IsNotEmpty()
  @IsString()
  matricNumber: string;

  @ApiProperty({
    description: 'Amount to add to wallet',
    example: 5000,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentType,
    example: PaymentType.CASH,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: string;
}

export class StudentWalletTicketReqDto {
  @ApiProperty({
    description: 'Student matric number',
    example: 'MAT/2024/001',
  })
  @IsNotEmpty()
  @IsString()
  matricNumber: string;

  @ApiProperty({
    description: 'Type of ticket being generated',
    example: TicketType.MEAL,
  })
  @IsNotEmpty()
  ticketType: string;

  @ApiProperty({
    description: 'Amount for the ticket',
    example: 500,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Expiry date for the ticket (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate: string;
}