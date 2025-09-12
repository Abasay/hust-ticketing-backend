import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User ID', example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'User email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'User role', example: 'STUDENT' })
  role: string;
}

export class TicketDto {
  @ApiProperty({ description: 'Ticket ID', example: '507f1f77bcf86cd799439014' })
  _id: string;

  @ApiProperty({ description: 'Unique ticket number', example: 'TKT-2024-001234' })
  ticketNo: string;

  @ApiProperty({ description: 'Ticket type', example: 'MEAL' })
  ticketType: string;

  @ApiProperty({ description: 'Ticket amount', example: 500 })
  amount: number;

  @ApiProperty({ description: 'Payment type', example: 'CASH' })
  paymentType: string;

  @ApiProperty({ description: 'Ticket status', example: 'ISSUED' })
  status: string;

  @ApiProperty({ description: 'Ticket expiry date', example: '2024-12-31T23:59:59.000Z' })
  expiryDate: string;

  @ApiProperty({
    description: 'Customer details (null for walk-in customers)',
    type: UserDto,
    nullable: true,
    example: {
      _id: '507f1f77bcf86cd799439011',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'STUDENT',
    },
  })
  userId: UserDto | string;

  @ApiProperty({ description: 'Cashier details', type: UserDto })
  cashierId: UserDto;

  @ApiProperty({
    description: 'User who redeemed the ticket (formerly vendor)',
    type: UserDto,
    nullable: true,
    required: false,
  })
  redeemedBy?: UserDto | null;

  // @ApiProperty({ description: 'Transaction ID', example: '507f1f77bcf86cd799439015' })
  // transactionId: string;

  @ApiProperty({ description: 'Ticket creation date', example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Ticket last update date', example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

export class TicketListResDto {
  @ApiProperty({ description: 'Success message', example: 'Tickets retrieved successfully' })
  message: string;

  @ApiProperty({ description: 'Paginated ticket data' })
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
