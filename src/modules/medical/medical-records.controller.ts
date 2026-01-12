import { Controller, UseGuards, Get, Post, Put, Delete, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import { CreateMedicalRecordDto } from './dtos/create-medical-record.dto';
import { UpdateMedicalRecordDto } from './dtos/update-medical-record.dto';
import { GetUser } from '../auth/decorators/get-user.decorator';
@ApiTags('Medical')
@ApiBearerAuth()
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Controller('/medical')
export class MedicalRecordsController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get('medical-records/:studentId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get medical records by student id' })
  async getRecords(@Param('studentId') studentId: string, @Query(ValidationPipe) query: any) {
    return this.medicalService.getMedicalRecords(studentId, query);
  }

  @Get('medical-records')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all medical records with student populated' })
  async getAllRecords(@Query(ValidationPipe) query: any) {
    return this.medicalService.getAllMedicalRecords(query);
  }

  @Get('medical-records/record/:recordId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get single medical record' })
  async getRecord(@Param('recordId') recordId: string) {
    return this.medicalService.getMedicalRecordById(recordId);
  }

  @Post('medical-records')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add new medical record' })
  async addRecord(@Body(ValidationPipe) dto: CreateMedicalRecordDto, @GetUser() user: any) {
    return this.medicalService.addMedicalRecord(dto, user);
  }

  @Put('medical-records/:recordId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update medical record' })
  async updateRecord(@Param('recordId') recordId: string, @Body(ValidationPipe) dto: UpdateMedicalRecordDto) {
    console.log(dto);
    return this.medicalService.updateMedicalRecord(recordId, dto);
  }

  @Delete('medical-records/:recordId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete medical record' })
  async deleteRecord(@Param('recordId') recordId: string, @Query('session') session?: string) {
    return this.medicalService.deleteMedicalRecord(recordId, session);
  }

  @Get('medical-records/statistics/:studentId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get medical record statistics for student' })
  async getStats(@Param('studentId') studentId: string, @Query(ValidationPipe) query?: any) {
    return this.medicalService.getMedicalStatistics(studentId, query);
  }
}
