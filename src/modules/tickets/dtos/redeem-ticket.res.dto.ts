import { ApiProperty } from '@nestjs/swagger';

export class RedeemTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Ticket redeemed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Redeemed ticket details',
    example: {
      ticketNo: 'TKT-2024-001234',
      ticketType: 'MEAL',
      amount: 500,
      status: 'REDEEMED',
      customer: 'Walk-in Customer', // Can be user object or 'Walk-in Customer' string
      redeemedBy: {
        _id: '507f1f77bcf86cd799439013',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.johnson@example.com',
      },
      redeemedAt: '2024-01-15T12:30:00.000Z',
    },
  })
  ticket: {
    ticketNo: string;
    ticketType: string;
    amount: number;
    status: string;
    customer:
      | {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        }
      | string; // Can be user object or 'Walk-in Customer' string
    redeemedBy: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    redeemedAt: string;
  };
}
