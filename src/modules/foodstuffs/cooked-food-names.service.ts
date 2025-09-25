import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums/db.enum';
import {
  CreateCookedFoodNameReqDto,
  CreateCookedFoodNameResDto,
  UpdateCookedFoodNameReqDto,
  UpdateCookedFoodNameResDto,
  GetCookedFoodNamesResDto,
  DeleteCookedFoodNameResDto,
} from './dtos';

@Injectable()
export class CookedFoodNamesService {
  constructor(
    @Inject(Repositories.CookedFoodNameRepository)
    private readonly cookedFoodNameRepository: BaseRepository<any>,
    @Inject(Repositories.CookedFoodRepository)
    private readonly cookedFoodRepository: BaseRepository<any>,
  ) {}

  async createCookedFoodName(createDto: CreateCookedFoodNameReqDto): Promise<CreateCookedFoodNameResDto> {
    const existingName = await this.cookedFoodNameRepository.findOne({
      name: { $regex: new RegExp(`^${createDto.name}$`, 'i') },
    });

    if (existingName) {
      throw new BadRequestException('Cooked food name already exists');
    }

    const cookedFoodName = await this.cookedFoodNameRepository.create(createDto);

    return {
      message: 'Cooked food name created successfully',
      cookedFoodName,
    };
  }

  async getAllCookedFoodNames(query: any): Promise<GetCookedFoodNamesResDto> {
    const { page = 1, limit = 10, search, isActive, sortBy = 'name', sortOrder = 'asc' } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [cookedFoodNames, total] = await Promise.all([
      this.cookedFoodNameRepository.findAll(filter, skip, limit, sort),
      this.cookedFoodNameRepository.count(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const currentPage = parseInt(page);

    return {
      message: 'Cooked food names retrieved successfully',
      data: {
        cookedFoodNames,
        total,
        page: currentPage,
        limit: parseInt(limit),
        totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
      },
    };
  }

  async getCookedFoodNameById(id: string) {
    const cookedFoodName = await this.cookedFoodNameRepository.findById(id);
    if (!cookedFoodName) {
      throw new NotFoundException('Cooked food name not found');
    }

    return {
      message: 'Cooked food name retrieved successfully',
      cookedFoodName,
    };
  }

  async updateCookedFoodName(id: string, updateDto: UpdateCookedFoodNameReqDto): Promise<UpdateCookedFoodNameResDto> {
    const existingName = await this.cookedFoodNameRepository.findById(id);
    if (!existingName) {
      throw new NotFoundException('Cooked food name not found');
    }

    if (updateDto.name) {
      const duplicateName = await this.cookedFoodNameRepository.findOne({
        name: { $regex: new RegExp(`^${updateDto.name}$`, 'i') },
        _id: { $ne: id },
      });

      if (duplicateName) {
        throw new BadRequestException('Cooked food name already exists');
      }
    }

    const cookedFoodName = await this.cookedFoodNameRepository.update({ _id: id }, updateDto);

    return {
      message: 'Cooked food name updated successfully',
      cookedFoodName,
    };
  }

  async deleteCookedFoodName(id: string): Promise<DeleteCookedFoodNameResDto> {
    const cookedFoodName = await this.cookedFoodNameRepository.findById(id);
    if (!cookedFoodName) {
      throw new NotFoundException('Cooked food name not found');
    }

    // Check if there are any cooked foods using this name
    const cookedFoodsCount = await this.cookedFoodRepository.count({ cookedFoodNameId: id });
    if (cookedFoodsCount > 0) {
      throw new BadRequestException('Cannot delete cooked food name with existing cooked food records');
    }

    await this.cookedFoodNameRepository.delete({ _id: id });

    return {
      message: 'Cooked food name deleted successfully',
    };
  }

  async getCookedFoodNamesDropdown(): Promise<string[]> {
    const cookedFoodNames = await this.cookedFoodNameRepository.findAll({ isActive: true }, 0, 0, { name: 1 });
    return cookedFoodNames;
  }
}
