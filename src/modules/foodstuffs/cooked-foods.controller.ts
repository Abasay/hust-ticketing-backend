import { Controller, UseGuards, Post, Get, Put, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CookedFoodsService } from './cooked-foods.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Roles } from '../tickets/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import {
  CreateCookedFoodReqDto,
  CreateCookedFoodResDto,
  UpdateCookedFoodReqDto,
  UpdateCookedFoodResDto,
  GetCookedFoodsResDto,
  DeleteCookedFoodResDto,
  CookedFoodDashboardResDto,
} from './dtos';

@ApiTags('Cooked Foods')
@Controller('cooked-foods')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.STORE_MANAGER)
export class CookedFoodsController {
  constructor(private readonly cookedFoodsService: CookedFoodsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cooked food record (Admin only)' })
  @ApiResponse({ status: 201, description: 'Cooked food record created successfully', type: CreateCookedFoodResDto })
  async createCookedFood(@Body(ValidationPipe) createDto: CreateCookedFoodReqDto, @GetUser() user: any): Promise<CreateCookedFoodResDto> {
    return this.cookedFoodsService.createCookedFood(createDto, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cooked food records with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Cooked food records retrieved successfully', type: GetCookedFoodsResDto })
  async getAllCookedFoods(@Query() query: any): Promise<GetCookedFoodsResDto> {
    return this.cookedFoodsService.getAllCookedFoods(query);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get cooked food dashboard statistics and data' })
  @ApiResponse({ status: 200, description: 'Cooked food dashboard data retrieved successfully', type: CookedFoodDashboardResDto })
  async getCookedFoodDashboard(): Promise<CookedFoodDashboardResDto> {
    return this.cookedFoodsService.getCookedFoodDashboard();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific cooked food record by ID' })
  async getCookedFoodById(@Param('id') id: string) {
    return this.cookedFoodsService.getCookedFoodById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cooked food record (sold/leftover quantities)' })
  @ApiResponse({ status: 200, description: 'Cooked food record updated successfully', type: UpdateCookedFoodResDto })
  async updateCookedFood(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateCookedFoodReqDto,
  ): Promise<UpdateCookedFoodResDto> {
    return this.cookedFoodsService.updateCookedFood(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cooked food record' })
  @ApiResponse({ status: 200, description: 'Cooked food record deleted successfully', type: DeleteCookedFoodResDto })
  async deleteCookedFood(@Param('id') id: string): Promise<DeleteCookedFoodResDto> {
    return this.cookedFoodsService.deleteCookedFood(id);
  }
}
