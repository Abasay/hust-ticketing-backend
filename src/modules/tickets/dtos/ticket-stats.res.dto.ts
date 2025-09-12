import { ApiProperty } from '@nestjs/swagger';

export class TicketStatsDto {
  @ApiProperty({ description: 'Number of issued tickets', example: 150 })
  issued: number;

  @ApiProperty({ description: 'Number of redeemed tickets', example: 120 })
  redeemed: number;

  @ApiProperty({ description: 'Number of expired tickets', example: 25 })
  expired: number;

  @ApiProperty({ description: 'Number of pending/active tickets', example: 5 })
  pending: number;

  @ApiProperty({ description: 'Total number of tickets', example: 300 })
  total: number;
}

export class TicketStatsResDto {
  @ApiProperty({ description: 'Success message', example: 'Ticket statistics retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Ticket statistics', type: TicketStatsDto })
  stats: TicketStatsDto;
}

export class AdminTicketStatsDto extends TicketStatsDto {
  @ApiProperty({ description: 'Total revenue from tickets', example: 75000 })
  totalRevenue: number;

  @ApiProperty({ 
    description: 'Revenue breakdown by payment type',
    example: {
      CASH: 30000,
      POS: 25000,
      BANK_TRANSFER: 15000,
      WALLET: 5000
    }
  })
  revenueByPaymentType: Record<string, number>;

  @ApiProperty({ 
    description: 'Ticket count breakdown by type',
    example: {
      MEAL: 200,
      WATER: 80,
      SNACK: 15,
      OTHER: 5
    }
  })
  ticketsByType: Record<string, number>;
}

export class AdminTicketStatsResDto {
  @ApiProperty({ description: 'Success message', example: 'Admin ticket statistics retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Comprehensive ticket statistics', type: AdminTicketStatsDto })
  stats: AdminTicketStatsDto;
}
