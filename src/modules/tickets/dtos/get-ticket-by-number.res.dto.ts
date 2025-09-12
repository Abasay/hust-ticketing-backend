import { ApiProperty } from '@nestjs/swagger';
import { TicketDto } from './ticket.dto';

export class GetTicketByNumberResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Ticket retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Ticket details',
    type: TicketDto,
  })
  ticket: TicketDto;
}
