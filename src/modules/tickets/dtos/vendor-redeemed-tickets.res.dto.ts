import { ApiProperty } from '@nestjs/swagger';
import { TicketDto } from './ticket.dto';

export class VendorRedeemedTicketsResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Vendor redeemed tickets retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Paginated tickets data',
  })
  data: {
    tickets: TicketDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
