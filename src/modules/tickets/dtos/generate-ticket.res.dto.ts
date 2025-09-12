import { ApiProperty } from '@nestjs/swagger';

export class GenerateTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Ticket generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Generated ticket details',
    example: {
      ticketNo: 'TKT-2024-001234',
      ticketType: 'MEAL',
      amount: 500,
      paymentType: 'CASH',
      expiryDate: '2024-12-31T23:59:59.000Z',
      status: 'ISSUED',
      customer: 'Walk-in Customer', // Can be either user object or 'Walk-in Customer' string
      cashier: {
        _id: '507f1f77bcf86cd799439012',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
      },
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  })
  ticket: {
    ticketNo: string;
    ticketType: string;
    amount: number;
    paymentType: string;
    expiryDate: string;
    status: string;
    customer:
      | {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
        }
      | string; // Can be user object or 'Walk-in Customer' string
    cashier: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    createdAt: string;
  };
}
