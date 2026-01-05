import { Controller, UseGuards, Get, Post, Put, Body, Param, Query, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import { CreateStudentDto } from './dtos/create-student.dto';
import { UpdateStudentDto } from './dtos/update-student.dto';

@ApiTags('Medical')
@ApiBearerAuth()
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Controller('/medical')
export class StudentsController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get('students')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all students (admin only)' })
  async getStudents(@Query(ValidationPipe) query: any) {
    return this.medicalService.getStudents(query);
  }

  @Get('students/:id')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student by id' })
  async getStudentById(@Param('id') id: string) {
    return this.medicalService.getStudentById(id);
  }

  @Get('students/:id/medical-data')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get student medical data (wallet + records)' })
  async getStudentMedicalData(@Param('id') id: string) {
    return this.medicalService.getStudentMedicalData(id);
  }

  @Post('students')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new student (admin only)' })
  async createStudent(@Body(ValidationPipe) createDto: CreateStudentDto) {
    return this.medicalService.createStudent(createDto);
  }

  @Put('students/:id')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update student information' })
  async updateStudent(@Param('id') id: string, @Body(ValidationPipe) updateDto: UpdateStudentDto) {
    return this.medicalService.updateStudent(id, updateDto);
  }

  @Get('faculties')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of faculties' })
  async getFaculties() {
    return { success: true, data: this.medicalService.getFaculties() };
  }

  @Get('departments')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of departments (optional faculty filter)' })
  async getDepartments(@Query('faculty') faculty?: string) {
    return { success: true, data: this.medicalService.getDepartments(faculty) };
  }
}
