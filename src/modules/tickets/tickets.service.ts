import { Injectable, Inject, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums/db.enum';
import {
  DatabaseModelNames,
  TicketStatus,
  UserRole,
  PaymentType,
  TransactionStatus,
  RedemptionStatus,
  OrderStatus,
} from 'src/shared/constants';
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
  StudentBulkPurchaseReqDto,
  StudentBulkPurchaseResDto,
  StudentWalletTicketReqDto,
  StudentWalletTicketResDto,
  FacultyTicketReqDto,
  FacultyTicketResDto,
  GetStaffTicketsReqDto,
  StudentTicketReqDto,
  StudentTicketResDto,
} from './dtos';
import { Ticket } from './ticket.schema';
import { User } from '../user/user.schema';
import { Transaction } from '../transactions/transaction.schema';
import { Redemption } from '../redemptions/redemption.schema';
import { Wallet } from '../wallet/wallet.schema';
import { Types } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Order } from '../foodstuffs/schemas/order.schema';

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);
  constructor(
    @Inject(Repositories.TicketRepository)
    private readonly ticketRepository: BaseRepository<Ticket>,
    @Inject(Repositories.UserRepository)
    private readonly userRepository: BaseRepository<User>,
    @Inject(Repositories.TransactionRepository)
    private readonly transactionRepository: BaseRepository<Transaction>,
    @Inject(Repositories.RedemptionRepository)
    private readonly redemptionRepository: BaseRepository<Redemption>,
    @Inject(Repositories.WalletRepository)
    private readonly walletRepository: BaseRepository<Wallet>,
    private readonly httpService: HttpService,
    @Inject(Repositories.OrderRepository)
    private readonly orderRepository: BaseRepository<Order>,
  ) {}

  private generateTicketNumber(): string {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const length = 5;

    // Convert string to array to allow splicing (for no repetition)
    const charsArray = chars.split('');
    let ticket = '';
    // const existingTickets = this.ticketRepository.findAll({});

    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * charsArray.length);
      ticket += charsArray[randIndex];
      charsArray.splice(randIndex, 1); // remove picked char to avoid repetition
    }

    return `TKT-${ticket}`;
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

    // if (cashier.role !== UserRole.CASHIER && cashier.role !== UserRole.ADMIN) {
    //   throw new BadRequestException('Only cashiers and admins can generate tickets');
    // }

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

    let order: Order | null = null;

    if (generateTicketDto.order) {
      order = await this.orderRepository.findById(generateTicketDto.order);
      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException('Order already fulfilled');
      }

      generateTicketDto.amount =
        order.orders.reduce((total, item) => total + item.pricePerQuantity * item.quantity, 0) + order.processingFee || 0;
    }

    console.log(order);

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

    if (generateTicketDto.order) {
      await this.orderRepository.findOneAndUpdate({ _id: generateTicketDto.order }, { status: OrderStatus.FULFILLED });
    }

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

    // if (redeemer.role !== UserRole.VENDOR && redeemer.role !== UserRole.ADMIN) {
    //   throw new BadRequestException('Only vendors and admins can redeem tickets');
    // }

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
    const { page = 1, limit = 10, status, ticketType, search, cashierId } = filterDto;
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

    if (cashierId) {
      filter.cashierId = new Types.ObjectId(cashierId);
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
    console.log(tickets);

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
    const { page = 1, limit = 10, status, ticketType, search, cashierId } = filterDto;
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

    if (cashierId) {
      filter.cashierId = cashierId;
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

  // Student ticket purchase (single purchase)
  async generateStudentTicket(studentTicketDto: StudentTicketReqDto, cashierId: string): Promise<StudentTicketResDto> {
    // Find or create student
    let student = await this.userRepository.findOne({ matricNumber: studentTicketDto.matricNumber });

    if (!student) {
      student = await this.userRepository.create({
        firstName: 'Student',
        lastName: studentTicketDto.matricNumber,
        email: `${studentTicketDto.matricNumber}@temp.edu`,
        password: null,
        role: UserRole.STUDENT,
        matricNumber: studentTicketDto.matricNumber,
        isAccountLocked: true,
      });
    }

    // Generate ticket using existing logic
    const generateTicketDto: GenerateTicketReqDto = {
      userId: (student._id as any).toString(),
      ticketType: studentTicketDto.ticketType,
      amount: studentTicketDto.amount,
      paymentType: studentTicketDto.paymentType,
      expiryDate: studentTicketDto.expiryDate,
    };

    const result = await this.generateTicket(generateTicketDto, cashierId);

    return {
      message: 'Student ticket generated successfully',
      ticket: {
        ...result.ticket,
        student: {
          _id: (student._id as any).toString(),
          matricNumber: student?.matricNumber || 'N/A',
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
        },
      },
    };
  }

  // Student wallet funding (bulk purchase)
  async fundStudentWallet(bulkPurchaseDto: StudentBulkPurchaseReqDto, cashierId: string): Promise<StudentBulkPurchaseResDto> {
    // Find or create student
    let student = await this.userRepository.findOne({ matricNumber: bulkPurchaseDto.matricNumber });

    if (!student) {
      student = await this.userRepository.create({
        firstName: 'Student',
        lastName: bulkPurchaseDto.matricNumber,
        email: `${bulkPurchaseDto.matricNumber}@temp.edu`,
        password: null,
        role: UserRole.STUDENT,
        matricNumber: bulkPurchaseDto.matricNumber,
        isAccountLocked: true,
      });
    }

    // Find or create wallet
    let wallet = await this.walletRepository.findOne({ userId: student._id });

    if (!wallet) {
      wallet = await this.walletRepository.create({
        userId: new Types.ObjectId(student._id as string),
        walletBalance: bulkPurchaseDto.amount,
        walletUsed: 0,
      });
    } else {
      wallet = await this.walletRepository.findOneAndUpdate(
        { userId: student._id },
        { $inc: { walletBalance: bulkPurchaseDto.amount } },
        { new: true },
      );
    }

    return {
      message: 'Wallet topped up successfully',
      wallet: {
        matricNumber: student.matricNumber || 'N/A',
        walletBalance: wallet?.walletBalance || 0,
        walletUsed: wallet?.walletUsed || 0,
        availableBalance: (wallet?.walletBalance || 0) - (wallet?.walletUsed || 0),
      },
    };
  }

  // Ticket purchase using wallet
  async generateTicketFromWallet(walletTicketDto: StudentWalletTicketReqDto, cashierId: string): Promise<StudentWalletTicketResDto> {
    // Find student
    const student = await this.userRepository.findOne({ matricNumber: walletTicketDto.matricNumber });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Find wallet
    const wallet = await this.walletRepository.findOne({ userId: student._id });
    if (!wallet) {
      throw new NotFoundException('Student wallet not found');
    }

    // Check available balance
    const availableBalance = wallet.walletBalance - wallet.walletUsed;
    if (availableBalance < walletTicketDto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Update wallet
    const updatedWallet = await this.walletRepository.findOneAndUpdate(
      { userId: student._id },
      { $inc: { walletUsed: walletTicketDto.amount } },
      { new: true },
    );

    // Generate ticket
    const generateTicketDto: GenerateTicketReqDto = {
      userId: (student._id as any).toString(),
      ticketType: walletTicketDto.ticketType,
      amount: walletTicketDto.amount,
      paymentType: PaymentType.WALLET,
      expiryDate: walletTicketDto.expiryDate,
    };

    const result = await this.generateTicket(generateTicketDto, cashierId);

    return {
      message: 'Ticket purchased from wallet successfully',
      data: {
        ticket: {
          ticketNo: result.ticket.ticketNo,
          ticketType: result.ticket.ticketType,
          amount: result.ticket.amount,
          status: result.ticket.status,
          expiryDate: result.ticket.expiryDate,
        },
        wallet: {
          walletBalance: updatedWallet?.walletBalance || 0,
          walletUsed: updatedWallet?.walletUsed || 0,
          availableBalance: (updatedWallet?.walletBalance || 0) - (updatedWallet?.walletUsed || 0),
        },
      },
    };
  }

  // Faculty ticket generation
  async generateFacultyTickets(facultyTicketDto: FacultyTicketReqDto, cashierId: string): Promise<FacultyTicketResDto> {
    const { staffIds, ticketType, totalAmount, paymentType, expiryDate } = facultyTicketDto;

    // Validate amount divisibility
    if (totalAmount % staffIds.length !== 0) {
      throw new BadRequestException('Total amount must be divisible equally among selected staff');
    }

    const amountPerTicket = totalAmount / staffIds.length;
    const tickets: any[] = [];

    for (const staffId of staffIds) {
      // Find or create staff
      let staff = await this.userRepository.findOne({ staffId: staffId.staffId });

      if (!staff) {
        staff = await this.userRepository.create({
          firstName: staffId.firstName,
          lastName: staffId.lastName,
          email: staffId.email,
          password: null,
          role: UserRole.STAFF,
          staffId: staffId.staffId,
          isAccountLocked: true,
          staffDepartment: staffId.department,
          staffLevel: staffId.staffLevel,
        });
      }

      // Generate ticket for this staff
      const generateTicketDto: GenerateTicketReqDto = {
        userId: staff._id as any,
        ticketType,
        amount: amountPerTicket,
        paymentType,
        expiryDate,
      };

      const result = await this.generateTicket(generateTicketDto, cashierId);

      tickets.push({
        ...result.ticket,
        staff: {
          _id: (staff._id as any).toString(),
          staffId: staff.staffId || 'N/A',
          firstName: staff.firstName,
          lastName: staff.lastName,
          email: staff.email,
        },
      });
    }

    return {
      message: 'Faculty tickets generated successfully',
      data: {
        totalTickets: tickets.length,
        amountPerTicket,
        tickets,
      },
    };
  }

  // Get staff tickets for printing
  async getStaffTickets(getStaffTicketsDto: GetStaffTicketsReqDto): Promise<any> {
    const staff = await this.userRepository.findOne({ staffId: getStaffTicketsDto.staffId });
    if (!staff) {
      throw new NotFoundException('Staff not found');
    }

    const tickets = await this.ticketRepository.findAllAndPopulate({ customer: new Types.ObjectId(staff._id as any) }, [
      {
        path: 'customer',
        select: 'firstName lastName email role',
      },
      {
        path: 'cashierId',
        select: 'firstName lastName email role',
      },
    ]);

    if (!tickets) {
      throw new NotFoundException('No tickets found for this staff');
    }

    return {
      message: 'Staff tickets retrieved successfully',
      tickets: tickets.map((ticket) => ({
        ticketNo: ticket.ticketNo,
        ticketType: ticket.ticketType,
        amount: ticket.amount,
        status: ticket.status,
        expiryDate: ticket.expiryDate,
        createdAt: (ticket as any).createdAt,
        customer: ticket.customer,
        cashier: ticket.cashierId,
        paymentMethod: ticket.paymentType,
      })),
    };
  }

  async getStudentWalletBalance(matricNumber: string): Promise<StudentBulkPurchaseResDto> {
    const student = await this.userRepository.findOne({ matricNumber });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const wallet = await this.walletRepository.findOne({ userId: student._id });
    if (!wallet) {
      throw new NotFoundException('Student wallet not found');
    }

    return {
      message: 'Student wallet balance retrieved successfully',
      wallet: {
        matricNumber: student.matricNumber || 'N/A',
        walletBalance: wallet?.walletBalance || 0,
        walletUsed: wallet?.walletUsed || 0,
        availableBalance: (wallet?.walletBalance || 0) - (wallet?.walletUsed || 0),
      },
    };
  }

  async getDepartments(searchTerm: string): Promise<any> {
    try {
      const url = searchTerm
        ? `https://api-lvdtevnqpq-uc.a.run.app/external/departments?searchTerm=${encodeURIComponent(searchTerm)}`
        : 'https://api-lvdtevnqpq-uc.a.run.app/external/departments';
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'x-api-key': '3fcfd77d35604cfa4a5ef9bfcb313920',
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to get departments for searchTerm ${searchTerm}:`, error.message);
      return false;
    }
  }

  async getDepartmentStaffs(department: string, searchTerm: string): Promise<any> {
    try {
      const url = searchTerm
        ? `https://api-lvdtevnqpq-uc.a.run.app/external/departments/staffs?department=${department}&searchTerm=${encodeURIComponent(searchTerm)}`
        : `https://api-lvdtevnqpq-uc.a.run.app/external/departments/staffs?department=${department}`;
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'x-api-key': '3fcfd77d35604cfa4a5ef9bfcb313920',
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.warn(`Failed to get department staffs for department ${department} and searchTerm ${searchTerm}:`, error.message);
      return false;
    }
  }
}
