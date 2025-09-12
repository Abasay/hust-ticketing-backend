import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total revenue', example: 2450000 })
  totalRevenue: number;

  @ApiProperty({ description: 'Revenue change percentage from last month', example: 12.5 })
  revenueChangePercent: number;

  @ApiProperty({ description: 'Total tickets sold', example: 1234 })
  ticketsSold: number;

  @ApiProperty({ description: 'Tickets sold change percentage from last month', example: 8.2 })
  ticketsSoldChangePercent: number;

  @ApiProperty({ description: 'Total active users', example: 567 })
  activeUsers: number;

  @ApiProperty({ description: 'Active users change percentage from last month', example: -2.1 })
  activeUsersChangePercent: number;

  @ApiProperty({ description: 'Average order value', example: 45000 })
  avgOrderValue: number;

  @ApiProperty({ description: 'Average order value change percentage from last month', example: 5.4 })
  avgOrderValueChangePercent: number;
}

export class DailyTransactionDto {
  @ApiProperty({ description: 'Transaction date', example: '2025-03-01' })
  date: string;

  @ApiProperty({ description: 'Cashier name', example: 'Tran Thi Mai' })
  cashierName: string;

  @ApiProperty({ description: 'Total amount for the day', example: 180000 })
  totalAmount: number;

  @ApiProperty({ description: 'Number of tickets sold', example: 45 })
  ticketCount: number;
}

export class DashboardResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Dashboard statistics retrieved successfully',
  })
  message: string;

  @ApiProperty({ description: 'Dashboard statistics', type: DashboardStatsDto })
  stats: DashboardStatsDto;

  @ApiProperty({ 
    description: 'Recent daily transactions', 
    type: [DailyTransactionDto],
    example: [
      {
        date: '2025-03-01',
        cashierName: 'Tran Thi Mai',
        totalAmount: 180000,
        ticketCount: 45
      }
    ]
  })
  dailyTransactions: DailyTransactionDto[];
}
