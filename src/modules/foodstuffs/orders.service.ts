import { Inject, Injectable } from '@nestjs/common';
import { Repositories } from 'src/shared/enums';
import { BaseRepository } from '../repository/base.repository';
import { Order, OrderItem } from './schemas/order.schema';
import { CreateOrderDto } from './dtos/create-order.dto';
import { BadRequestException } from 'src/exceptions';
import { Types } from 'mongoose';
import { CookedFoodName } from './schemas/cooked-food-name.schema';
import { User } from '../user/user.schema';

@Injectable()
export class OrdersService {
  constructor(
    @Inject(Repositories.OrderRepository) private readonly orderRepository: BaseRepository<Order>,
    @Inject(Repositories.CookedFoodNameRepository) private readonly cookedFoodNameRepository: BaseRepository<CookedFoodName>,
    @Inject(Repositories.UserRepository) private readonly userRepository: BaseRepository<User>,
  ) {}

  private async generateOrderId(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
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
}
