import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums/db.enum';
import { DatabaseModelNames } from 'src/shared/constants';
import {
  CreateCookedFoodReqDto,
  CreateCookedFoodResDto,
  UpdateCookedFoodReqDto,
  UpdateCookedFoodResDto,
  GetCookedFoodsResDto,
  DeleteCookedFoodResDto,
  CookedFoodStatsResDto,
  CookedFoodDashboardResDto,
} from './dtos';

@Injectable()
export class CookedFoodsService {
  constructor(
    @Inject(Repositories.CookedFoodRepository)
    private readonly cookedFoodRepository: BaseRepository<any>,
    @Inject(Repositories.CookedFoodNameRepository)
    private readonly cookedFoodNameRepository: BaseRepository<any>,
  ) {}

  async createCookedFood(createDto: CreateCookedFoodReqDto, userId: string): Promise<CreateCookedFoodResDto> {
    // Validate cooked food name exists
    const cookedFoodName = await this.cookedFoodNameRepository.findById(createDto.cookedFoodNameId);
    if (!cookedFoodName) {
      throw new NotFoundException('Cooked food name not found');
    }

    const cookedFoodData = {
      ...createDto,
      preparedBy: userId,
      preparationDate: createDto.preparationDate ? new Date(createDto.preparationDate) : new Date(),
      leftoverQuantityKg: createDto.preparedQuantityKg, // Initially all prepared quantity is leftover
    };

    const cookedFood = await this.cookedFoodRepository.create(cookedFoodData);

    // Populate the response
    const populatedCookedFood = await this.cookedFoodRepository.findOneAndPopulate({ _id: cookedFood._id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'preparedBy', select: 'firstName lastName email' },
    ]);

    return {
      message: 'Cooked food record created successfully',
      cookedFood: populatedCookedFood,
    };
  }

  async getAllCookedFoods(query: any): Promise<GetCookedFoodsResDto> {
    const { page = 1, limit = 10, cookedFoodNameId, startDate, endDate, sortBy = 'preparationDate', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (cookedFoodNameId) {
      filter.cookedFoodNameId = cookedFoodNameId;
    }

    if (startDate || endDate) {
      filter.preparationDate = {};
      if (startDate) filter.preparationDate.$gte = new Date(startDate);
      if (endDate) filter.preparationDate.$lte = new Date(endDate);
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [cookedFoods, total] = await Promise.all([
      this.cookedFoodRepository.findAllAndPopulate(
        filter,
        [
          { path: 'cookedFoodNameId', select: 'name description' },
          { path: 'preparedBy', select: 'firstName lastName email' },
        ],
        sort,
        skip,
        limit,
      ),
      this.cookedFoodRepository.count(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page);

    return {
      message: 'Cooked foods retrieved successfully',
      data: {
        cookedFoods,
        total,
        page: currentPage,
        limit: parseInt(limit),
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };
  }

  async getCookedFoodById(id: string) {
    const cookedFood = await this.cookedFoodRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'preparedBy', select: 'firstName lastName email' },
    ]);

    if (!cookedFood) {
      throw new NotFoundException('Cooked food record not found');
    }

    return {
      message: 'Cooked food record retrieved successfully',
      cookedFood,
    };
  }

  async updateCookedFood(id: string, updateDto: UpdateCookedFoodReqDto): Promise<UpdateCookedFoodResDto> {
    const existingCookedFood = await this.cookedFoodRepository.findById(id);
    if (!existingCookedFood) {
      throw new NotFoundException('Cooked food record not found');
    }

    // Validate quantities
    const soldQty = updateDto.soldQuantityKg ?? existingCookedFood.soldQuantityKg;
    const leftoverQty = updateDto.leftoverQuantityKg ?? existingCookedFood.leftoverQuantityKg;

    if (soldQty + leftoverQty > existingCookedFood.preparedQuantityKg) {
      throw new BadRequestException('Total sold and leftover quantity cannot exceed prepared quantity');
    }

    const cookedFood = await this.cookedFoodRepository.update({ _id: id }, updateDto);

    const populatedCookedFood = await this.cookedFoodRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'preparedBy', select: 'firstName lastName email' },
    ]);

    return {
      message: 'Cooked food record updated successfully',
      cookedFood: populatedCookedFood,
    };
  }

  async deleteCookedFood(id: string): Promise<DeleteCookedFoodResDto> {
    const cookedFood = await this.cookedFoodRepository.findById(id);
    if (!cookedFood) {
      throw new NotFoundException('Cooked food record not found');
    }

    await this.cookedFoodRepository.delete({ _id: id });

    return {
      message: 'Cooked food record deleted successfully',
    };
  }

  async getCookedFoodStats(): Promise<CookedFoodStatsResDto> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayStats, mostPreparedFood] = await Promise.all([
      this.cookedFoodRepository.aggregate([
        {
          $match: {
            preparationDate: { $gte: today, $lt: tomorrow },
          },
        },
        {
          $group: {
            _id: null,
            totalPrepared: { $sum: '$preparedQuantityKg' },
            totalSold: { $sum: '$soldQuantityKg' },
            totalLeftover: { $sum: '$leftoverQuantityKg' },
          },
        },
      ]),
      this.cookedFoodRepository.aggregate([
        {
          $group: {
            _id: '$cookedFoodNameId',
            totalPrepared: { $sum: '$preparedQuantityKg' },
          },
        },
        { $sort: { totalPrepared: -1 } },
        { $limit: 1 },
        {
          $lookup: {
            from: 'cookedfoodnames',
            localField: '_id',
            foreignField: '_id',
            as: 'foodName',
          },
        },
      ]),
    ]);

    const stats = todayStats[0] || { totalPrepared: 0, totalSold: 0, totalLeftover: 0 };
    const wastePercentage = stats.totalPrepared > 0 ? (stats.totalLeftover / stats.totalPrepared) * 100 : 0;

    return {
      message: 'Cooked food statistics retrieved successfully',
      data: {
        totalPreparedToday: stats.totalPrepared,
        totalSoldToday: stats.totalSold,
        totalLeftoverToday: stats.totalLeftover,
        mostPreparedFood: mostPreparedFood[0]?.foodName[0]?.name || 'N/A',
        totalWastePercentage: Math.round(wastePercentage * 100) / 100,
      },
    };
  }

  async getCookedFoodDashboard(): Promise<CookedFoodDashboardResDto> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [totalCookedFoods, lowStockItems, recentPreparations, recentSales, allCookedFoods, monthlyRevenue] = await Promise.all([
      this.cookedFoodRepository.count({}),
      this.cookedFoodRepository.count({ leftoverQuantityKg: { $lte: 5 } }), // Assuming 5kg is low stock threshold
      this.cookedFoodRepository.count({ preparationDate: { $gte: thirtyDaysAgo } }),
      this.cookedFoodRepository.count({
        soldQuantityKg: { $gt: 0 },
        updatedAt: { $gte: thirtyDaysAgo },
      }),
      this.cookedFoodRepository.findAllAndPopulate({}, [{ path: 'cookedFoodNameId', select: 'name' }]),
      this.cookedFoodRepository.aggregate([
        {
          $match: {
            soldQuantityKg: { $gt: 0 },
            updatedAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $lookup: {
            from: 'cookedfoodnames',
            localField: 'cookedFoodNameId',
            foreignField: '_id',
            as: 'foodName',
          },
        },
        {
          $group: {
            _id: '$cookedFoodNameId',
            totalRevenue: { $sum: { $multiply: ['$soldQuantityKg', 1000] } }, // Assuming 1000 per kg
            cookedFoodName: { $first: { $arrayElemAt: ['$foodName.name', 0] } },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]),
    ]);

    // Calculate total value and stock alerts
    const totalValue = allCookedFoods.reduce((sum, food) => sum + food.leftoverQuantityKg * 1000, 0); // Assuming 1000 per kg value

    const stockAlerts = allCookedFoods
      .filter((food) => food.leftoverQuantityKg <= 5)
      .map((food) => ({
        cookedFood: {
          _id: food._id,
          cookedFoodNameId: food.cookedFoodNameId,
          preparedQuantityKg: food.preparedQuantityKg,
          soldQuantityKg: food.soldQuantityKg,
          leftoverQuantityKg: food.leftoverQuantityKg,
          preparationDate: food.preparationDate,
        },
        alertLevel: food.leftoverQuantityKg === 0 ? 'critical' : 'low',
        recommendedAction: food.leftoverQuantityKg === 0 ? 'Immediate preparation required' : 'Consider preparing more soon',
      }));

    return {
      message: 'Cooked food dashboard data retrieved successfully',
      data: {
        stats: {
          totalCookedFoods,
          lowStockItems,
          totalValue,
          recentPreparations,
          recentSales,
          recentWastage: 0, // TODO: Implement wastage tracking
          monthlyRevenue: monthlyRevenue.reduce((sum, item) => sum + item.totalRevenue, 0),
          pendingRequisitions: 0, // TODO: Implement requisitions
        },
        stockAlerts,
        recentActivities: [], // TODO: Implement activity tracking
        recentRequisitions: [], // TODO: Implement requisitions
        monthlyRevenueByFood: monthlyRevenue.map((item) => ({
          cookedFoodName: item.cookedFoodName,
          totalRevenue: item.totalRevenue,
        })),
      },
    };
  }
}
