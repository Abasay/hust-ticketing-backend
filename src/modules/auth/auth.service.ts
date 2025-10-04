import * as bcrypt from 'bcryptjs';
import { Inject, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { JwtUserPayload } from './interfaces/jwt-user-payload.interface';
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

import { MailerService } from '../mailer/mailer.service';
import { Constants } from '../../shared/constants';

import { BadRequestException } from '../../exceptions/bad-request.exception';
import { UnauthorizedException } from '../../exceptions/unauthorized.exception';
import { User, UserRole as UserTypes } from '../user/user.schema';
import { AuthorizedUser } from '../user/authorized-user.schema';
import { Ticket } from '../tickets/ticket.schema';
import { Types } from 'mongoose';
import { Repositories } from 'src/shared/enums';
import { BaseRepository } from '../repository/base.repository';
import { TicketStatus } from 'src/shared/constants';

import { LogoutResDto } from './dtos/logout.res.dto';
import { ConfigService } from '@nestjs/config';
import { ChangePasswordDto } from './dtos/change-password.dto';

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly logger = new Logger(AuthService.name);

  private convertJwtExpiryToMs(expiry: string | number): number {
    if (typeof expiry === 'number') return expiry * 1000; // seconds → ms

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) throw new Error(`Invalid expiry format: ${expiry}`);

    const value = parseInt(match[1], 10);
    const unit = match[2];

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
        throw new Error(`Unsupported time unit: ${unit}`);
    }
  }

  constructor(
    @Inject(Repositories.UserRepository) private readonly userRepository: BaseRepository<User>,
    @Inject(Repositories.AuthorizedUserRepository) private readonly authorizedUserRepository: BaseRepository<AuthorizedUser>,
    @Inject(Repositories.TicketRepository) private readonly ticketRepository: BaseRepository<Ticket>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailerService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async signup(signupReqDto: SignupReqDto): Promise<SignupResDto> {
    const { password, firstName, lastName } = signupReqDto;
    const email = signupReqDto.email.toLowerCase();

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ email });
    if (existingUser) {
      throw BadRequestException.RESOURCE_ALREADY_EXISTS(`User with email ${email} already exists`);
    }

    // Step 1: Check if email is admin via external API
    let userRole: string;
    try {
      const isAdmin = await this.checkIfEmailIsAdmin(email);
      if (isAdmin) {
        userRole = UserTypes.admin;
      } else {
        // Step 2: Check if user is in authorized users repository
        const authorizedUser = await this.authorizedUserRepository.findOne({ email });
        if (!authorizedUser) {
          throw BadRequestException.RESOURCE_NOT_FOUND('Email is not authorized for signup. Please contact an administrator.');
        }
        userRole = authorizedUser.accountType;
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      // If external API fails, still check authorized users
      const authorizedUser = await this.authorizedUserRepository.findOne({ email });
      if (!authorizedUser) {
        throw BadRequestException.RESOURCE_NOT_FOUND('Email is not authorized for signup. Please contact an administrator.');
      }
      userRole = authorizedUser.accountType;
    }

    // Create user with determined role
    const saltOrRounds = this.SALT_ROUNDS;
    const hashedPassword = await bcrypt.hash(password, saltOrRounds);

    const userPayload: Partial<User> = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: userRole,
      isAuthorized: true,
    };

    const createUser = await this.userRepository.create(userPayload);

    return {
      success: true,
      message: 'User created successfully',
    };
  }

  /**
   * Check if email is admin via external API
   */
  private async checkIfEmailIsAdmin(email: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`https://api-lvdtevnqpq-uc.a.run.app/external/is-admin?email=${encodeURIComponent(email)}`, {
          headers: {
            'x-api-key': '3fcfd77d35604cfa4a5ef9bfcb313920',
            'Content-Type': 'application/json',
          },
        }),
      );

      return response.data?.success === true && response.data?.message === 'Email is an admin';
    } catch (error) {
      // If API call fails or returns error, return false
      this.logger.warn(`Failed to check admin status for email ${email}:`, error.message);
      return false;
    }
  }

  /**
   * Generates a random six digit OTP
   * @returns {number} - returns the generated OTP
   */
  generateCode(): number {
    const OTP_MIN = 100000;
    const OTP_MAX = 999999;
    return Math.floor(Math.random() * (OTP_MAX - OTP_MIN + 1)) + OTP_MIN;
  }

  /**
   * Generate verification Link
   */
  async generateVerificationLink(code: string, email: string, verificationFor: string, linkFor?: string): Promise<string> {
    const token = await this.jwtService.signAsync(
      { code, email, verificationFor },
      {
        expiresIn: Constants.accessTokenExpiry,
      },
    );

    const baseUrl = process.env.CLIENT_URL;
    const url = linkFor ? `${baseUrl}/${linkFor}` : `${baseUrl}`;
    return `${url}?token=${token}`;
  }

  async login(loginReqDto: LoginReqDto): Promise<LoginResDto> {
    const { password } = loginReqDto;

    const email = loginReqDto.email.toLowerCase();
    const user = await this.userRepository.findOne({ email });
    if (!user) {
      throw UnauthorizedException.UNAUTHORIZED_ACCESS('Invalid credentials');
    }

    if (!user.password) {
      throw UnauthorizedException.REQUIRED_RE_AUTHENTICATION("Invalid credentials, password isn't set.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      if (user.lockedUntil && user.lockedUntil < new Date()) {
        await this.userRepository.update({ _id: user._id }, { lockedUntil: null, loginAttempts: 2 });
        throw UnauthorizedException.UNAUTHORIZED_ACCESS('Invalid credentials');
      }
      if (user.loginAttempts === 0) {
        await this.userRepository.update({ _id: user._id }, { lockedUntil: new Date(Date.now() + Constants.lockedAccountTime) });
        throw UnauthorizedException.UNAUTHORIZED_ACCESS('Account locked. Please contact support.');
      }

      await this.userRepository.update({ _id: user._id }, { loginAttempts: user.loginAttempts ? user.loginAttempts - 1 : 2 });

      throw UnauthorizedException.UNAUTHORIZED_ACCESS('Invalid credentials');
    }

    const payload: JwtUserPayload = {
      user: (user?._id || '').toString() || '',
      email: user.email,
      role: user.role,
    };

    // Generate access token with short expiry
    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: Constants.accessTokenExpiry,
    });

    // Generate refresh token with longer expiry
    const refreshToken = await this.jwtService.signAsync(payload, {
      expiresIn: Constants.refreshTokenExpiry,
    });
    // Helper function to convert JWT expiry string (e.g., '60s') to milliseconds
    const refreshTokenExpiryMs = this.convertJwtExpiryToMs(Constants.refreshTokenExpiry);

    await this.userRepository.update(
      { _id: user._id },
      {
        loginAttempts: 3,
        lockedUntil: null,
        isInRecovery: false,
        isVerifiedForRecovery: false,
      },
    );

    // Convert Mongoose document to plain object and exclude sensitive fields
    const userObject = (user as any).toObject ? (user as any).toObject() : user;
    const { password: userPassword, lockedUntil, loginAttempts, __v, ...cleanUserData } = userObject;

    // Format user data according to UserDto structure
    const formattedUser = {
      _id: cleanUserData._id,
      firstName: cleanUserData.firstName,
      lastName: cleanUserData.lastName,
      email: cleanUserData.email,
      role: cleanUserData.role,
      accountStatus: cleanUserData.accountStatus,
      createdAt: cleanUserData.createdAt,
      updatedAt: cleanUserData.updatedAt,
    };

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: formattedUser,
    };
  }

  async logout(accessToken: string, refreshToken: string): Promise<LogoutResDto> {
    try {
      if (refreshToken) {
        const decodedRefreshToken = this.jwtService.decode(refreshToken) as JwtUserPayload;
        if (decodedRefreshToken) {
        }
      }

      return {
        message: 'Logout successful',
      };
    } catch (error) {
      console.error('Logout error:', error);
      throw UnauthorizedException.UNAUTHORIZED_ACCESS('Failed to logout');
    }
  }

  async refreshToken(refreshToken: string): Promise<string> {
    try {
      // Verify the refresh token is valid and not expired
      const decoded = (await this.jwtService.verifyAsync(refreshToken)) as JwtUserPayload;

      if (!decoded || !decoded.user) {
        throw UnauthorizedException.INVALID_RESET_PASSWORD_TOKEN('Invalid refresh token');
      }

      // Check if refresh token exists in database and is not expired
      // const storedToken = await this.refreshTokenRepository.findOne({
      //   token: refreshToken,
      //   expiresAt: { $gt: new Date() },
      // });

      if (false) {
        throw UnauthorizedException.INVALID_RESET_PASSWORD_TOKEN('Refresh token expired or invalid');
      }

      // Generate new access token
      const newAccessToken = await this.jwtService.signAsync(
        {
          user: new Types.ObjectId(decoded.user as string),
          email: decoded.email,
          role: decoded.role,
        },
        { expiresIn: Constants.accessTokenExpiry },
      );

      return newAccessToken;
    } catch (error) {
      console.error('Refresh token error:', error);
      throw UnauthorizedException.UNAUTHORIZED_ACCESS('Failed to refresh token');
    }
  }

  private async generateRandomPassword(): Promise<string> {
    const randomBytes = require('crypto').randomBytes(16);
    const randomPassword = randomBytes.toString('hex');
    const saltOrRounds = this.SALT_ROUNDS;
    return await bcrypt.hash(randomPassword, saltOrRounds);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<any> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw UnauthorizedException.RESOURCE_NOT_FOUND('User not found');
    }

    if (!user.password) {
      throw UnauthorizedException.REQUIRED_RE_AUTHENTICATION('Password has not been changed yet. Please login again.');
    }

    const isPasswordValid = await bcrypt.compare(changePasswordDto.currentPassword, user.password);

    if (!isPasswordValid) {
      throw UnauthorizedException.UNAUTHORIZED_ACCESS('Invalid current password');
    }

    const saltOrRounds = this.SALT_ROUNDS;
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, saltOrRounds);

    await this.userRepository.update({ _id: user._id }, { password: hashedPassword });

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }

  async addAuthorizedUser(addAuthorizedUserDto: AddAuthorizedUserReqDto, adminUserId: string): Promise<AddAuthorizedUserResDto> {
    const { email, role } = addAuthorizedUserDto;

    // Check if the email is already authorized
    const existingAuthorizedUser = await this.authorizedUserRepository.findOne({ email: email.toLowerCase() });
    if (existingAuthorizedUser) {
      throw BadRequestException.RESOURCE_ALREADY_EXISTS(`User with email ${email} is already authorized`);
    }

    // Check if the user already exists in the system
    const existingUser = await this.userRepository.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw BadRequestException.RESOURCE_ALREADY_EXISTS(`User with email ${email} already exists in the system`);
    }

    // Create the authorized user record
    const authorizedUserPayload: Partial<AuthorizedUser> = {
      email: email.toLowerCase(),
      accountType: role,
      addedBy: adminUserId,
    };

    const createdAuthorizedUser = await this.authorizedUserRepository.create(authorizedUserPayload);

    return {
      success: true,
      message: 'Authorized user added successfully',
      authorizedUser: {
        _id: (createdAuthorizedUser as any)._id.toString(),
        email: createdAuthorizedUser.email,
        accountType: createdAuthorizedUser.accountType,
        addedBy: createdAuthorizedUser.addedBy,
        createdAt: (createdAuthorizedUser as any).createdAt,
        updatedAt: (createdAuthorizedUser as any).updatedAt,
      },
    };
  }

  async getUserDetails(userId: string): Promise<GetUserResDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw UnauthorizedException.RESOURCE_NOT_FOUND('User not found');
    }

    // Convert Mongoose document to plain object and exclude sensitive fields
    const userObject = (user as any).toObject ? (user as any).toObject() : user;
    const { password, lockedUntil, loginAttempts, __v, ...cleanUserData } = userObject;

    // Format user data according to UserDto structure
    const formattedUser = {
      _id: cleanUserData._id,
      firstName: cleanUserData.firstName,
      lastName: cleanUserData.lastName,
      email: cleanUserData.email,
      role: cleanUserData.role,
      accountStatus: cleanUserData.accountStatus,
      createdAt: cleanUserData.createdAt,
      updatedAt: cleanUserData.updatedAt,
    };

    return {
      message: 'User details retrieved successfully',
      user: formattedUser,
    };
  }

  async getAllUsers(filterDto: GetAllUsersReqDto): Promise<GetAllUsersResDto> {
    const { page = 1, limit = 10, search, role, accountStatus } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (accountStatus) {
      filter.accountStatus = accountStatus;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Get users with pagination
    const users = await this.userRepository.findAll(filter, skip, limit, { createdAt: -1 });
    const total = await this.userRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Users retrieved successfully',
      data: {
        users: users.map((user) => {
          // Convert Mongoose document to plain object and exclude sensitive fields
          const userObject = (user as any).toObject ? (user as any).toObject() : user;
          const { password, lockedUntil, loginAttempts, __v, ...cleanUserData } = userObject;

          return {
            _id: cleanUserData._id,
            firstName: cleanUserData.firstName,
            lastName: cleanUserData.lastName,
            email: cleanUserData.email,
            role: cleanUserData.role,
            accountStatus: cleanUserData.accountStatus,
            createdAt: cleanUserData.createdAt,
            updatedAt: cleanUserData.updatedAt,
          };
        }),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getAuthorizedUsers(filterDto: GetAuthorizedUsersReqDto): Promise<GetAuthorizedUsersResDto> {
    const { page = 1, limit = 10, search, role } = filterDto;
    const skip = (page - 1) * limit;

    // Build filter query
    const filter: any = {};

    if (role) {
      filter.accountType = role;
    }

    if (search) {
      filter.email = { $regex: search, $options: 'i' };
    }

    // Get authorized users with pagination
    const users = await this.authorizedUserRepository.findAll(filter, skip, limit, { createdAt: -1 });
    const total = await this.authorizedUserRepository.count(filter);
    const totalPages = Math.ceil(total / limit);

    return {
      message: 'Authorized users retrieved successfully',
      data: {
        users: users.map((user) => {
          // Convert Mongoose document to plain object
          const userObject = (user as any).toObject ? (user as any).toObject() : user;

          return {
            _id: userObject._id,
            email: userObject.email,
            accountType: userObject.accountType,
            addedBy: userObject.addedBy,
            createdAt: userObject.createdAt,
            updatedAt: userObject.updatedAt,
          };
        }),
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async getDashboardStats(): Promise<DashboardResDto> {
    // Get current month and last month date ranges
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Calculate current month statistics
    const currentMonthTickets = await this.ticketRepository.findAll({
      createdAt: { $gte: currentMonthStart, $lte: now },
    });

    const lastMonthTickets = await this.ticketRepository.findAll({
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    });

    // Calculate total revenue
    const currentMonthRevenue = currentMonthTickets.reduce((sum, ticket: any) => {
      return sum + (Number(ticket.amount) || 0);
    }, 0);

    const lastMonthRevenue = lastMonthTickets.reduce((sum, ticket: any) => {
      return sum + (Number(ticket.amount) || 0);
    }, 0);

    // Calculate revenue change percentage
    const revenueChangePercent = lastMonthRevenue > 0 ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Calculate tickets sold
    const currentMonthTicketsSold = currentMonthTickets.length;
    const lastMonthTicketsSold = lastMonthTickets.length;
    const ticketsSoldChangePercent =
      lastMonthTicketsSold > 0 ? ((currentMonthTicketsSold - lastMonthTicketsSold) / lastMonthTicketsSold) * 100 : 0;

    // Calculate active users (users who created tickets this month)
    const activeUserIds = new Set(currentMonthTickets.map((ticket: any) => ticket.cashierId?.toString()));
    const activeUsers = activeUserIds.size;

    const lastMonthActiveUserIds = new Set(lastMonthTickets.map((ticket: any) => ticket.cashierId?.toString()));
    const lastMonthActiveUsers = lastMonthActiveUserIds.size;
    const activeUsersChangePercent = lastMonthActiveUsers > 0 ? ((activeUsers - lastMonthActiveUsers) / lastMonthActiveUsers) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = currentMonthTicketsSold > 0 ? currentMonthRevenue / currentMonthTicketsSold : 0;
    const lastMonthAvgOrderValue = lastMonthTicketsSold > 0 ? lastMonthRevenue / lastMonthTicketsSold : 0;
    const avgOrderValueChangePercent =
      lastMonthAvgOrderValue > 0 ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100 : 0;

    const stats = {
      totalRevenue: Math.round(currentMonthRevenue),
      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,
      ticketsSold: currentMonthTicketsSold,
      ticketsSoldChangePercent: Math.round(ticketsSoldChangePercent * 10) / 10,
      activeUsers,
      activeUsersChangePercent: Math.round(activeUsersChangePercent * 10) / 10,
      avgOrderValue: Math.round(avgOrderValue),
      avgOrderValueChangePercent: Math.round(avgOrderValueChangePercent * 10) / 10,
    };

    // Get recent daily transactions (last 5 days)
    const last5Days: Date[] = [];
    for (let i = 4; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last5Days.push(date);
    }

    const dailyTransactions = await Promise.all(
      last5Days.map(async (date) => {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Get tickets for this day with cashier populated
        const dayTickets = await this.ticketRepository.findAllAndPopulate(
          {
            createdAt: { $gte: startOfDay, $lte: endOfDay },
          },
          [{ path: 'cashierId', select: 'firstName lastName' }],
        );

        // Group by cashier and calculate totals
        const cashierStats = new Map();
        console.log(dayTickets);
        dayTickets.forEach((ticket: any) => {
          const cashierId = ticket.cashierId?._id?.toString();
          const cashierName = ticket.cashierId ? `${ticket.cashierId.firstName} ${ticket.cashierId.lastName}` : 'Unknown Cashier';

          if (!cashierStats.has(date)) {
            cashierStats.set(date, {
              name: cashierName,
              totalAmount: Number(ticket.amount) || 0,
              ticketCount: 1,
            });

            return;
          }

          const stats = cashierStats.get(date);
          stats.totalAmount += Number(ticket.amount) || 0;
          stats.ticketCount += 1;
        });

        // Get the cashier with the most transactions for this day
        let topCashier = { name: 'No transactions', totalAmount: 0, ticketCount: 0 };
        for (const stats of cashierStats.values()) {
          if (stats.ticketCount > topCashier.ticketCount) {
            topCashier = stats;
          }
        }

        return {
          date: date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          cashierName: topCashier.name,
          totalAmount: Math.round(topCashier.totalAmount),
          ticketCount: topCashier.ticketCount,
        };
      }),
    );

    return {
      message: 'Dashboard statistics retrieved successfully',
      stats,
      dailyTransactions,
    };
  }

  async updateUserRole(updateUserRoleDto: UpdateUserRoleReqDto): Promise<any> {
    const { userId, newRole } = updateUserRoleDto;

    // Find the user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw BadRequestException.RESOURCE_NOT_FOUND('User not found');
    }

    // Update the user's role
    await this.userRepository.update({ _id: userId }, { role: newRole });

    // Find the authorized user by email and update their account type
    const authorizedUser = await this.authorizedUserRepository.findOne({ email: user.email });
    if (authorizedUser) {
      await this.authorizedUserRepository.update({ email: user.email }, { accountType: newRole });
    }

    return {
      success: true,
      message: 'User role updated successfully',
    };
  }

  async updateUserStatus(updateUserStatusDto: UpdateUserStatusReqDto): Promise<any> {
    const { userId, accountStatus } = updateUserStatusDto;

    // Find the user by ID
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw BadRequestException.RESOURCE_NOT_FOUND('User not found');
    }

    // Update the user's status
    await this.userRepository.update({ _id: userId }, { accountStatus });

    return {
      success: true,
      message: 'User status updated successfully',
    };
  }
}
