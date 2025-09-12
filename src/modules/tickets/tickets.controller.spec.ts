import { Test, TestingModule } from '@nestjs/testing';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole, TicketStatus } from 'src/shared/constants';

describe('TicketsController', () => {
  let controller: TicketsController;
  let service: jest.Mocked<TicketsService>;

  const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.CASHIER,
  };

  const mockTicketResponse = {
    message: 'Ticket generated successfully',
    ticket: {
      ticketNo: 'TKT-2024-001234',
      ticketType: 'MEAL',
      amount: 500,
      paymentType: 'CASH',
      expiryDate: '2024-12-31T23:59:59.000Z',
      status: 'ISSUED',
      customer: {
        _id: 'customer123',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
      },
      cashier: {
        _id: 'cashier123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      createdAt: '2024-01-15T10:30:00.000Z',
    },
  };

  beforeEach(async () => {
    const mockService = {
      generateTicket: jest.fn(),
      redeemTicket: jest.fn(),
      deleteTicket: jest.fn(),
      getUserTickets: jest.fn(),
      getTicketStats: jest.fn(),
      getAdminTicketStats: jest.fn(),
      getAdminTicketLogs: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [
        {
          provide: TicketsService,
          useValue: mockService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtUserAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<TicketsController>(TicketsController);
    service = module.get(TicketsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('generateTicket', () => {
    const generateTicketDto = {
      userId: 'customer123',
      ticketType: 'MEAL',
      amount: 500,
      paymentType: 'CASH',
      expiryDate: '2024-12-31T23:59:59.000Z',
    };

    it('should generate a ticket successfully', async () => {
      service.generateTicket.mockResolvedValue(mockTicketResponse);

      const result = await controller.generateTicket(generateTicketDto, mockUser);

      expect(service.generateTicket).toHaveBeenCalledWith(generateTicketDto, 'user123');
      expect(result).toEqual(mockTicketResponse);
    });
  });

  describe('redeemTicket', () => {
    const redeemTicketDto = {
      ticketNo: 'TKT-2024-001234',
    };

    const mockRedeemResponse = {
      message: 'Ticket redeemed successfully',
      ticket: {
        ticketNo: 'TKT-2024-001234',
        ticketType: 'MEAL',
        amount: 500,
        status: 'REDEEMED',
        customer: {
          _id: 'customer123',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        },
        redeemedBy: {
          _id: 'vendor123',
          firstName: 'Mike',
          lastName: 'Johnson',
          email: 'mike@example.com',
        },
        redeemedAt: '2024-01-15T12:30:00.000Z',
      },
    };

    it('should redeem a ticket successfully', async () => {
      service.redeemTicket.mockResolvedValue(mockRedeemResponse);

      const result = await controller.redeemTicket(redeemTicketDto, mockUser);

      expect(service.redeemTicket).toHaveBeenCalledWith(redeemTicketDto, 'user123');
      expect(result).toEqual(mockRedeemResponse);
    });
  });

  describe('deleteTicket', () => {
    const mockDeleteResponse = {
      message: 'Ticket deleted successfully',
      ticketNo: 'TKT-2024-001234',
    };

    it('should delete a ticket successfully', async () => {
      service.deleteTicket.mockResolvedValue(mockDeleteResponse);

      const result = await controller.deleteTicket('ticket123', mockUser);

      expect(service.deleteTicket).toHaveBeenCalledWith('ticket123', 'user123');
      expect(result).toEqual(mockDeleteResponse);
    });
  });

  describe('getUserTickets', () => {
    const filterDto = {
      page: 1,
      limit: 10,
      status: TicketStatus.ISSUED,
    };

    const mockTicketsResponse = {
      message: 'Tickets retrieved successfully',
      data: {
        tickets: [
          {
            _id: 'ticket123',
            ticketNo: 'TKT-2024-001234',
            ticketType: 'MEAL',
            amount: 500,
            paymentType: 'CASH',
            status: 'ISSUED',
            expiryDate: '2024-12-31T23:59:59.000Z',
            userId: {
              _id: 'user123',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john@example.com',
              role: 'STUDENT',
            },
            cashierId: {
              _id: 'cashier123',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane@example.com',
              role: 'CASHIER',
            },
            transactionId: 'transaction123',
            createdAt: '2024-01-15T10:30:00.000Z',
            updatedAt: '2024-01-15T10:30:00.000Z',
          },
        ],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should get user tickets successfully', async () => {
      service.getUserTickets.mockResolvedValue(mockTicketsResponse);

      const result = await controller.getUserTickets(filterDto, mockUser);

      expect(service.getUserTickets).toHaveBeenCalledWith('user123', filterDto);
      expect(result).toEqual(mockTicketsResponse);
    });
  });

  describe('getTicketStats', () => {
    const mockStatsResponse = {
      message: 'Ticket statistics retrieved successfully',
      stats: {
        issued: 5,
        redeemed: 3,
        expired: 2,
        pending: 4,
        total: 10,
      },
    };

    it('should get ticket statistics successfully', async () => {
      service.getTicketStats.mockResolvedValue(mockStatsResponse);

      const result = await controller.getTicketStats(mockUser);

      expect(service.getTicketStats).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockStatsResponse);
    });
  });

  describe('getAdminTicketLogs', () => {
    const filterDto = {
      page: 1,
      limit: 10,
    };

    const mockLogsResponse = {
      message: 'Admin ticket logs retrieved successfully',
      data: {
        tickets: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };

    it('should get admin ticket logs successfully', async () => {
      service.getAdminTicketLogs.mockResolvedValue(mockLogsResponse);

      const result = await controller.getAdminTicketLogs(filterDto);

      expect(service.getAdminTicketLogs).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockLogsResponse);
    });
  });

  describe('getAdminTicketStats', () => {
    const mockAdminStatsResponse = {
      message: 'Admin ticket statistics retrieved successfully',
      stats: {
        issued: 10,
        redeemed: 5,
        expired: 2,
        pending: 8,
        total: 17,
        totalRevenue: 2500,
        revenueByPaymentType: {
          CASH: 1500,
          POS: 1000,
        },
        ticketsByType: {
          MEAL: 12,
          WATER: 5,
        },
      },
    };

    it('should get admin ticket statistics successfully', async () => {
      service.getAdminTicketStats.mockResolvedValue(mockAdminStatsResponse);

      const result = await controller.getAdminTicketStats();

      expect(service.getAdminTicketStats).toHaveBeenCalled();
      expect(result).toEqual(mockAdminStatsResponse);
    });
  });
});
