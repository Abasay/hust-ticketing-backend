import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Repositories } from 'src/shared/enums';
import { BaseRepository } from 'src/modules/repository/base.repository';
import { Order } from 'src/modules/foodstuffs/schemas/order.schema';
import { OrderStatus } from 'src/shared/constants';

@Injectable()
export class CronJobService {
  private readonly logger = new Logger(CronJobService.name);
  private readonly pingUrl = 'https://hust-ticketing-backend.onrender.com';

  constructor(
    private readonly httpService: HttpService,
    // @Inject(Repositories.OrderRepository) private readonly orderRepository: BaseRepository<Order>,
  ) {}

  // @Cron('*/2 * * * *')
  // async deleteUnfulfilledOrders() {
  //   try {
  //     this.logger.log('Running midnight cleanup: Removing unfulfilled orders...');

  //     // delete orders that are NOT fulfilled
  //     const result = await this.orderRepository.delete({
  //       status: { $ne: OrderStatus.FULFILLED }, // adjust your condition
  //     });

  //     this.logger.log(`Midnight cleanup finished. Deleted ${(result as any).deletedCount} unfulfilled orders.`);
  //   } catch (error) {
  //     this.logger.error('Error deleting unfulfilled orders', error.stack);
  //   }
  // }

  @Cron('*/5 * * * *') // Every 5 minutes
  async pingServer() {
    try {
      this.logger.log(`Pinging server at ${this.pingUrl}...`);

      const startTime = Date.now();
      const response = await firstValueFrom(
        this.httpService.get(this.pingUrl, {
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'HUST-Ticketing-Cron-Job/1.0',
          },
        }),
      );

      const responseTime = Date.now() - startTime;

      this.logger.log(`Server ping successful - Status: ${response.status}, Response time: ${responseTime}ms`);
    } catch (error) {
      this.logger.error(`Failed to ping server at ${this.pingUrl}: ${error.message}`, error.stack);
    }
  }
}
