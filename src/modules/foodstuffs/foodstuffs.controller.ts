import { Controller, UseGuards, Post, Get, Put, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { FoodstuffsService } from './foodstuffs.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
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
@Controller('foodstuffs/:storeType')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
export class FoodstuffsController {
  constructor(private readonly foodstuffsService: FoodstuffsService) {}

  // ========== POST ROUTES (specific routes first, then dynamic) ==========

  // CRUD Operations
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new foodstuff (Admin only)' })
  @ApiResponse({ status: 201, description: 'Foodstuff created successfully', type: CreateFoodstuffResDto })
  async createFoodstuff(
    @Param('storeType') storeType: string,
    @Query('stockType') stockType: string,
    @Body(ValidationPipe) createFoodstuffDto: CreateFoodstuffReqDto,
  ): Promise<CreateFoodstuffResDto> {
    return this.foodstuffsService.createFoodstuff(storeType, createFoodstuffDto);
  }

  // Bulk Purchase Operations (must be before :id routes)
  @Post('bulk-purchase-by-name')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create bulk purchase activities using foodstuff names',
    description:
      'This endpoint accepts an array of purchase items with foodstuff names and units. If a foodstuff does not exist, it will be created automatically. Names are matched case-insensitively to prevent duplicates.',
  })
  @ApiResponse({ status: 201, description: 'Bulk purchase completed successfully', type: BulkPurchaseByNameResDto })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async bulkPurchaseByName(
    @Param('storeType') storeType: string,
    @Query('stockType') stockType: string,
    @Query('month') month: string,
    @Body(ValidationPipe) bulkPurchaseDto: BulkPurchaseByNameReqDto,
    @GetUser() user: any,
  ): Promise<BulkPurchaseByNameResDto> {
    console.log(stockType, month);
    return this.foodstuffsService.bulkPurchaseByName(storeType, bulkPurchaseDto, user._id, stockType, month);
  }

  // Activity Management (dynamic routes with :id)
  @Post(':id/activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add activity to foodstuff (purchase, usage, wastage, correction)' })
  @ApiResponse({ status: 201, description: 'Activity added successfully', type: AddActivityResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async addActivity(
    @Param('storeType') storeType: string,
    @Param('id') foodstuffId: string,
    @Query('stockType') stockType: string,
    @Query('month') month: string,
    @Body(ValidationPipe) addActivityDto: AddActivityReqDto,
    @GetUser() user: any,
  ): Promise<AddActivityResDto> {
    return this.foodstuffsService.addActivity(storeType, foodstuffId, addActivityDto, user._id, month, stockType);
  }

  // ========== GET ROUTES (specific routes first, then dynamic) ==========

  // Specific GET routes (must be before :id routes to avoid collision)
  @Get('/names/foodstuffs/all')
  @ApiOperation({ summary: 'Get all foodstuff names and units for CSV template' })
  async getAllNamesForCSV(@Param('storeType') storeType: string) {
    console.log(storeType);
    return this.foodstuffsService.getAllFoodstuffsForCSV(storeType);
  }

  @Get('/reports/all')
  @ApiOperation({ summary: 'Get all store report' })
  async getAllReport(@Param('storeType') storeType: string) {
    return this.foodstuffsService.fetchFoodstuffReport(storeType);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics and data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully', type: DashboardResDto })
  async getDashboard(@Param('storeType') storeType: string) {
    return this.foodstuffsService.getDashboard(storeType);
  }

  @Get('stock-alerts')
  @ApiOperation({ summary: 'Get current stock alerts' })
  @ApiResponse({ status: 200, description: 'Stock alerts retrieved successfully', type: StockAlertsResDto })
  async getStockAlerts(@Param('storeType') storeType: string) {
    return this.foodstuffsService.getStockAlerts(storeType);
  }

  @Get('reports')
  @ApiOperation({ summary: 'Generate various reports' })
  @ApiResponse({ status: 200, description: 'Report generated successfully', type: ReportResDto })
  async generateReport(@Param('storeType') storeType: string, @Query(ValidationPipe) query: GenerateReportReqDto): Promise<ReportResDto> {
    return this.foodstuffsService.generateReport(storeType, query);
  }

  // Base GET route
  @Get()
  @ApiOperation({ summary: 'Get all foodstuffs with filtering and pagination' })
  async getAllFoodstuffs(@Param('storeType') storeType: string, @Query() query: any) {
    return this.foodstuffsService.getAllFoodstuffs(storeType, query);
  }

  // Dynamic GET routes with :id (must come after all specific routes)
  @Get(':id/activities')
  @ApiOperation({ summary: 'Get activity history for a specific foodstuff' })
  @ApiResponse({ status: 200, description: 'Activities retrieved successfully', type: GetActivitiesResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async getActivities(
    @Param('storeType') storeType: string,
    @Param('id') foodstuffId: string,
    @Query(ValidationPipe) query: GetActivitiesReqDto,
  ): Promise<GetActivitiesResDto> {
    return this.foodstuffsService.getActivities(storeType, foodstuffId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific foodstuff by ID' })
  @ApiResponse({ status: 200, description: 'Foodstuff retrieved successfully', type: GetFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async getFoodstuffById(@Param('storeType') storeType: string, @Param('id') id: string) {
    return this.foodstuffsService.getFoodstuffById(storeType, id);
  }

  // ========== PUT/DELETE ROUTES (dynamic only) ==========

  @Put(':id')
  @ApiOperation({ summary: 'Update a foodstuff' })
  @ApiResponse({ status: 200, description: 'Foodstuff updated successfully', type: UpdateFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  async updateFoodstuff(
    @Param('storeType') storeType: string,
    @Param('id') id: string,
    @Body(ValidationPipe) updateFoodstuffDto: UpdateFoodstuffReqDto,
  ): Promise<UpdateFoodstuffResDto> {
    return this.foodstuffsService.updateFoodstuff(storeType, id, updateFoodstuffDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a foodstuff' })
  @ApiResponse({ status: 200, description: 'Foodstuff deleted successfully', type: DeleteFoodstuffResDto })
  @ApiResponse({ status: 404, description: 'Foodstuff not found' })
  @ApiResponse({ status: 400, description: 'Cannot delete foodstuff with existing activities' })
  async deleteFoodstuff(@Param('storeType') storeType: string, @Param('id') id: string): Promise<DeleteFoodstuffResDto> {
    return this.foodstuffsService.deleteFoodstuff(storeType, id);
  }
}
