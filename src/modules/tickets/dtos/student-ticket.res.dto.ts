import { ApiProperty } from '@nestjs/swagger';

export class StudentTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Student ticket generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Generated ticket details',
  })
  ticket: {
    ticketNo: string;
    ticketType: string;
    amount: number;
    paymentType: string;
    expiryDate: string;
    status: string;
    student: {
      _id: string;
      matricNumber: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };
    cashier: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    createdAt: string;
  };
}

export class StudentBulkPurchaseResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Wallet topped up successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated wallet details',
  })
  wallet: {
    matricNumber: string;
    walletBalance: number;
    walletUsed: number;
    availableBalance: number;
  };
}

export class StudentWalletTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Ticket purchased from wallet successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Generated ticket and updated wallet details',
  })
  data: {
    ticket: {
      ticketNo: string;
      ticketType: string;
      amount: number;
      status: string;
      expiryDate: string;
    };
    wallet: {
      walletBalance: number;
      walletUsed: number;
      availableBalance: number;
    };
  };
}