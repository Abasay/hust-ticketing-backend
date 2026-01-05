import { Controller, UseGuards, Get, Post, Body, Param, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { MedicalService } from './medical.service';
import { JwtUserAuthGuard } from '../auth/guards/jwt-user-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from 'src/shared/constants';
import { UpdateWalletDto } from './dtos/update-wallet.dto';

@ApiTags('Medical')
@ApiBearerAuth()
@UseGuards(JwtUserAuthGuard, RolesGuard)
@Controller('/medical')
export class WalletsController {
  constructor(private readonly medicalService: MedicalService) {}

  @Get('wallet/:studentId')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get wallet by student id' })
  async getWallet(@Param('studentId') studentId: string) {
    return this.medicalService.getWalletByStudentId(studentId);
  }

  @Post('wallet/:studentId/update-balance')
  @Roles(UserRole.ADMIN, UserRole.MEDICAL_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update wallet balance (credit or debit)' })
  async updateWallet(@Param('studentId') studentId: string, @Body(ValidationPipe) dto: UpdateWalletDto) {
    return this.medicalService.updateWalletBalance(studentId, dto);
  }
}
