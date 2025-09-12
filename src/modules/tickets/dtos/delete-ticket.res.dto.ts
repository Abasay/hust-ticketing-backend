import { ApiProperty } from '@nestjs/swagger';

export class DeleteTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Ticket deleted successfully'
  })
  message: string;

  @ApiProperty({
    description: 'Deleted ticket number',
    example: 'TKT-2024-001234'
  })
  ticketNo: string;
}
