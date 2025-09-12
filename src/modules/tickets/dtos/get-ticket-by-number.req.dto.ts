import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class GetTicketByNumberReqDto {
  @ApiProperty({
    description: 'Ticket number to search for',
    example: 'TKT-2025-9584823012',
  })
  @IsString()
  @IsNotEmpty()
  ticketNo: string;
}
