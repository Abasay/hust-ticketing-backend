import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums';
import { DatabaseModelNames, TicketStatus, UserRole, PaymentType, TransactionStatus, RedemptionStatus } from 'src/shared/constants';
import {
  GenerateTicketReqDto,
  GenerateTicketResDto,
  RedeemTicketReqDto,
  RedeemTicketResDto,
  TicketFilterDto,
  TicketListResDto,
  TicketStatsResDto,
  AdminTicketStatsResDto,
  DeleteTicketResDto,
  PaginatedResponseDto,
  TicketDto,
  GetTicketByNumberReqDto,
  GetTicketByNumberResDto,
  VendorRedeemedTicketsReqDto,
  VendorRedeemedTicketsResDto,
  CashierIssuedStatsResDto,
  VendorRedeemedStatsResDto,
} from './dtos';
import { Ticket } from './ticket.schema';
import { User } from '../user/user.schema';
import { Transaction } from '../transactions/transaction.schema';
import { Redemption } from '../redemptions/redemption.schema';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(Repositories.TicketRepository)
    private readonly ticketRepository: BaseRepository<Ticket>,
    @Inject(Repositories.UserRepository)
    private readonly userRepository: BaseRepository<User>,
    @Inject(Repositories.TransactionRepository)
    private readonly transactionRepository: BaseRepository<Transaction>,
    @Inject(Repositories.RedemptionRepository)
    private readonly redemptionRepository: BaseRepository<Redemption>,
  ) {}

  private generateTicketNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `TKT-${new Date().getFullYear()}-${random}${timestamp.toString().slice(-6)}`;
  }

  async generateTicket(generateTicketDto: GenerateTicketReqDto, cashierId: string): Promise<GenerateTicketResDto> {
    // Validate customer exists (if provided)
    let customer: User | null = null;
    if (generateTicketDto.userId) {
      customer = await this.userRepository.findById(generateTicketDto.userId);
      if (!customer) {
        throw new NotFoundException('Customer not found');
      }
    }

    // Validate cashier exists and has proper role
    const cashier = await this.userRepository.findById(cashierId);
    if (!cashier) {
      throw new NotFoundException('Cashier not found');
    }

    if (cashier.role !== UserRole.CASHIER && cashier.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only cashiers and admins can generate tickets');
    }

    // // Create transaction record
    // const transactionData = {
    //   userId: generateTicketDto.userId || null, // null for guest users, Use 'userId' field name from schema
    //   cashierId: cashierId,
    //   amount: generateTicketDto.amount,
    //   paymentType: generateTicketDto.paymentType,
    //   reference: generateTicketDto.transactionReference,
    //   status: TransactionStatus.SUCCESS,
    //   expiryDate: new Date(generateTicketDto.expiryDate), // Use 'expiry' field name from schema
    // };

    // const transaction = await this.transactionRepository.create(transactionData);

    // Generate unique ticket number
    let ticketNo: string = '';
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!isUnique && attempts < maxAttempts) {
      ticketNo = this.generateTicketNumber();
      const existingTicket = await this.ticketRepository.findOne({ ticketNo });
      if (!existingTicket) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw new BadRequestException('Failed to generate unique ticket number. Please try again.');
    }

    // Create ticket
    const ticketData = {
      ticketNo,
      customer: generateTicketDto.userId || null,
      cashierId: cashierId,
      transactionId: null,
      ticketType: generateTicketDto.ticketType,
      amount: generateTicketDto.amount,
      paymentType: generateTicketDto.paymentType,
      expiryDate: new Date(generateTicketDto.expiryDate),
      status: TicketStatus.ISSUED,
    };

    const ticket = await this.ticketRepository.create(ticketData as any);

    // Populate ticket with user details for response
    const populateOptions = [{ path: 'cashierId', select: 'firstName lastName email role' }];

    // Only populate customer if it exists
    if (generateTicketDto.userId) {
      populateOptions.push({ path: 'customer', select: 'firstName lastName email role' });
    }

    const populatedTicket = await this.ticketRepository.findOneAndPopulate({ _id: ticket._id }, populateOptions);

    if (!populatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    console.log(populatedTicket);

    return {
      message: 'Ticket generated successfully',
      ticket: {
        ticketNo: populatedTicket.ticketNo,
        ticketType: populatedTicket.ticketType,
        amount: Number(populatedTicket.amount), // Convert Decimal128 to number
        paymentType: populatedTicket.paymentType,
        expiryDate: new Date(populatedTicket.expiryDate).toISOString(),
        status: populatedTicket.status,
        customer: populatedTicket.customer
          ? {
              _id: (populatedTicket.customer as any)._id,
              firstName: (populatedTicket.customer as any).firstName,
              lastName: (populatedTicket.customer as any).lastName,
              email: (populatedTicket.customer as any).email,
            }
          : 'Walk-in Customer',
        cashier: {
          _id: (populatedTicket.cashierId as any)._id,
          firstName: (populatedTicket.cashierId as any).firstName,
          lastName: (populatedTicket.cashierId as any).lastName,
          email: (populatedTicket.cashierId as any).email,
        },
        createdAt: new Date((populatedTicket as any).createdAt).toISOString(),
      },
    };
  }

  async redeemTicket(redeemTicketDto: RedeemTicketReqDto, redeemerUserId: string): Promise<RedeemTicketResDto> {
    // Validate redeemer exists and has proper role
    const redeemer = await this.userRepository.findById(redeemerUserId);
    if (!redeemer) {
      throw new NotFoundException('Redeemer not found');
    }

    if (redeemer.role !== UserRole.VENDOR && redeemer.role !== UserRole.ADMIN) {
      throw new BadRequestException('Only vendors and admins can redeem tickets');
    }

    // Find ticket with optional customer population
    const populateOptions = [];
    const ticket = await this.ticketRepository.findOne({ ticketNo: redeemTicketDto.ticketNo });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Populate customer if it exists
    let populatedTicket: Ticket | null = ticket;
    if (ticket.customer) {
      populatedTicket = await this.ticketRepository.findOneAndPopulate({ ticketNo: redeemTicketDto.ticketNo }, [
        { path: 'customer', select: 'firstName lastName email role' },
      ]);
    }

    if (!populatedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if ticket is already redeemed
    if (populatedTicket.status === TicketStatus.REDEEMED) {
      throw new BadRequestException('Ticket has already been redeemed');
    }

    // Check if ticket is expired
    if (populatedTicket.status === TicketStatus.EXPIRED || new Date() > new Date(populatedTicket.expiryDate)) {
      // Update ticket status to expired if not already
      if (populatedTicket.status !== TicketStatus.EXPIRED) {
        await this.ticketRepository.findOneAndUpdate({ _id: populatedTicket._id }, { status: TicketStatus.EXPIRED });
      }
      throw new BadRequestException('Ticket has expired');
    }

    // Update ticket status to redeemed and set redeemedBy
    await this.ticketRepository.findOneAndUpdate(
      { _id: populatedTicket._id },
      {
        status: TicketStatus.REDEEMED,
        redeemedBy: redeemerUserId,
      },
      { new: true },
    );

    // Create redemption record
    const redemptionData = {
      ticketId: populatedTicket._id,
      vendorId: redeemerUserId, // Keep field name for backward compatibility
      status: RedemptionStatus.REDEEMED,
    };

    await this.redemptionRepository.create(redemptionData as any);

    return {
      message: 'Ticket redeemed successfully',
      ticket: {
        ticketNo: populatedTicket.ticketNo,
        ticketType: populatedTicket.ticketType,
        amount: Number(populatedTicket.amount), // Convert Decimal128 to number
        status: TicketStatus.REDEEMED,
        customer: populatedTicket.customer
          ? {
              _id: (populatedTicket.customer as any)._id,
              firstName: (populatedTicket.customer as any).firstName,
              lastName: (populatedTicket.customer as any).lastName,
              email: (populatedTicket.customer as any).email,
            }
          : 'Walk-in Customer',
        redeemedBy: {
          _id: redeemer._id as any,
          firstName: redeemer.firstName,
          lastName: redeemer.lastName,
          email: redeemer.email,
        },
        redeemedAt: new Date().toISOString(),
      },
    };
  }

  async deleteTicket(ticketId: string, userId: string): Promise<DeleteTicketResDto> {
    // Find the ticket
    const ticket = await this.ticketRepository.findById(ticketId);
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check if user is authorized to delete this ticket
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only admin or the cashier who created the ticket can delete it
    const ticketCashierId = ticket.cashierId?.toString ? ticket.cashierId.toString() : ticket.cashierId;
    if (user.role !== UserRole.ADMIN && ticketCashierId !== userId) {
      throw new BadRequestException('You are not authorized to delete this ticket');
    }

    // Check if ticket can be deleted (only issued tickets can be deleted)
    if (ticket.status !== TicketStatus.ISSUED) {
      throw new BadRequestException('Only issued tickets can be deleted');
    }

    // Delete the ticket
    const deletedTicket = await this.ticketRepository.findByIdAndDelete(ticketId);

    if (!deletedTicket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      message: 'Ticket deleted successfully',
      ticketNo: deletedTicket.ticketNo,
    };
  }

  async getUserTickets(userId: string, filterDto: TicketFilterDto): Promise<TicketListResDto> {
    const { page = 1, limit = 10, status, ticketType, search } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = { cashierId: userId };

    if (status) {
      filter.status = status;
    }

    if (ticketType) {
      filter.ticketType = ticketType;
    }

    if (search) {
      filter.ticketNo = { $regex: search, $options: 'i' };
    }

    // Get tickets with pagination
    const tickets = await this.ticketRepository.findAllAndPopulate(
      filter,
      [
        { path: 'customer', select: 'firstName lastName email role' },
        { path: 'cashierId', select: 'firstName lastName email role' },
        { path: 'redeemedBy', select: 'firstName lastName email role' },
      ],
      { createdAt: -1 },
      skip,
      limit,
    );

    // Get total count
    const total = await this.ticketRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Tickets retrieved successfully',
      data: {
        tickets: tickets.map((ticket) => ({
          _id: (ticket._id as any).toString(),
          ticketNo: ticket.ticketNo,
          ticketType: ticket.ticketType,
          amount: Number(ticket.amount), // Convert Decimal128 to number
          paymentType: ticket.paymentType,
          status: ticket.status,
          expiryDate: ticket.expiryDate.toISOString(),
          userId: ticket.customer
            ? {
                _id: (ticket.customer as any)._id,
                firstName: (ticket.customer as any).firstName,
                lastName: (ticket.customer as any).lastName,
                email: (ticket.customer as any).email,
                role: (ticket.customer as any).role,
              }
            : 'Walk-in Customer',
          cashierId: {
            _id: (ticket.cashierId as any)._id,
            firstName: (ticket.cashierId as any).firstName,
            lastName: (ticket.cashierId as any).lastName,
            email: (ticket.cashierId as any).email,
            role: (ticket.cashierId as any).role,
          },
          redeemedBy: ticket.redeemedBy
            ? {
                _id: (ticket.redeemedBy as any)._id,
                firstName: (ticket.redeemedBy as any).firstName,
                lastName: (ticket.redeemedBy as any).lastName,
                email: (ticket.redeemedBy as any).email,
                role: (ticket.redeemedBy as any).role,
              }
            : null,
          // transactionId: ticket.transactionId,
          createdAt: (ticket as any).createdAt.toISOString(),
          updatedAt: (ticket as any).updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getTicketStats(userId: string): Promise<TicketStatsResDto> {
    // Get stats for the specific user
    const [issued, redeemed, expired] = await Promise.all([
      this.ticketRepository.count({ cashierId: userId, status: TicketStatus.ISSUED }),
      this.ticketRepository.count({ cashierId: userId, status: TicketStatus.REDEEMED }),
      this.ticketRepository.count({ cashierId: userId, status: TicketStatus.EXPIRED }),
    ]);

    // Calculate pending (issued tickets that haven't expired)
    const now = new Date();
    const pending = await this.ticketRepository.count({
      cashierId: userId,
      status: TicketStatus.ISSUED,
      expiry: { $gt: now }, // Use 'expiry' field name from schema
    });

    const total = issued + redeemed + expired;

    return {
      message: 'Ticket statistics retrieved successfully',
      stats: {
        issued,
        redeemed,
        expired,
        pending,
        total,
      },
    };
  }

  async getAdminTicketStats(): Promise<AdminTicketStatsResDto> {
    // Get overall ticket counts
    const [issued, redeemed, expired] = await Promise.all([
      this.ticketRepository.count({ status: TicketStatus.ISSUED }),
      this.ticketRepository.count({ status: TicketStatus.REDEEMED }),
      this.ticketRepository.count({ status: TicketStatus.EXPIRED }),
    ]);

    // Calculate pending (issued tickets that haven't expired)
    const now = new Date();
    const pending = await this.ticketRepository.count({
      status: TicketStatus.ISSUED,
      expiry: { $gt: now }, // Use 'expiry' field name from schema
    });

    const total = issued + redeemed + expired;

    // Get all tickets for revenue and breakdown calculations
    const allTickets = await this.ticketRepository.findAll({});

    // Calculate total revenue (only from redeemed tickets)
    const totalRevenue = allTickets
      .filter((ticket) => ticket.status === TicketStatus.REDEEMED)
      .reduce((sum, ticket) => sum + Number(ticket.amount), 0); // Convert Decimal128 to number

    // Revenue breakdown by payment type
    const revenueByPaymentType = allTickets
      // .filter((ticket) => ticket.status === TicketStatus.REDEEMED)
      .reduce(
        (acc, ticket) => {
          acc[ticket.paymentType] = (acc[ticket.paymentType] || 0) + Number(ticket.amount); // Convert Decimal128 to number
          return acc;
        },
        {} as Record<string, number>,
      );

    // Ticket count breakdown by type
    const ticketsByType = allTickets.reduce(
      (acc, ticket) => {
        acc[ticket.ticketType] = (acc[ticket.ticketType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      message: 'Admin ticket statistics retrieved successfully',
      stats: {
        issued,
        redeemed,
        expired,
        pending,
        total,
        totalRevenue,
        revenueByPaymentType,
        ticketsByType,
      },
    };
  }

  async getAdminTicketLogs(filterDto: TicketFilterDto): Promise<TicketListResDto> {
    const { page = 1, limit = 10, status, ticketType, search } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (ticketType) {
      filter.ticketType = ticketType;
    }

    if (search) {
      filter.ticketNo = { $regex: search, $options: 'i' };
    }

    // Get all tickets with pagination and populate user details
    const tickets = await this.ticketRepository.findAllAndPopulate(
      filter,
      [
        { path: 'customer', select: 'firstName lastName email role _id' },
        { path: 'cashierId', select: 'firstName lastName email role _id' },
        { path: 'redeemedBy', select: 'firstName lastName email role _id' },
      ],
      { createdAt: -1 },
      skip,
      limit,
    );

    // Get total count
    const total = await this.ticketRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Admin ticket logs retrieved successfully',
      data: {
        tickets: tickets.map((ticket) => ({
          _id: (ticket._id as any).toString(),
          ticketNo: ticket.ticketNo,
          ticketType: ticket.ticketType,
          amount: Number(ticket.amount), // Convert Decimal128 to number
          paymentType: ticket.paymentType,
          status: ticket.status,
          expiryDate: ticket.expiryDate.toISOString(),
          userId: ticket.customer
            ? {
                _id: (ticket.customer as any)._id,
                firstName: (ticket.customer as any).firstName,
                lastName: (ticket.customer as any).lastName,
                email: (ticket.customer as any).email,
                role: (ticket.customer as any).role,
              }
            : 'Walk-in Customer',
          cashierId: {
            _id: (ticket.cashierId as any)?._id || null,
            firstName: (ticket.cashierId as any)?.firstName || null,
            lastName: (ticket.cashierId as any)?.lastName || null,
            email: (ticket.cashierId as any)?.email || null,
            role: (ticket.cashierId as any)?.role || null,
          },
          redeemedBy: ticket.redeemedBy
            ? {
                _id: (ticket.redeemedBy as any)?._id || null,
                firstName: (ticket.redeemedBy as any).firstName || null,
                lastName: (ticket.redeemedBy as any).lastName || null,
                email: (ticket.redeemedBy as any).email || null,
                role: (ticket.redeemedBy as any).role || null,
              }
            : null,
          // transactionId: "",
          createdAt: (ticket as any).createdAt.toISOString(),
          updatedAt: (ticket as any).updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAdminTicketLogsExport(filterDto: TicketFilterDto): Promise<TicketListResDto> {
    const { page = 1, limit = 10, status, ticketType, search } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (ticketType) {
      filter.ticketType = ticketType;
    }

    if (search) {
      filter.ticketNo = { $regex: search, $options: 'i' };
    }

    // Get all tickets with pagination and populate user details
    const tickets = await this.ticketRepository.findAllAndPopulate(
      {},
      [
        { path: 'customer', select: 'firstName lastName email role _id' },
        { path: 'cashierId', select: 'firstName lastName email role _id' },
        { path: 'redeemedBy', select: 'firstName lastName email role _id' },
      ],
      { createdAt: -1 },
    );

    // Get total count
    const total = await this.ticketRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Admin ticket logs retrieved successfully',
      data: {
        tickets: tickets.map((ticket) => ({
          _id: (ticket._id as any).toString(),
          ticketNo: ticket.ticketNo,
          ticketType: ticket.ticketType,
          amount: Number(ticket.amount), // Convert Decimal128 to number
          paymentType: ticket.paymentType,
          status: ticket.status,
          expiryDate: ticket.expiryDate.toISOString(),
          userId: ticket.customer
            ? {
                _id: (ticket.customer as any)._id,
                firstName: (ticket.customer as any).firstName,
                lastName: (ticket.customer as any).lastName,
                email: (ticket.customer as any).email,
                role: (ticket.customer as any).role,
              }
            : 'Walk-in Customer',
          cashierId: {
            _id: (ticket.cashierId as any)?._id || null,
            firstName: (ticket.cashierId as any)?.firstName || null,
            lastName: (ticket.cashierId as any)?.lastName || null,
            email: (ticket.cashierId as any)?.email || null,
            role: (ticket.cashierId as any)?.role || null,
          },
          redeemedBy: ticket.redeemedBy
            ? {
                _id: (ticket.redeemedBy as any)?._id || null,
                firstName: (ticket.redeemedBy as any).firstName || null,
                lastName: (ticket.redeemedBy as any).lastName || null,
                email: (ticket.redeemedBy as any).email || null,
                role: (ticket.redeemedBy as any).role || null,
              }
            : null,
          // transactionId: "",
          createdAt: (ticket as any).createdAt.toISOString(),
          updatedAt: (ticket as any).updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getTicketByNumber(ticketNo: string): Promise<GetTicketByNumberResDto> {
    // Find ticket by ticket number with populated fields
    const ticket = await this.ticketRepository.findOneAndPopulate({ ticketNo }, [
      { path: 'customer', select: 'firstName lastName email role' },
      { path: 'cashierId', select: 'firstName lastName email role' },
      { path: 'redeemedBy', select: 'firstName lastName email role' },
    ]);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return {
      message: 'Ticket retrieved successfully',
      ticket: {
        _id: (ticket._id as any).toString(),
        ticketNo: ticket.ticketNo,
        ticketType: ticket.ticketType,
        amount: Number(ticket.amount), // Convert Decimal128 to number
        paymentType: ticket.paymentType,
        status: ticket.status,
        expiryDate: ticket.expiryDate.toISOString(),
        userId: ticket.customer
          ? {
              _id: (ticket.customer as any)._id,
              firstName: (ticket.customer as any).firstName,
              lastName: (ticket.customer as any).lastName,
              email: (ticket.customer as any).email,
              role: (ticket.customer as any).role,
            }
          : 'Walk-in Customer',
        cashierId: {
          _id: (ticket.cashierId as any)._id,
          firstName: (ticket.cashierId as any).firstName,
          lastName: (ticket.cashierId as any).lastName,
          email: (ticket.cashierId as any).email,
          role: (ticket.cashierId as any).role,
        },
        redeemedBy: ticket.redeemedBy
          ? {
              _id: (ticket.redeemedBy as any)._id,
              firstName: (ticket.redeemedBy as any).firstName,
              lastName: (ticket.redeemedBy as any).lastName,
              email: (ticket.redeemedBy as any).email,
              role: (ticket.redeemedBy as any).role,
            }
          : null,
        // transactionId: ticket.transactionId,
        createdAt: (ticket as any).createdAt.toISOString(),
        updatedAt: (ticket as any).updatedAt.toISOString(),
      },
    };
  }

  async getVendorRedeemedTickets(vendorId: string, filterDto: VendorRedeemedTicketsReqDto): Promise<VendorRedeemedTicketsResDto> {
    const { page = 1, limit = 10, search, ticketType } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query for tickets redeemed by this vendor
    const filter: any = {
      redeemedBy: vendorId,
      status: TicketStatus.REDEEMED,
    };

    if (ticketType) {
      filter.ticketType = ticketType;
    }

    if (search) {
      filter.ticketNo = { $regex: search, $options: 'i' };
    }

    // Get tickets with pagination
    const tickets = await this.ticketRepository.findAllAndPopulate(
      filter,
      [
        { path: 'customer', select: 'firstName lastName email role' },
        { path: 'cashierId', select: 'firstName lastName email role' },
        { path: 'redeemedBy', select: 'firstName lastName email role' },
      ],
      { createdAt: -1 },
      skip,
      limit,
    );

    // Get total count
    const total = await this.ticketRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Vendor redeemed tickets retrieved successfully',
      data: {
        tickets: tickets.map((ticket) => ({
          _id: (ticket._id as any).toString(),
          ticketNo: ticket.ticketNo,
          ticketType: ticket.ticketType,
          amount: Number(ticket.amount), // Convert Decimal128 to number
          paymentType: ticket.paymentType,
          status: ticket.status,
          expiryDate: ticket.expiryDate.toISOString(),
          userId: ticket.customer
            ? {
                _id: (ticket.customer as any)._id,
                firstName: (ticket.customer as any).firstName,
                lastName: (ticket.customer as any).lastName,
                email: (ticket.customer as any).email,
                role: (ticket.customer as any).role,
              }
            : 'Walk-in Customer',
          cashierId: {
            _id: (ticket.cashierId as any)._id,
            firstName: (ticket.cashierId as any).firstName,
            lastName: (ticket.cashierId as any).lastName,
            email: (ticket.cashierId as any).email,
            role: (ticket.cashierId as any).role,
          },
          redeemedBy: ticket.redeemedBy
            ? {
                _id: (ticket.redeemedBy as any)._id,
                firstName: (ticket.redeemedBy as any).firstName,
                lastName: (ticket.redeemedBy as any).lastName,
                email: (ticket.redeemedBy as any).email,
                role: (ticket.redeemedBy as any).role,
              }
            : null,
          // transactionId: ticket.transactionId,
          createdAt: (ticket as any).createdAt.toISOString(),
          updatedAt: (ticket as any).updatedAt.toISOString(),
        })),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getCashierIssuedStats(cashierId: string): Promise<CashierIssuedStatsResDto> {
    // Get all tickets issued by this cashier
    const issuedTickets = await this.ticketRepository.findAll({
      cashierId: cashierId,
      // status: TicketStatus.ISSUED,
    });

    const ticketsIssued = issuedTickets.length;
    const totalAmount = issuedTickets.reduce((sum, ticket: any) => {
      return sum + (Number(ticket.amount) || 0);
    }, 0);

    const averageAmount = ticketsIssued > 0 ? totalAmount / ticketsIssued : 0;

    return {
      message: 'Cashier issued tickets statistics retrieved successfully',
      stats: {
        ticketsIssued,
        totalAmount: Math.round(totalAmount),
        averageAmount: Math.round(averageAmount),
      },
    };
  }

  async getVendorRedeemedStats(vendorId: string): Promise<VendorRedeemedStatsResDto> {
    // Get all tickets redeemed by this vendor
    const redeemedTickets = await this.ticketRepository.findAll({
      redeemedBy: vendorId,
      status: TicketStatus.REDEEMED,
    });

    const ticketsRedeemed = redeemedTickets.length;
    const totalAmount = redeemedTickets.reduce((sum, ticket: any) => {
      return sum + (Number(ticket.amount) || 0);
    }, 0);

    const averageAmount = ticketsRedeemed > 0 ? totalAmount / ticketsRedeemed : 0;

    return {
      message: 'Vendor redeemed tickets statistics retrieved successfully',
      stats: {
        ticketsRedeemed,
        totalAmount: Math.round(totalAmount),
        averageAmount: Math.round(averageAmount),
      },
    };
  }
}
