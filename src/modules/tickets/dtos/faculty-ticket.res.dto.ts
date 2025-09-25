import { ApiProperty } from '@nestjs/swagger';

export class FacultyTicketResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Faculty tickets generated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Generated tickets details',
  })
  data: {
    totalTickets: number;
    amountPerTicket: number;
    tickets: Array<{
      ticketNo: string;
      ticketType: string;
      amount: number;
      paymentType: string;
      expiryDate: string;
      status: string;
      staff: {
        _id: string;
        staffId: string;
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
    }>;
  };
}

export class GetStaffTicketsResDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Staff tickets retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Staff tickets for printing',
  })
  data: {
    staffId: string;
    staffName?: string;
    tickets: Array<{
      ticketNo: string;
      ticketType: string;
      amount: number;
      status: string;
      expiryDate: string;
      createdAt: string;
    }>;
  };
}