import { ApiProperty } from '@nestjs/swagger';

export class CashierIssuedStatsDto {
  @ApiProperty({ description: 'Number of tickets issued by cashier', example: 125 })
  ticketsIssued: number;

  @ApiProperty({ description: 'Total amount of all issued tickets', example: 2500000 })
  totalAmount: number;

  @ApiProperty({ description: 'Average ticket amount', example: 20000 })
  averageAmount: number;

  @ApiProperty({ description: 'Number of tickets issued by cashier', example: 125 })
  redeemedTickets: number;

  @ApiProperty({ description: 'Total amount of all redeemed tickets', example: 2500000 })
  totalRedeemedAmount: number;

  @ApiProperty({ description: 'Average ticket amount', example: 20000 })
  averageRedeemedAmount: number;
}

export class CashierIssuedStatsResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Cashier issued tickets statistics retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Cashier issued tickets statistics',
    type: CashierIssuedStatsDto,
  })
  stats: CashierIssuedStatsDto;
}
