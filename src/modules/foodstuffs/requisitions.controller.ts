import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus, ValidationPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RequisitionsService } from './requisitions.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
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
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { UserRole } from 'src/shared/constants';

@ApiTags('Foodstuff Requisitions')
@ApiBearerAuth()
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('requisitions')
export class RequisitionsController {
  constructor(private readonly requisitionsService: RequisitionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new foodstuff requisition' })
  @ApiResponse({ status: 201, description: 'Requisition created successfully', type: CreateRequisitionResDto })
  async createRequisition(
    @Body(ValidationPipe) createDto: CreateRequisitionReqDto,
    @GetUser() user: any,
  ): Promise<CreateRequisitionResDto> {
    return this.requisitionsService.createRequisition(createDto, user._id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all requisitions with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Requisitions retrieved successfully', type: GetRequisitionsResDto })
  async getRequisitions(@Query() query: any): Promise<GetRequisitionsResDto> {
    return this.requisitionsService.getRequisitions(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific requisition by ID' })
  async getRequisitionById(@Param('id') id: string) {
    return this.requisitionsService.getRequisitionById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a pending requisition' })
  @ApiResponse({ status: 200, description: 'Requisition updated successfully', type: UpdateRequisitionResDto })
  async updateRequisition(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateRequisitionReqDto,
  ): Promise<UpdateRequisitionResDto> {
    return this.requisitionsService.updateRequisition(id, updateDto);
  }

  @Put(':id/approve')
  @ApiOperation({ summary: 'Approve a requisition' })
  @ApiResponse({ status: 200, description: 'Requisition approved successfully', type: UpdateRequisitionResDto })
  async approveRequisition(
    @Param('id') id: string,
    @Body(ValidationPipe) approveDto: ApproveRequisitionReqDto,
    @GetUser() user: any,
  ): Promise<UpdateRequisitionResDto> {
    return this.requisitionsService.approveRequisition(id, approveDto, user._id);
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a requisition' })
  @ApiResponse({ status: 200, description: 'Requisition rejected successfully', type: UpdateRequisitionResDto })
  async rejectRequisition(
    @Param('id') id: string,
    @Body(ValidationPipe) rejectDto: RejectRequisitionReqDto,
    @GetUser() user: any,
  ): Promise<UpdateRequisitionResDto> {
    return this.requisitionsService.rejectRequisition(id, rejectDto, user._id);
  }

  @Put(':id/fulfill')
  @ApiOperation({ summary: 'Fulfill an approved requisition' })
  @ApiResponse({ status: 200, description: 'Requisition fulfilled successfully', type: UpdateRequisitionResDto })
  async fulfillRequisition(
    @Param('id') id: string,
    @Body(ValidationPipe) fulfillDto: FulfillRequisitionReqDto,
    @GetUser() user: any,
  ): Promise<UpdateRequisitionResDto> {
    return this.requisitionsService.fulfillRequisition(id, fulfillDto, user._id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a requisition' })
  @ApiResponse({ status: 200, description: 'Requisition deleted successfully', type: DeleteRequisitionResDto })
  async deleteRequisition(@Param('id') id: string): Promise<DeleteRequisitionResDto> {
    return this.requisitionsService.deleteRequisition(id);
  }
}
