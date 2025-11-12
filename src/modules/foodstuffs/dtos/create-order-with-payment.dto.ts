import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Types } from 'mongoose';

class OrderItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  itemId: Types.ObjectId;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  quantity: number;
}

class User {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone?: string;
}

export class CreateOrderWithPaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  user?: User;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'ref_1234567890', description: 'Paystack payment reference' })
  @IsNotEmpty()
  @IsString()
  paymentReference: string;

  @ApiProperty({ example: '2024-12-31T23:59:59.000Z', description: 'Ticket expiry date' })
  @IsNotEmpty()
  @IsDateString()
  expiryDate: string;

  @ApiProperty({ example: 'MEAL', description: 'Type of ticket to generate', required: false })
  @IsOptional()
  @IsString()
  ticketType?: string;
}
