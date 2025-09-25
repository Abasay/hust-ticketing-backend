import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums';
import { DatabaseModelNames } from 'src/shared/constants';
import { RequisitionStatus } from './schemas/foodstuff-requisition.schema';
import {
  CreateRequisitionReqDto,
  CreateRequisitionResDto,
  UpdateRequisitionReqDto,
  UpdateRequisitionResDto,
  GetRequisitionsResDto,
  DeleteRequisitionResDto,
  ApproveRequisitionReqDto,
  RejectRequisitionReqDto,
  FulfillRequisitionReqDto,
} from './dtos/requisition.dto';

@Injectable()
export class RequisitionsService {
  constructor(
    @Inject(Repositories.FoodstuffRequisitionRepository)
    private readonly requisitionRepository: BaseRepository<any>,
    @Inject(Repositories.CookedFoodNameRepository)
    private readonly cookedFoodNameRepository: BaseRepository<any>,
    @Inject(Repositories.FoodstuffRepository)
    private readonly foodstuffRepository: BaseRepository<any>,
    @Inject(Repositories.FoodstuffHistoryRepository)
    private readonly foodstuffHistoryRepository: BaseRepository<any>,
  ) {}

  async createRequisition(createDto: CreateRequisitionReqDto, userId: string): Promise<CreateRequisitionResDto> {
    // Validate cooked food name exists
    const cookedFoodName = await this.cookedFoodNameRepository.findById(createDto.cookedFoodNameId);
    if (!cookedFoodName) {
      throw new NotFoundException('Cooked food name not found');
    }

    // Validate all foodstuffs exist
    for (const item of createDto.items) {
      const foodstuff = await this.foodstuffRepository.findById(item.foodstuffId);
      if (!foodstuff) {
        throw new NotFoundException(`Foodstuff with ID ${item.foodstuffId} not found`);
      }
    }

    // Generate requisition number
    const count = await this.requisitionRepository.count({});
    const requisitionNumber = `REQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const requisitionData = {
      ...createDto,
      requisitionNumber,
      requestedBy: userId,
      requiredDate: new Date(createDto.requiredDate),
    };

    const requisition = await this.requisitionRepository.create(requisitionData);

    const populatedRequisition = await this.requisitionRepository.findOneAndPopulate({ _id: requisition._id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'requestedBy', select: 'firstName lastName email' },
      { path: 'items.foodstuffId', select: 'name unit' },
    ]);

    return {
      message: 'Requisition created successfully',
      requisition: populatedRequisition,
    };
  }

  async getRequisitions(query: any): Promise<GetRequisitionsResDto> {
    const { page = 1, limit = 10, status, priority, cookedFoodNameId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (cookedFoodNameId) filter.cookedFoodNameId = cookedFoodNameId;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [requisitions, total] = await Promise.all([
      this.requisitionRepository.findAllAndPopulate(
        filter,
        [
          { path: 'cookedFoodNameId', select: 'name description' },
          { path: 'requestedBy', select: 'firstName lastName email' },
          { path: 'approvedBy', select: 'firstName lastName email' },
          { path: 'items.foodstuffId', select: 'name unit' },
        ],
        { createdAt: -1 },
        skip,
        limit,
      ),
      this.requisitionRepository.count(filter),
    ]);

    return {
      message: 'Requisitions retrieved successfully',
      data: {
        requisitions,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async approveRequisition(id: string, approveDto: ApproveRequisitionReqDto, userId: string): Promise<UpdateRequisitionResDto> {
    const requisition = await this.requisitionRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    if (requisition.status !== RequisitionStatus.PENDING) {
      throw new BadRequestException('Only pending requisitions can be approved');
    }

    // Update items with approved quantities
    const updatedItems = requisition.items.map((item) => {
      const approvedItem = approveDto.items.find((ai) => ai.foodstuffId === item.foodstuffId.toString());
      return {
        ...item,
        approvedQuantity: approvedItem ? approvedItem.approvedQuantity : item.requestedQuantity,
      };
    });

    const updatedRequisition = await this.requisitionRepository.update(
      { _id: id },
      {
        status: RequisitionStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
        items: updatedItems,
        notes: approveDto.notes || requisition.notes,
      },
    );

    const populatedRequisition = await this.requisitionRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'requestedBy', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'items.foodstuffId', select: 'name unit' },
    ]);

    return {
      message: 'Requisition approved successfully',
      requisition: populatedRequisition,
    };
  }

  async rejectRequisition(id: string, rejectDto: RejectRequisitionReqDto, userId: string): Promise<UpdateRequisitionResDto> {
    const requisition = await this.requisitionRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    if (requisition.status !== RequisitionStatus.PENDING) {
      throw new BadRequestException('Only pending requisitions can be rejected');
    }

    const updatedRequisition = await this.requisitionRepository.update(
      { _id: id },
      {
        status: RequisitionStatus.REJECTED,
        approvedBy: userId,
        approvedAt: new Date(),
        rejectionReason: rejectDto.rejectionReason,
      },
    );

    const populatedRequisition = await this.requisitionRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'requestedBy', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'items.foodstuffId', select: 'name unit' },
    ]);

    return {
      message: 'Requisition rejected successfully',
      requisition: populatedRequisition,
    };
  }

  async fulfillRequisition(id: string, fulfillDto: FulfillRequisitionReqDto, userId: string): Promise<UpdateRequisitionResDto> {
    const requisition = await this.requisitionRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    if (requisition.status !== RequisitionStatus.APPROVED) {
      throw new BadRequestException('Only approved requisitions can be fulfilled');
    }

    // Process each item fulfillment and create usage activities
    for (const fulfillItem of fulfillDto.items) {
      const foodstuff = await this.foodstuffRepository.findById(fulfillItem.foodstuffId);
      if (!foodstuff) {
        throw new NotFoundException(`Foodstuff with ID ${fulfillItem.foodstuffId} not found`);
      }

      // Check if there's enough stock
      if (foodstuff.currentQuantity < fulfillItem.fulfilledQuantity) {
        throw new BadRequestException(
          `Insufficient stock for ${foodstuff.name}. Available: ${foodstuff.currentQuantity}, Required: ${fulfillItem.fulfilledQuantity}`,
        );
      }

      // Create usage activity
      await this.foodstuffHistoryRepository.create({
        foodstuffId: fulfillItem.foodstuffId,
        actionType: 'usage',
        quantityChanged: -fulfillItem.fulfilledQuantity,
        reason: fulfillItem.reason,
        doneBy: userId,
        cookedFoodNameId: requisition.cookedFoodNameId,
        requisitionId: id,
      });

      // Update foodstuff quantity
      await this.foodstuffRepository.update(
        { _id: fulfillItem.foodstuffId },
        {
          currentQuantity: foodstuff.currentQuantity - fulfillItem.fulfilledQuantity,
          lastUpdateDate: new Date(),
        },
      );
    }

    // Update requisition items with fulfilled quantities
    const updatedItems = requisition.items.map((item) => {
      const fulfilledItem = fulfillDto.items.find((fi) => fi.foodstuffId === item.foodstuffId.toString());
      return {
        ...item,
        fulfilledQuantity: fulfilledItem ? fulfilledItem.fulfilledQuantity : 0,
      };
    });

    const updatedRequisition = await this.requisitionRepository.update(
      { _id: id },
      {
        status: RequisitionStatus.FULFILLED,
        fulfilledAt: new Date(),
        items: updatedItems,
      },
    );

    const populatedRequisition = await this.requisitionRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'requestedBy', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'items.foodstuffId', select: 'name unit' },
    ]);

    return {
      message: 'Requisition fulfilled successfully',
      requisition: populatedRequisition,
    };
  }

  async deleteRequisition(id: string): Promise<DeleteRequisitionResDto> {
    const requisition = await this.requisitionRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    if (requisition.status === RequisitionStatus.FULFILLED) {
      throw new BadRequestException('Cannot delete fulfilled requisitions');
    }

    await this.requisitionRepository.delete({ _id: id });

    return {
      message: 'Requisition deleted successfully',
    };
  }

  async getRequisitionById(id: string) {
    const requisition = await this.requisitionRepository.findOneAndPopulate({ _id: id }, [
      { path: 'cookedFoodNameId', select: 'name description' },
      { path: 'requestedBy', select: 'firstName lastName email' },
      { path: 'approvedBy', select: 'firstName lastName email' },
      { path: 'items.foodstuffId', select: 'name unit' },
    ]);

    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }

    return {
      message: 'Requisition retrieved successfully',
      requisition,
    };
  }

  async updateRequisition(id: string, updateDto: UpdateRequisitionReqDto) {
    const requisition = await this.requisitionRepository.findById(id);
    if (!requisition) {
      throw new NotFoundException('Requisition not found');
    }
    if (requisition.status !== RequisitionStatus.PENDING) {
      throw new BadRequestException('Only pending requisitions can be updated');
    }

    const updatedRequisition = await this.requisitionRepository.update(
      { _id: id },
      {
        ...updateDto,
        requiredDate: updateDto.requiredDate ? new Date(updateDto.requiredDate) : requisition.requiredDate,
      },
    );
    return {
      message: 'Requisition updated successfully',
      requisition: updatedRequisition,
    };
  }
}
