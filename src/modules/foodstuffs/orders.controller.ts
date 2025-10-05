import { Body, Controller, Get, HttpCode, Param, Post, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dtos/create-order.dto';
import { OrderDto } from './dtos/order.dto';

@ApiTags('Foodstuffs/Orders')
@Controller('foodstuffs/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create a new order' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Invalid request body' })
  @HttpCode(201)
  @Post()
  async createOrder(@Body(ValidationPipe) createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(createOrderDto);
  }

  @ApiOperation({ summary: 'Get Menu Items' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Menu Items not found' })
  @HttpCode(200)
  @Get('menu-items')
  async getMenuItems() {
    return this.ordersService.getMenuItems();
  }

  @ApiOperation({ summary: 'Get an order by its ID' })
  @ApiOkResponse({ type: OrderDto })
  @ApiBadRequestResponse({ description: 'Order not found' })
  @HttpCode(200)
  @Get('order/:orderId')
  async getOrderByOrderId(@Param('orderId') orderId: string) {
    return this.ordersService.getOrderByOrderId(orderId);
  }
}
