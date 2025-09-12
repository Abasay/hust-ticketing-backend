import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums';
import { TicketStatus, UserRole, TransactionStatus, RedemptionStatus } from 'src/shared/constants';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketRepository: jest.Mocked<BaseRepository<any>>;
  let userRepository: jest.Mocked<BaseRepository<any>>;
  let transactionRepository: jest.Mocked<BaseRepository<any>>;
  let redemptionRepository: jest.Mocked<BaseRepository<any>>;

  const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.STUDENT,
  };

  const mockCashier = {
    _id: 'cashier123',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    role: UserRole.CASHIER,
  };

  const mockVendor = {
    _id: 'vendor123',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@example.com',
    role: UserRole.VENDOR,
  };

  const mockTicket = {
    _id: 'ticket123',
    ticketNo: 'TKT-2024-001234',
    userId: 'user123',
    cashierId: 'cashier123',
    transactionId: 'transaction123',
    ticketType: 'MEAL',
    amount: 500,
    paymentType: 'CASH',
    expiryDate: new Date('2024-12-31'),
    status: TicketStatus.ISSUED,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      findAllAndPopulate: jest.fn(),
      findOneAndPopulate: jest.fn(),
      findOneAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        {
          provide: Repositories.TicketRepository,
          useValue: mockRepository,
        },
        {
          provide: Repositories.UserRepository,
          useValue: mockRepository,
        },
        {
          provide: Repositories.TransactionRepository,
          useValue: mockRepository,
        },
        {
          provide: Repositories.RedemptionRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TicketsService>(TicketsService);
    ticketRepository = module.get(Repositories.TicketRepository);
    userRepository = module.get(Repositories.UserRepository);
    transactionRepository = module.get(Repositories.TransactionRepository);
    redemptionRepository = module.get(Repositories.RedemptionRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateTicket', () => {
    const generateTicketDto = {
      userId: 'user123',
      ticketType: 'MEAL',
      amount: 500,
      paymentType: 'CASH',
      expiryDate: '2024-12-31T23:59:59.000Z',
      transactionReference: 'REF123',
    };

    it('should generate a ticket successfully', async () => {
      userRepository.findById.mockResolvedValueOnce(mockUser);
      userRepository.findById.mockResolvedValueOnce(mockCashier);
      transactionRepository.create.mockResolvedValue({ _id: 'transaction123' });
      ticketRepository.findOne.mockResolvedValue(null); // No existing ticket
      ticketRepository.create.mockResolvedValue(mockTicket);
      ticketRepository.findOneAndPopulate.mockResolvedValue({
        ...mockTicket,
        userId: mockUser,
        cashierId: mockCashier,
      });

      const result = await service.generateTicket(generateTicketDto, 'cashier123');

      expect(result.message).toBe('Ticket generated successfully');
      expect(result.ticket.ticketNo).toBeDefined();
      expect(result.ticket.customer.firstName).toBe('John');
      expect(result.ticket.cashier.firstName).toBe('Jane');
    });

    it('should throw NotFoundException if customer not found', async () => {
      userRepository.findById.mockResolvedValueOnce(null);

      await expect(service.generateTicket(generateTicketDto, 'cashier123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if cashier is not authorized', async () => {
      userRepository.findById.mockResolvedValueOnce(mockUser);
      userRepository.findById.mockResolvedValueOnce({ ...mockCashier, role: UserRole.STUDENT });

      await expect(service.generateTicket(generateTicketDto, 'cashier123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('redeemTicket', () => {
    const redeemTicketDto = {
      ticketNo: 'TKT-2024-001234',
    };

    it('should redeem a ticket successfully', async () => {
      userRepository.findById.mockResolvedValue(mockVendor);
      ticketRepository.findOneAndPopulate.mockResolvedValue({
        ...mockTicket,
        expiryDate: new Date('2025-12-31'), // Future date
        userId: mockUser,
      });
      ticketRepository.findOneAndUpdate.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.REDEEMED,
      });
      redemptionRepository.create.mockResolvedValue({});
      userRepository.findById.mockResolvedValue(mockVendor);

      const result = await service.redeemTicket(redeemTicketDto, 'vendor123');

      expect(result.message).toBe('Ticket redeemed successfully');
      expect(result.ticket.status).toBe(TicketStatus.REDEEMED);
      expect(result.ticket.vendor.firstName).toBe('Mike');
    });

    it('should throw NotFoundException if ticket not found', async () => {
      userRepository.findById.mockResolvedValue(mockVendor);
      ticketRepository.findOneAndPopulate.mockResolvedValue(null);

      await expect(service.redeemTicket(redeemTicketDto, 'vendor123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if ticket already redeemed', async () => {
      userRepository.findById.mockResolvedValue(mockVendor);
      ticketRepository.findOneAndPopulate.mockResolvedValue({
        ...mockTicket,
        status: TicketStatus.REDEEMED,
        userId: mockUser,
      });

      await expect(service.redeemTicket(redeemTicketDto, 'vendor123')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if ticket expired', async () => {
      userRepository.findById.mockResolvedValue(mockVendor);
      ticketRepository.findOneAndPopulate.mockResolvedValue({
        ...mockTicket,
        expiryDate: new Date('2020-01-01'),
        userId: mockUser,
      });

      await expect(service.redeemTicket(redeemTicketDto, 'vendor123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket successfully', async () => {
      ticketRepository.findById.mockResolvedValue({
        ...mockTicket,
        cashierId: 'cashier123',
        status: TicketStatus.ISSUED, // Ensure status is ISSUED
      });
      userRepository.findById.mockResolvedValue({
        ...mockCashier,
        _id: 'cashier123',
        role: UserRole.ADMIN, // Make user admin to bypass authorization check
      });
      ticketRepository.findByIdAndDelete.mockResolvedValue(mockTicket);

      const result = await service.deleteTicket('ticket123', 'cashier123');

      expect(result.message).toBe('Ticket deleted successfully');
      expect(result.ticketNo).toBe('TKT-2024-001234');
    });

    it('should throw NotFoundException if ticket not found', async () => {
      ticketRepository.findById.mockResolvedValue(null);

      await expect(service.deleteTicket('ticket123', 'cashier123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user not authorized', async () => {
      ticketRepository.findById.mockResolvedValue({
        ...mockTicket,
        cashierId: 'other-cashier',
      });
      userRepository.findById.mockResolvedValue({ ...mockCashier, role: UserRole.STUDENT });

      await expect(service.deleteTicket('ticket123', 'cashier123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserTickets', () => {
    const filterDto = {
      page: 1,
      limit: 10,
      status: TicketStatus.ISSUED,
    };

    it('should get user tickets successfully', async () => {
      const mockTickets = [
        {
          ...mockTicket,
          userId: mockUser,
          cashierId: mockCashier,
        },
      ];

      ticketRepository.findAllAndPopulate.mockResolvedValue(mockTickets);
      ticketRepository.count.mockResolvedValue(1);

      const result = await service.getUserTickets('user123', filterDto);

      expect(result.message).toBe('Tickets retrieved successfully');
      expect(result.data.tickets).toHaveLength(1);
      expect(result.data.total).toBe(1);
      expect(result.data.page).toBe(1);
    });
  });

  describe('getTicketStats', () => {
    it('should get ticket statistics successfully', async () => {
      ticketRepository.count
        .mockResolvedValueOnce(5) // issued
        .mockResolvedValueOnce(3) // redeemed
        .mockResolvedValueOnce(2) // expired
        .mockResolvedValueOnce(4); // pending

      const result = await service.getTicketStats('user123');

      expect(result.message).toBe('Ticket statistics retrieved successfully');
      expect(result.stats.issued).toBe(5);
      expect(result.stats.redeemed).toBe(3);
      expect(result.stats.expired).toBe(2);
      expect(result.stats.pending).toBe(4);
      expect(result.stats.total).toBe(10);
    });
  });

  describe('getAdminTicketStats', () => {
    it('should get admin ticket statistics successfully', async () => {
      const mockTickets = [
        { ...mockTicket, status: TicketStatus.REDEEMED, amount: 500, paymentType: 'CASH', ticketType: 'MEAL' },
        { ...mockTicket, status: TicketStatus.ISSUED, amount: 300, paymentType: 'POS', ticketType: 'WATER' },
      ];

      ticketRepository.count
        .mockResolvedValueOnce(10) // issued
        .mockResolvedValueOnce(5) // redeemed
        .mockResolvedValueOnce(2) // expired
        .mockResolvedValueOnce(8); // pending

      ticketRepository.findAll.mockResolvedValue(mockTickets);

      const result = await service.getAdminTicketStats();

      expect(result.message).toBe('Admin ticket statistics retrieved successfully');
      expect(result.stats.issued).toBe(10);
      expect(result.stats.redeemed).toBe(5);
      expect(result.stats.expired).toBe(2);
      expect(result.stats.pending).toBe(8);
      expect(result.stats.total).toBe(17);
      expect(result.stats.totalRevenue).toBe(500); // Only redeemed tickets count
      expect(result.stats.revenueByPaymentType).toBeDefined();
      expect(result.stats.ticketsByType).toBeDefined();
    });
  });

  describe('getAdminTicketLogs', () => {
    const filterDto = {
      page: 1,
      limit: 10,
    };

    it('should get admin ticket logs successfully', async () => {
      const mockTickets = [
        {
          ...mockTicket,
          userId: mockUser,
          cashierId: mockCashier,
        },
      ];

      ticketRepository.findAllAndPopulate.mockResolvedValue(mockTickets);
      ticketRepository.count.mockResolvedValue(1);

      const result = await service.getAdminTicketLogs(filterDto);

      expect(result.message).toBe('Admin ticket logs retrieved successfully');
      expect(result.data.tickets).toHaveLength(1);
      expect(result.data.total).toBe(1);
    });
  });
});
