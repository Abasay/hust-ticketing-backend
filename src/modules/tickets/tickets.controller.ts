import { Controller, UseGuards, Post, Get, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import {
  GenerateTicketReqDto,
  GenerateTicketResDto,
  RedeemTicketReqDto,
  RedeemTicketResDto,
  DeleteTicketResDto,
  TicketFilterDto,
  TicketListResDto,
  TicketStatsResDto,
  AdminTicketStatsResDto,
  GetTicketByNumberResDto,
  VendorRedeemedTicketsReqDto,
  VendorRedeemedTicketsResDto,
  CashierIssuedStatsResDto,
  VendorRedeemedStatsResDto,
} from './dtos';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post('generate')
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new ticket (Cashier/Admin only)' })
  @ApiResponse({ status: 201, description: 'Ticket generated successfully', type: GenerateTicketResDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cashier or Admin access required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async generateTicket(@Body(ValidationPipe) generateTicketDto: GenerateTicketReqDto, @GetUser() user: any): Promise<GenerateTicketResDto> {
    return this.ticketsService.generateTicket(generateTicketDto, user._id);
  }

  @Post('redeem')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Redeem a ticket (Vendor/Admin only)' })
  @ApiResponse({ status: 200, description: 'Ticket redeemed successfully', type: RedeemTicketResDto })
  @ApiResponse({ status: 400, description: 'Bad request - ticket already redeemed or expired' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor or Admin access required' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async redeemTicket(@Body(ValidationPipe) redeemTicketDto: RedeemTicketReqDto, @GetUser() user: any): Promise<RedeemTicketResDto> {
    console.log('redeemTicketDto', redeemTicketDto);
    return this.ticketsService.redeemTicket(redeemTicketDto, user._id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiResponse({ status: 200, description: 'Ticket deleted successfully', type: DeleteTicketResDto })
  @ApiResponse({ status: 400, description: 'Bad request - ticket cannot be deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  async deleteTicket(@Param('id') ticketId: string, @GetUser() user: any): Promise<DeleteTicketResDto> {
    return this.ticketsService.deleteTicket(ticketId, user._id);
  }

  @Get('my-tickets')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tickets for the logged-in user' })
  @ApiResponse({ status: 200, description: 'User tickets retrieved successfully', type: TicketListResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserTickets(@Query(ValidationPipe) filterDto: TicketFilterDto, @GetUser() user: any): Promise<TicketListResDto> {
    return this.ticketsService.getUserTickets(user._id, filterDto);
  }

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get ticket statistics for the logged-in user' })
  @ApiResponse({ status: 200, description: 'Ticket statistics retrieved successfully', type: TicketStatsResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTicketStats(@GetUser() user: any): Promise<TicketStatsResDto> {
    return this.ticketsService.getTicketStats(user._id);
  }

  @Get('admin/logs')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all ticket logs for admin (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin ticket logs retrieved successfully', type: TicketListResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAdminTicketLogs(@Query(ValidationPipe) filterDto: TicketFilterDto): Promise<TicketListResDto> {
    return this.ticketsService.getAdminTicketLogs(filterDto);
  }

  @Get('admin/logs/export')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all ticket logs for admin (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin ticket logs retrieved successfully', type: TicketListResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAdminTicketLogsAll(@Query(ValidationPipe) filterDto: TicketFilterDto): Promise<TicketListResDto> {
    return this.ticketsService.getAdminTicketLogsExport(filterDto);
  }

  @Get('admin/stats')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get comprehensive ticket statistics for admin (Admin only)' })
  @ApiResponse({ status: 200, description: 'Admin ticket statistics retrieved successfully', type: AdminTicketStatsResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  async getAdminTicketStats(): Promise<AdminTicketStatsResDto> {
    return this.ticketsService.getAdminTicketStats();
  }

  @Get('by-number/:ticketNo')
  @Roles(UserRole.CASHIER, UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get ticket by ticket number' })
  @ApiResponse({ status: 200, description: 'Ticket retrieved successfully', type: GetTicketByNumberResDto })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTicketByNumber(@Param('ticketNo') ticketNo: string): Promise<GetTicketByNumberResDto> {
    return this.ticketsService.getTicketByNumber(ticketNo);
  }

  @Get('vendor/redeemed')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get tickets redeemed by vendor' })
  @ApiResponse({ status: 200, description: 'Vendor redeemed tickets retrieved successfully', type: VendorRedeemedTicketsResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor or Admin access required' })
  async getVendorRedeemedTickets(
    @GetUser() user: any,
    @Query() filterDto: VendorRedeemedTicketsReqDto,
  ): Promise<VendorRedeemedTicketsResDto> {
    return this.ticketsService.getVendorRedeemedTickets(user._id, filterDto);
  }

  @Get('cashier/issued-stats')
  @Roles(UserRole.CASHIER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cashier issued tickets statistics' })
  @ApiResponse({ status: 200, description: 'Cashier issued tickets statistics retrieved successfully', type: CashierIssuedStatsResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Cashier or Admin access required' })
  async getCashierIssuedStats(@GetUser() user: any): Promise<CashierIssuedStatsResDto> {
    return this.ticketsService.getCashierIssuedStats(user._id);
  }

  @Get('vendor/redeemed-stats')
  @Roles(UserRole.VENDOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vendor redeemed tickets statistics' })
  @ApiResponse({ status: 200, description: 'Vendor redeemed tickets statistics retrieved successfully', type: VendorRedeemedStatsResDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Vendor or Admin access required' })
  async getVendorRedeemedStats(@GetUser() user: any): Promise<VendorRedeemedStatsResDto> {
    return this.ticketsService.getVendorRedeemedStats(user._id);
  }
}
