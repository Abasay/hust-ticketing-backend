import { Inject, Injectable, Logger } from '@nestjs/common';
import { Repositories } from 'src/shared/enums';
import { BaseRepository } from '../repository/base.repository';
import { Order, OrderItem } from './schemas/order.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { BadRequestException } from 'src/exceptions';
import { Types } from 'mongoose';
import { CookedFoodName } from './schemas/cooked-food-name.schema';
import { User } from '../user/user.schema';
import { ReportDateRangeDto } from './dtos/reports.dto';
import { Ticket } from '../tickets/ticket.schema';
import { Redemption } from '../redemptions/redemption.schema';
import moment from 'moment-timezone';
import { CookedFood } from './schemas/cooked-food.schema';
import { CreateOrderWithPaymentDto } from './dtos/create-order-with-payment.dto';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { TicketType, PaymentType, OrderStatus } from 'src/shared/constants';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @Inject(Repositories.OrderRepository) private readonly orderRepository: BaseRepository<Order>,
    @Inject(Repositories.CookedFoodNameRepository) private readonly cookedFoodNameRepository: BaseRepository<CookedFoodName>,
    @Inject(Repositories.UserRepository) private readonly userRepository: BaseRepository<User>,
    @Inject(Repositories.TicketRepository) private readonly ticketRepository: BaseRepository<Ticket>,
    @Inject(Repositories.RedemptionRepository) private readonly redemptionRepository: BaseRepository<Redemption>,
    @Inject(Repositories.CookedFoodRepository) private readonly cookedFoodRepository: BaseRepository<CookedFood>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private async generateOrderId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const length = 3;

    // const existingOrders = await this.orderRepository.findAll({});

    // Convert string to array to allow splicing (for no repetition)
    const charsArray = chars.split('');
    let order = '';

    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * charsArray.length);
      order += charsArray[randIndex];
      charsArray.splice(randIndex, 1); // remove picked char to avoid repetition
    }

    while (await this.orderRepository.findOne({ orderId: order })) {
      order = await this.generateOrderId();
    }

    return `${order}`;
  }

  /**
   * Verifies Paystack payment using payment reference
   */
  private async verifyPaystackPayment(reference: string): Promise<{
    success: boolean;
    amount: number;
    currency: string;
    message: string;
    data?: any;
  }> {
    try {
      const paystackSecretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');

      if (!paystackSecretKey) {
        this.logger.error('Paystack secret key not configured');
        return {
          success: false,
          amount: 0,
          currency: 'NGN',
          message: 'Payment verification service not configured',
        };
      }

      const response = await firstValueFrom(
        this.httpService.get(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            Authorization: `Bearer ${paystackSecretKey}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      const { data } = response;

      if (data.status && data.data.status === 'success') {
        return {
          success: true,
          amount: data.data.amount / 100, // Paystack returns amount in kobo
          currency: data.data.currency,
          message: 'Payment verified successfully',
          data: data.data,
        };
      }

      return {
        success: false,
        amount: 0,
        currency: data.data.currency || 'NGN',
        message: data.message || 'Payment verification failed',
        data: data.data,
      };
    } catch (error) {
      this.logger.error(`Paystack verification error for reference ${reference}:`, error.message);
      return {
        success: false,
        amount: 0,
        currency: 'NGN',
        message: error.response?.data?.message || 'Failed to verify payment',
      };
    }
  }

  /**
   * Creates an order with payment verification and generates a ticket
   */
  async createOrderWithPayment(createOrderDto: CreateOrderWithPaymentDto): Promise<{
    message: string;
    order: Order & { _id: Types.ObjectId };
    ticket: Ticket;
    paymentVerification: {
      success: boolean;
      amount: number;
      currency: string;
    };
  }> {
    // Step 1: Verify payment with Paystack
    const paymentVerification = await this.verifyPaystackPayment(createOrderDto.paymentReference);

    if (!paymentVerification.success) {
      throw BadRequestException.VALIDATION_ERROR(`Payment verification failed: ${paymentVerification.message}`);
    }

    this.logger.log(`Payment verified successfully for reference: ${createOrderDto.paymentReference}`);

    // Step 2: Create the order
    const orderId = await this.generateOrderId();

    let user: User | null;

    if (createOrderDto.user) {
      user = await this.userRepository.findOne({ email: createOrderDto.user.email });
      if (!user) {
        user = await this.userRepository.create(createOrderDto.user);
      }
    } else {
      user = null;
    }

    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const cookedFoodName = await this.cookedFoodNameRepository.findById(String(item.itemId));
        if (!cookedFoodName) {
          throw BadRequestException.RESOURCE_NOT_FOUND('Cooked food name not found');
        }
        return {
          ...item,
          pricePerQuantity: cookedFoodName.pricePerQuantity || 0,
        };
      }),
    );

    // Calculate total amount from items (no processing fee for online payments)
    const totalAmount = items.reduce((sum, item) => sum + item.pricePerQuantity * item.quantity, 0);

    // Verify that the payment amount matches the order total
    if (Math.abs(paymentVerification.amount - totalAmount) > 0.01) {
      throw BadRequestException.VALIDATION_ERROR(
        `Payment amount (${paymentVerification.amount}) does not match order total (${totalAmount})`,
      );
    }

    const createdOrder = await this.orderRepository.create({
      user: user ? (user._id as Types.ObjectId) : undefined,
      orders: items,
      description: createOrderDto.description,
      orderId,
      processingFee: 0, // No processing fee for online payments
      status: OrderStatus.FULFILLED, // Mark order as fulfilled immediately upon successful payment
    });

    // Step 3: Generate ticket for the order
    const ticketNo = await this.generateTicketNumber();
    const ticketData = {
      ticketNo,
      customer: user ? (user._id as Types.ObjectId) : null,
      cashierId: null, // Online order, no cashier
      transactionId: null,
      ticketType: createOrderDto.ticketType || TicketType.MEAL,
      amount: totalAmount,
      paymentType: PaymentType.BANK_TRANSFER, // Online payment via Paystack
      expiryDate: new Date(createOrderDto.expiryDate),
      status: 'ISSUED',
      order: (createdOrder as any)._id,
    };

    const ticket = await this.ticketRepository.create(ticketData as any);

    this.logger.log(`Order ${orderId} created successfully with ticket ${ticketNo}`);

    return {
      message: 'Order created successfully and ticket generated',
      order: createdOrder as Order & { _id: Types.ObjectId },
      ticket,
      paymentVerification: {
        success: paymentVerification.success,
        amount: paymentVerification.amount,
        currency: paymentVerification.currency,
      },
    };
  }

  private async generateTicketNumber(): Promise<string> {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const length = 5;

    const charsArray = chars.split('');
    let ticket = '';

    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * charsArray.length);
      ticket += charsArray[randIndex];
      charsArray.splice(randIndex, 1);
    }

    // Check for uniqueness
    const existingTicket = await this.ticketRepository.findOne({ ticketNo: `TKT-${ticket}` });
    if (existingTicket) {
      return this.generateTicketNumber(); // Recursively generate a new one
    }

    return `TKT-${ticket}`;
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<Order> {
    const orderId = await this.generateOrderId();

    let user: User | null;

    if (createOrderDto.user) {
      user = await this.userRepository.findOne({ email: createOrderDto.user.email });
      if (!user) {
        user = await this.userRepository.create(createOrderDto.user);
      }
    } else {
      user = null;
    }

    const items = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const cookedFoodName = await this.cookedFoodNameRepository.findById(String(item.itemId));
        if (!cookedFoodName) {
          throw BadRequestException.RESOURCE_NOT_FOUND('Cooked food name not found');
        }
        return {
          ...item,
          pricePerQuantity: cookedFoodName.pricePerQuantity || 0,
        };
      }),
    );

    createOrderDto.items = items;

    const createdOrder = await this.orderRepository.create({
      ...createOrderDto,
      orderId,
      user: user ? (user._id as Types.ObjectId) : undefined,
      orders: items,
      processingFee: createOrderDto.processingFee,
    });

    return createdOrder;
  }

  async getOrderByOrderId(orderId: string): Promise<Order & { _id: Types.ObjectId; items: Omit<OrderItem, 'itemId'>[] }> {
    const order = await this.orderRepository.findOneAndPopulate(
      { orderId },
      { path: 'orders.itemId', select: 'name pricePerQuantity category' },
    );

    const populateOptions = [{ path: 'cashierId', select: 'firstName lastName email role' }];

    if (!order) {
      throw BadRequestException.RESOURCE_NOT_FOUND('Order not found');
    }

    const ticket = await this.ticketRepository.findOneAndPopulate(
      {
        order: (order as any)._id,
      },
      populateOptions,
    );
    return {
      _id: (order as any)._id,
      orderId: order.orderId,
      user: order.user,
      status: order.status,
      orders: order.orders.map((item) => {
        return {
          _id: (item.itemId as any)._id,
          price: item.pricePerQuantity || 0,
          name: (item.itemId as any).name,
          category: (item.itemId as any).category,
          quantity: item.quantity,
          pricePerQuantity: item.pricePerQuantity,
        };
      }),
      createdAt: (order as any).createdAt,
      updatedAt: (order as any).updatedAt,
      processingFee: order.processingFee,

      ticket,
    } as any;
  }

  async getMenuItems(): Promise<CookedFoodName[]> {
    const menuItems = await this.cookedFoodNameRepository.findAll({ isActive: true }, 0, 0, { name: 1 });
    return menuItems.map((item) => {
      return {
        ...item.toObject(),
        price: item.pricePerQuantity || 0,
      };
    });
  }

  async getOrdersReport(dateRange: ReportDateRangeDto) {
    const { startDate, endDate, page = 1, limit = 10 } = dateRange;

    const start = moment(startDate).startOf('day').toDate();
    const end = moment(endDate).endOf('day').toDate();

    const dateQuery = {
      $gte: start,
      $lte: end,
    };

    const orders = await this.orderRepository.findAllAndPopulate({ createdAt: dateQuery, status: OrderStatus.FULFILLED }, [
      {
        path: 'orders.itemId',
        select: 'name purchaseUnit measurementUnit',
      },
    ]);

    const cookedFoodNameIds = orders.flatMap((order) => order.orders.map((item) => (item.itemId as any)._id));

    const cookedFoods = await this.cookedFoodRepository.findAll({
      cookedFoodNameId: { $in: cookedFoodNameIds },
      preparationDate: dateQuery,
    });

    const cookedFoodMap = cookedFoods.reduce((acc, cookedFood) => {
      const date = moment(cookedFood.preparationDate).tz('Africa/Lagos').format('YYYY-MM-DD');
      const key = `${(cookedFood.cookedFoodNameId as any).toString()}-${date}`;
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key] += cookedFood.preparedQuantityKg;
      return acc;
    }, {});

    const tickets = await this.ticketRepository.findAll({ createdAt: dateQuery });
    const redemptions = await this.redemptionRepository.findAllAndPopulate({ redeemedAt: dateQuery }, [
      {
        path: 'ticketId',
        select: 'amount',
      },
    ]);

    const report = {};

    // Process orders
    for (const order of orders) {
      const date = moment((order as any).createdAt)
        .tz('Africa/Lagos')
        .format('YYYY-MM-DD');
      if (!report[date]) {
        this.initializeDateReport(report, date);
      }

      for (const orderItem of order.orders) {
        const existingOrder = this.findExistingOrder(report, date, (orderItem.itemId as any).name);
        const key = `${(orderItem.itemId as any)._id.toString()}-${date}`;
        const quantityCooked = cookedFoodMap[key] || 0;

        if (existingOrder) {
          this.updateExistingOrder(existingOrder, orderItem, quantityCooked);
        } else {
          this.addNewOrder(report, date, orderItem, quantityCooked);
        }
      }
    }

    // Process tickets
    for (const ticket of tickets) {
      const date = moment((ticket as any).createdAt)
        .tz('Africa/Lagos')
        .format('YYYY-MM-DD');
      if (!report[date]) {
        this.initializeDateReport(report, date);
      }
      report[date].ticketGenerated += 1;
      report[date].ticketValueGenerated += ticket.amount;
    }

    // Process redemptions
    for (const redemption of redemptions) {
      const date = moment(redemption.redeemedAt).tz('Africa/Lagos').format('YYYY-MM-DD');
      if (!report[date]) {
        this.initializeDateReport(report, date);
      }
      report[date].ticketRedeemed += 1;
      report[date].ticketValueRedeemed += (redemption.ticketId as any).amount;
    }

    const reportValues = Object.values(report);
    const totalRecords = reportValues.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const paginatedData = reportValues.slice((page - 1) * limit, page * limit);

    return {
      data: paginatedData,
      totalRecords,
      totalPages,
    };
  }

  private initializeDateReport(report, date) {
    report[date] = {
      date,
      orders: [],
      ticketGenerated: 0,
      ticketValueGenerated: 0,
      ticketRedeemed: 0,
      ticketValueRedeemed: 0,
    };
  }

  private findExistingOrder(report, date, name) {
    return report[date].orders.find((o) => o.name === name);
  }

  private updateExistingOrder(existingOrder, orderItem, quantityCooked) {
    existingOrder.quantitySold += orderItem.quantity;
    existingOrder.amountRevenue += orderItem.quantity * orderItem.pricePerQuantity;
    existingOrder.quantityCooked = quantityCooked;
  }

  private addNewOrder(report, date, orderItem, quantityCooked) {
    report[date].orders.push({
      name: (orderItem.itemId as any).name,
      quantityCooked: quantityCooked,
      measurementUnit: (orderItem.itemId as any).measurementUnit,
      quantitySold: orderItem.quantity,
      purchaseUnit: (orderItem.itemId as any).purchaseUnit,
      pricePerQuantityForSold: orderItem.pricePerQuantity,
      amountRevenue: orderItem.quantity * orderItem.pricePerQuantity,
    });
  }

  async deleteManyOrders() {
    const result = await this.orderRepository.deleteMany({
      status: { $ne: OrderStatus.FULFILLED }, // adjust your condition
    });

    return result;
  }
}
