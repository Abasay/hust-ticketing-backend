import { ApiProperty } from '@nestjs/swagger';

export class VendorRedeemedStatsDto {
  @ApiProperty({ description: 'Number of tickets redeemed by vendor', example: 89 })
  ticketsRedeemed: number;

  @ApiProperty({ description: 'Total amount of all redeemed tickets', example: 1780000 })
  totalAmount: number;

  @ApiProperty({ description: 'Average redeemed ticket amount', example: 20000 })
  averageAmount: number;
}

export class VendorRedeemedStatsResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Vendor redeemed tickets statistics retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Vendor redeemed tickets statistics',
    type: VendorRedeemedStatsDto,
  })
  stats: VendorRedeemedStatsDto;
}
