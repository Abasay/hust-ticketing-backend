import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, IsArray } from 'class-validator';
import { TicketType, PaymentType } from 'src/shared/constants';

export class FacultyTicketReqDto {
  @ApiProperty({
    description: 'Array of staff IDs',
    example: ['STAFF001', 'STAFF002', 'STAFF003'],
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  staffIds: string[];

  @ApiProperty({
    description: 'Type of ticket being generated',
    example: TicketType.MEAL,
  })
  @IsNotEmpty()
  ticketType: string;

  @ApiProperty({
    description: 'Total amount to be divided among staff',
    example: 1500,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiProperty({
    description: 'Payment method used',
    enum: PaymentType,
    example: PaymentType.CASH,
  })
  @IsNotEmpty()
  @IsEnum(PaymentType)
  paymentType: string;

  @ApiProperty({
    description: 'Expiry date for the tickets (ISO string)',
    example: '2024-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  expiryDate: string;
}

export class GetStaffTicketsReqDto {
  @ApiProperty({
    description: 'Staff ID to get tickets for',
    example: 'STAFF001',
  })
  @IsNotEmpty()
  @IsString()
  staffId: string;
}