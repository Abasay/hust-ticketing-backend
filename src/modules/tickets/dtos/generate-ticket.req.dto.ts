import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min } from 'class-validator';
import { TicketType, PaymentType } from 'src/shared/constants';

export class GenerateTicketReqDto {
  @ApiProperty({
    description: 'User ID of the customer purchasing the ticket (optional for guest users)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({
    description: 'Type of ticket being generated',
    // enum: TicketType,
    example: TicketType.MEAL,
  })
  @IsNotEmpty()
  // @IsEnum(TicketType)
  ticketType: string;

  @ApiProperty({
    description: 'Amount paid for the ticket',
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

  @ApiProperty({
    description: 'Transaction reference for POS/Bank transfers',
    example: 'TXN123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionReference?: string;
}
