import { Controller, UseGuards, Post, Get, Put, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CookedFoodNamesService } from './cooked-food-names.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../tickets/guards/roles.guard';
import { Roles } from '../tickets/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import {
  CreateCookedFoodNameReqDto,
  CreateCookedFoodNameResDto,
  UpdateCookedFoodNameReqDto,
  UpdateCookedFoodNameResDto,
  GetCookedFoodNamesResDto,
  DeleteCookedFoodNameResDto,
} from './dtos';

@ApiTags('Cooked Food Names')
@Controller('cooked-food-names')
@UseGuards(JwtUserAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(UserRole.ADMIN, UserRole.STORE_MANAGER, UserRole.CASHIER)
export class CookedFoodNamesController {
  constructor(private readonly cookedFoodNamesService: CookedFoodNamesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new cooked food name (Admin only)' })
  @ApiResponse({ status: 201, description: 'Cooked food name created successfully', type: CreateCookedFoodNameResDto })
  async createCookedFoodName(@Body(ValidationPipe) createDto: CreateCookedFoodNameReqDto): Promise<CreateCookedFoodNameResDto> {
    return this.cookedFoodNamesService.createCookedFoodName(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cooked food names with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Cooked food names retrieved successfully', type: GetCookedFoodNamesResDto })
  async getAllCookedFoodNames(@Query() query: any): Promise<GetCookedFoodNamesResDto> {
    return this.cookedFoodNamesService.getAllCookedFoodNames(query);
  }

  @Get('dropdown')
  @ApiOperation({ summary: 'Get cooked food names for dropdown (active only)' })
  async getCookedFoodNamesDropdown() {
    const names = await this.cookedFoodNamesService.getCookedFoodNamesDropdown();
    return {
      message: 'Cooked food names retrieved successfully',
      names,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific cooked food name by ID' })
  async getCookedFoodNameById(@Param('id') id: string) {
    return this.cookedFoodNamesService.getCookedFoodNameById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a cooked food name' })
  @ApiResponse({ status: 200, description: 'Cooked food name updated successfully', type: UpdateCookedFoodNameResDto })
  async updateCookedFoodName(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateCookedFoodNameReqDto,
  ): Promise<UpdateCookedFoodNameResDto> {
    return this.cookedFoodNamesService.updateCookedFoodName(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a cooked food name' })
  @ApiResponse({ status: 200, description: 'Cooked food name deleted successfully', type: DeleteCookedFoodNameResDto })
  async deleteCookedFoodName(@Param('id') id: string): Promise<DeleteCookedFoodNameResDto> {
    return this.cookedFoodNamesService.deleteCookedFoodName(id);
  }
}
