import { Body, Controller, Get, HttpCode, Logger, Param, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { CreateOrderWithPaymentDto } from './dtos/create-order-with-payment.dto';
import { OrderDto } from './dtos/order.dto';
import { ReportDateRangeDto } from './dtos/reports.dto';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import { Cron } from '@nestjs/schedule';

@ApiTags('Foodstuffs/Orders')
@Controller('foodstuffs/orders')
export class OrdersController {
  private readonly logger = new Logger('Order Cron Job');
  constructor(private readonly ordersService: OrdersService) {}

  @Cron('0 0 * * *')
  async deleteUnfulfilledOrders() {
    try {
      this.logger.log('Running midnight cleanup: Removing unfulfilled orders...');

      // delete orders that are NOT fulfilled

      const result = await this.ordersService.deleteManyOrders();
      this.logger.log(`Midnight cleanup finished. Deleted ${(result as any).deletedCount} unfulfilled orders.`);
    } catch (error) {
      this.logger.error('Error deleting unfulfilled orders', error.stack);
    }
  }
  //Fix

  @ApiOperation({ summary: 'Create a new order' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @HttpCode(201)
  @Post('/order/create')
  async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @ApiOperation({
    summary: 'Create a new order with Paystack payment verification',
    description: 'Verifies Paystack payment, creates order, and generates ticket without processing fee',
  })
  @ApiOkResponse({
    description: 'Order created successfully with ticket generated',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Order created successfully and ticket generated' },
        order: {
          type: 'object',
          properties: {
            orderId: { type: 'string', example: 'ABC12' },
            processingFee: { type: 'number', example: 0 },
            status: { type: 'string', example: 'FULFILLED' },
          },
        },
        ticket: {
          type: 'object',
          properties: {
            ticketNo: { type: 'string', example: 'TKT-A1B2C' },
            amount: { type: 'number', example: 5000 },
            status: { type: 'string', example: 'ISSUED' },
          },
        },
        paymentVerification: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            amount: { type: 'number', example: 5000 },
            currency: { type: 'string', example: 'NGN' },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Payment verification failed or invalid request body' })
  @HttpCode(201)
  @Post('with-payment')
  async createOrderWithPayment(@Body(ValidationPipe) createOrderDto: CreateOrderWithPaymentDto) {
    return this.ordersService.createOrderWithPayment(createOrderDto);
  }

  @ApiOperation({ summary: 'Get Menu Items' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Menu Items not found' })
  @HttpCode(200)
  @Get('menu-items/users/general')
  async getMenuItems() {
    return this.ordersService.getMenuItems();
  }

  @ApiOperation({ summary: 'Get an order by its ID' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Order not found' })
  @HttpCode(200)
  @Get('order/operators/:orderId')
  async getOrderByOrderId(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderByOrderId(orderId);
  }

  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
  @ApiOperation({ summary: 'Get orders report' })
  @ApiOkResponse({ description: 'Report generated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @HttpCode(200)
  @Get('admin/report')
  async getOrdersReport(@Query(ValidationPipe) dateRange: ReportDateRangeDto) {
    return this.ordersService.getOrdersReport(dateRange);
  }
}
