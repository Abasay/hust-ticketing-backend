import { Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class OrdersService {
  constructor(
    @Inject(Repositories.OrderRepository) private readonly orderRepository: BaseRepository<Order>,
    @Inject(Repositories.CookedFoodNameRepository) private readonly cookedFoodNameRepository: BaseRepository<CookedFoodName>,
    @Inject(Repositories.UserRepository) private readonly userRepository: BaseRepository<User>,
    @Inject(Repositories.TicketRepository) private readonly ticketRepository: BaseRepository<Ticket>,
    @Inject(Repositories.RedemptionRepository) private readonly redemptionRepository: BaseRepository<Redemption>,
    @Inject(Repositories.CookedFoodRepository) private readonly cookedFoodRepository: BaseRepository<CookedFood>,
  ) {}

  private async generateOrderId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const length = 5;

    const existingOrders = await this.orderRepository.findAll({});

    // Convert string to array to allow splicing (for no repetition)
    const charsArray = chars.split('');
    let order = '';

    for (let i = 0; i < length; i++) {
      const randIndex = Math.floor(Math.random() * charsArray.length);
      order += charsArray[randIndex];
      charsArray.splice(randIndex, 1); // remove picked char to avoid repetition
    }

    while (existingOrders.find((ord) => ord.orderId === order)) {
      order = await this.generateOrderId();
    }

    return `${order}`;
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
    if (!order) {
      throw BadRequestException.RESOURCE_NOT_FOUND('Order not found');
    }
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

    const orders = await this.orderRepository.findAllAndPopulate({ createdAt: dateQuery }, [
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
}
