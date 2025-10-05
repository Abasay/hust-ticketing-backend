import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, ValidateNested } from 'class-validator';
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

  // @ApiProperty()
  // @IsNotEmpty()
  // @IsNumber()
  // price: number;
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
  phone: string;
}

export class CreateOrderDto {
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
}
