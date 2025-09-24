import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ description: 'Total number of foodstuffs' })
  totalFoodstuffs: number;

  @ApiProperty({ description: 'Number of low stock items' })
  lowStockItems: number;

  @ApiProperty({ description: 'Total inventory value' })
  totalValue: number;

  @ApiProperty({ description: 'Recent purchases count (last 30 days)' })
  recentPurchases: number;

  @ApiProperty({ description: 'Recent usage count (last 30 days)' })
  recentUsage: number;

  @ApiProperty({ description: 'Recent wastage count (last 30 days)' })
  recentWastage: number;

  @ApiProperty({ description: 'Monthly spending amount' })
  monthlySpending: number;
}

export class StockAlertDto {
  @ApiProperty({ description: 'Foodstuff information' })
  foodstuff: {
    _id: string;
    name: string;
    currentQuantity: number;
    unit: string;
  };

  @ApiProperty({ description: 'Alert level', enum: ['low', 'critical'] })
  alertLevel: string;

  @ApiProperty({ description: 'Recommended action' })
  recommendedAction: string;
}

export class DashboardResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Dashboard data' })
  data: {
    stats: DashboardStatsDto;
    stockAlerts: StockAlertDto[];
    recentActivities: any[];
    monthlySpendingByFoodstuff: Array<{
      foodstuffName: string;
      totalSpent: number;
    }>;
  };
}