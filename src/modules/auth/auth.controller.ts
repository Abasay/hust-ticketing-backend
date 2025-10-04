import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards, ValidationPipe, Query } from '@nestjs/common';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import {
  LoginReqDto,
  LoginResDto,
  SignupReqDto,
  SignupResDto,
  AddAuthorizedUserReqDto,
  AddAuthorizedUserResDto,
  GetUserResDto,
  GetAllUsersReqDto,
  GetAllUsersResDto,
  GetAuthorizedUsersReqDto,
  GetAuthorizedUsersResDto,
  DashboardResDto,
  UpdateUserRoleReqDto,
  UpdateUserStatusReqDto,
} from './dtos';
import { GetUser } from './decorators/get-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtUserAuthGuard, OptionalAuthGuard } from './guards/jwt-user-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtUserDefaultAuthGuard } from './guards/jwt-user-auth.default.guard';
import { Constants, COOKIE_NAME, UserRole } from 'src/shared/constants';
import { LogoutResDto } from './dtos/logout.res.dto';
import { RefreshResDto } from './dtos/refresh.res.dto';

import { ChangePasswordDto } from './dtos/change-password.dto';
// import { UnauthorizedException } from 'src/shared/exceptions/unauthorized.exception';

// Add this helper function to your AuthController class or a utility file
const convertJwtExpiryToMs = (expiry: string): number => {
  const value = parseInt(expiry.slice(0, -1), 10);
  const unit = expiry.slice(-1);

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 0;
  }
};

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup
  @ApiOkResponse({
    type: SignupResDto,
  })
  @HttpCode(200)
  @Post('signup')
  async signup(@Body(ValidationPipe) signupReqDto: SignupReqDto) {
    return this.authService.signup(signupReqDto);
  }

  // POST /auth/login
  @ApiOkResponse({
    type: LoginResDto,
  })
  @HttpCode(200)
  @Post('login')
  async login(@Body(ValidationPipe) loginReqDto: LoginReqDto, @Res({ passthrough: true }) res: Response) {
    const { refreshToken, ...response } = await this.authService.login(loginReqDto);

    const refreshTokenExpiryInMs = convertJwtExpiryToMs(Constants.refreshTokenExpiry);

    const cookieExpiresAt = new Date(Date.now() + refreshTokenExpiryInMs);

    res.cookie(COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use `true` for production, `false` for local
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // `none` for production, `lax` for local

      path: '/',
      expires: cookieExpiresAt,
    });

    console.log('Cookie set on response');
    console.log('Refresh token value:', refreshToken);
    return response;
  }

  // POST /auth/logout
  @ApiBearerAuth()
  @UseGuards(OptionalAuthGuard)
  @ApiOkResponse({
    type: LogoutResDto,
  })
  @HttpCode(200)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<LogoutResDto> {
    const accessToken = req.headers.authorization?.split(' ')[1];

    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!accessToken) {
      throw new Error('Access token missing from Authorization header.');
    }

    if (!refreshToken) {
      throw new Error('Refresh token missing from cookie.');
    }

    const logoutResult = await this.authService.logout(accessToken, refreshToken);

    res.clearCookie(COOKIE_NAME, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
    });

    return logoutResult;
  }

  // POST /auth/refresh
  // @UseGuards(RefreshTokenGuard)
  @ApiOkResponse({
    type: RefreshResDto,
  })
  @HttpCode(200)
  @Post('refresh')
  async refresh(@Req() req: Request): Promise<RefreshResDto> {
    const refreshToken = req.cookies?.[COOKIE_NAME];

    if (!refreshToken) {
      throw new Error('Refresh token missing from cookie.');
    }

    const newAccessToken = await this.authService.refreshToken(refreshToken);
    return { accessToken: newAccessToken };
  }

  // POST /auth/change-password
  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard)
  @ApiOkResponse({
    description: 'Password changed successfully',
  })
  @HttpCode(200)
  @Post('change-password')
  async changePassword(@GetUser() user, @Body(ValidationPipe) changePasswordDto: ChangePasswordDto) {
    return this.authService.changePassword(user._id, changePasswordDto);
  }

  // POST /auth/add-authorized-user
  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Add authorized user',
    description: 'Add a new authorized user to the system. Only admins can access this endpoint.',
  })
  @ApiOkResponse({
    type: AddAuthorizedUserResDto,
    description: 'Authorized user added successfully',
  })
  @HttpCode(201)
  @Post('add-authorized-user')
  async addAuthorizedUser(
    @Body(ValidationPipe) addAuthorizedUserDto: AddAuthorizedUserReqDto,
    @GetUser() user: any,
  ): Promise<AddAuthorizedUserResDto> {
    return this.authService.addAuthorizedUser(addAuthorizedUserDto, user._id);
  }

  // GET /auth/me
  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard)
  @ApiOperation({
    summary: 'Get current user details',
    description: 'Retrieve the details of the currently authenticated user.',
  })
  @ApiOkResponse({
    type: GetUserResDto,
    description: 'User details retrieved successfully',
  })
  @HttpCode(200)
  @Get('me')
  async getUserDetails(@GetUser() user: any): Promise<GetUserResDto> {
    return this.authService.getUserDetails(user._id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all users (Admin only)',
    description: 'Retrieve a paginated list of all users on the platform. Only accessible by admin users.',
  })
  @ApiOkResponse({
    type: GetAllUsersResDto,
    description: 'Users retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(200)
  @Get('users')
  async getAllUsers(@Query() filterDto: GetAllUsersReqDto): Promise<GetAllUsersResDto> {
    return this.authService.getAllUsers(filterDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all authorized users (Admin only)',
    description: 'Retrieve a paginated list of all authorized users. Only accessible by admin users.',
  })
  @ApiOkResponse({
    type: GetAuthorizedUsersResDto,
    description: 'Authorized users retrieved successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid query parameters',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(200)
  @Get('authorized-users')
  async getAuthorizedUsers(@Query() filterDto: GetAuthorizedUsersReqDto): Promise<GetAuthorizedUsersResDto> {
    return this.authService.getAuthorizedUsers(filterDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get dashboard statistics (Admin only)',
    description:
      'Retrieve dashboard statistics including revenue, tickets sold, active users, and recent transactions. Only accessible by admin users.',
  })
  @ApiOkResponse({
    type: DashboardResDto,
    description: 'Dashboard statistics retrieved successfully',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(200)
  @Get('dashboard')
  async getDashboardStats(): Promise<DashboardResDto> {
    return this.authService.getDashboardStats();
  }

  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user role (Admin only)',
    description: 'Update the role of a user. Only accessible by admin users.',
  })
  @ApiOkResponse({
    description: 'User role updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or user not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(200)
  @Post('update-user-role')
  async updateUserRole(@Body(ValidationPipe) updateUserRoleDto: UpdateUserRoleReqDto) {
    return this.authService.updateUserRole(updateUserRoleDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtUserAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update user status (Admin only)',
    description: 'Update the status of a user. Only accessible by admin users.',
  })
  @ApiOkResponse({
    description: 'User status updated successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body or user not found',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
  })
  @HttpCode(200)
  @Post('update-user-status')
  async updateUserStatus(@Body(ValidationPipe) updateUserStatusDto: UpdateUserStatusReqDto) {
    return this.authService.updateUserStatus(updateUserStatusDto);
  }
}
