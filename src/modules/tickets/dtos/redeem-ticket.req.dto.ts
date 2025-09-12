import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RedeemTicketReqDto {
  @ApiProperty({ 
    description: 'Unique ticket number to redeem', 
    example: 'TKT-2024-001234' 
  })
  @IsNotEmpty()
  @IsString()
  ticketNo: string;
}
