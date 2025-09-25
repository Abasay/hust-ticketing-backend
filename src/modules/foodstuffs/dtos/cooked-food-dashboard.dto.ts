import { ApiProperty } from '@nestjs/swagger';

export class CookedFoodDashboardStatsDto {
  @ApiProperty({ description: 'Total number of cooked foods' })
  totalCookedFoods: number;

  @ApiProperty({ description: 'Number of low stock items' })
  lowStockItems: number;

  @ApiProperty({ description: 'Total inventory value' })
  totalValue: number;

  @ApiProperty({ description: 'Recent preparations count (last 30 days)' })
  recentPreparations: number;

  @ApiProperty({ description: 'Recent sales count (last 30 days)' })
  recentSales: number;

  @ApiProperty({ description: 'Recent wastage count (last 30 days)' })
  recentWastage: number;

  @ApiProperty({ description: 'Monthly revenue amount' })
  monthlyRevenue: number;

  @ApiProperty({ description: 'Pending requisitions count' })
  pendingRequisitions: number;
}

export class CookedFoodStockAlertDto {
  @ApiProperty({ description: 'Cooked food information' })
  cookedFood: {
    _id: string;
    cookedFoodNameId: any;
    preparedQuantityKg: number;
    soldQuantityKg: number;
    leftoverQuantityKg: number;
    preparationDate: Date;
  };

  @ApiProperty({ description: 'Alert level', enum: ['low', 'critical'] })
  alertLevel: string;

  @ApiProperty({ description: 'Recommended action' })
  recommendedAction: string;
}

export class CookedFoodDashboardResDto {
  @ApiProperty({ description: 'Success message' })
  message: string;

  @ApiProperty({ description: 'Dashboard data' })
  data: {
    stats: CookedFoodDashboardStatsDto;
    stockAlerts: CookedFoodStockAlertDto[];
    recentActivities: any[];
    recentRequisitions: any[];
    monthlyRevenueByFood: Array<{
      cookedFoodName: string;
      totalRevenue: number;
    }>;
  };
}
