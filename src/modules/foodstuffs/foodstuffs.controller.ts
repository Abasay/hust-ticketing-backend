import { Controller, UseGuards, Post, Get, Put, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { FoodstuffsService } from './foodstuffs.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Roles } from '../tickets/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import {
  CreateFoodstuffReqDto,
  CreateFoodstuffResDto,
  UpdateFoodstuffReqDto,
  UpdateFoodstuffResDto,
  GetFoodstuffResDto,
  DeleteFoodstuffResDto,
  AddActivityReqDto,
  AddActivityResDto,
  GetActivitiesReqDto,
  GetActivitiesResDto,
  DashboardResDto,
  StockAlertsResDto,
  GenerateReportReqDto,
  ReportResDto,
  BulkPurchaseByNameReqDto,
  BulkPurchaseByNameResDto,
} from './dtos';

@ApiTags('Foodstuffs')
@Controller('foodstuffs')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
export class FoodstuffsController {
  constructor(private readonly foodstuffsService: FoodstuffsService) {}

  // CRUD Operations
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new foodstuff (Admin only)' })
  @ApiResponse({ status: 201, description: 'Foodstuff created successfully', type: CreateFoodstuffResDto })
  async createFoodstuff(@Body(ValidationPipe) createFoodstuffDto: CreateFoodstuffReqDto): Promise<CreateFoodstuffResDto> {
    return this.foodstuffsService.createFoodstuff(createFoodstuffDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all foodstuffs with filtering and pagination' })
  async getAllFoodstuffs(@Query() query: any) {
    return this.foodstuffsService.getAllFoodstuffs(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics and data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: DashboardResDto })
  async getDashboard() {
    return this.foodstuffsService.getDashboard();
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Get current stock alerts' })
  @ApiResponse({ status: 200, description: 'Stock alerts retrieved successfully', type: StockAlertsResDto })
  async getStockAlerts() {
    return this.foodstuffsService.getStockAlerts();
  }

  @Get('reports')
  @ApiOperation({ summary: 'Generate various reports' })
  @ApiResponse({ status: 200, description: 'Report generated successfully', type: ReportResDto })
  async generateReport(@Query(ValidationPipe) query: GenerateReportReqDto): Promise<ReportResDto> {
    return this.foodstuffsService.generateReport(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific foodstuff by ID' })
  @ApiResponse({ status: 200, description: 'Foodstuff retrieved successfully', type: GetFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async getFoodstuffById(@Param('id') id: string) {
    return this.foodstuffsService.getFoodstuffById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a foodstuff' })
  @ApiResponse({ status: 200, description: 'Foodstuff updated successfully', type: UpdateFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async updateFoodstuff(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFoodstuffDto: UpdateFoodstuffReqDto,
  ): Promise<UpdateFoodstuffResDto> {
    return this.foodstuffsService.updateFoodstuff(id, updateFoodstuffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a foodstuff' })
  @ApiResponse({ status: 200, description: 'Foodstuff deleted successfully', type: DeleteFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete foodstuff with existing activities' })
  async deleteFoodstuff(@Param('id') id: string): Promise<DeleteFoodstuffResDto> {
    return this.foodstuffsService.deleteFoodstuff(id);
  }

  // Activity Management
  @Post(':id/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add activity to foodstuff (purchase, usage, wastage, correction)' })
  @ApiResponse({ status: 201, description: 'Activity added successfully', type: AddActivityResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async addActivity(
    @Param('id') foodstuffId: string,
    @Body(ValidationPipe) addActivityDto: AddActivityReqDto,
    @GetUser() user: any,
  ): Promise<AddActivityResDto> {
    return this.foodstuffsService.addActivity(foodstuffId, addActivityDto, user._id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get activity history for a specific foodstuff' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully', type: GetActivitiesResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async getActivities(@Param('id') foodstuffId: string, @Query(ValidationPipe) query: GetActivitiesReqDto): Promise<GetActivitiesResDto> {
    return this.foodstuffsService.getActivities(foodstuffId, query);
  }

  // Bulk Purchase Operations
  @Post('bulk-purchase-by-name')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bulk purchase activities using foodstuff names',
    description: 'This endpoint accepts an array of purchase items with foodstuff names and units. If a foodstuff does not exist, it will be created automatically. Names are matched case-insensitively to prevent duplicates.'
  })
  @ApiResponse({ status: 201, description: 'Bulk purchase completed successfully', type: BulkPurchaseByNameResDto })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async bulkPurchaseByName(
    @Body(ValidationPipe) bulkPurchaseDto: BulkPurchaseByNameReqDto,
    @GetUser() user: any,
  ): Promise<BulkPurchaseByNameResDto> {
    return this.foodstuffsService.bulkPurchaseByName(bulkPurchaseDto, user._id);
  }
}
