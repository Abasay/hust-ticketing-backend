import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, IsArray } from 'class-validator';
import { TicketType, PaymentType } from 'src/shared/constants';

export class StaffDetail {
  @ApiProperty({
    description: 'Staff ID',
    example: 'STAFF001',
  })
  @IsNotEmpty()
  @IsString()
  staffId: string;

  @ApiProperty({
    description: 'First Name of the staff',
    example: 'John',
  })
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last Name of the staff',
    example: 'Doe',
  })
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  department: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  staffLevel: string;
}

export class FacultyTicketReqDto {
  @ApiProperty({
    description: 'Array of staff IDs',
    example: ['STAFF001', 'STAFF002', 'STAFF003'],
    type: [StaffDetail],
  })
  @IsNotEmpty()
  @IsArray()
  staffIds: StaffDetail[];

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

  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  order: string;
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
