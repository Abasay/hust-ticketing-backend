import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtUserAuthGuard } from './guards/jwt-user-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/shared/constants';

describe('AuthController', () => {
  let controller: AuthController;
  let service: jest.Mocked<AuthService>;

  const mockUser = {
    _id: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  const mockAddAuthorizedUserResponse = {
    success: true,
    message: 'Authorized user added successfully',
    authorizedUser: {
      _id: '507f1f77bcf86cd799439011',
      email: 'john.doe@example.com',
      accountType: 'CASHIER',
      addedBy: 'admin123',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
      updatedAt: new Date('2024-01-15T10:30:00.000Z'),
    },
  };

  beforeEach(async () => {
    const mockService = {
      addAuthorizedUser: jest.fn(),
      signup: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
      refreshToken: jest.fn(),
      changePassword: jest.fn(),
      getUserDetails: jest.fn(),
      getAllUsers: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockService,
        },
        Reflector,
      ],
    })
      .overrideGuard(JwtUserAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addAuthorizedUser', () => {
    const addAuthorizedUserDto = {
      email: 'john.doe@example.com',
      role: UserRole.CASHIER,
    };

    it('should add an authorized user successfully', async () => {
      service.addAuthorizedUser.mockResolvedValue(mockAddAuthorizedUserResponse);

      const result = await controller.addAuthorizedUser(addAuthorizedUserDto, mockUser);

      expect(service.addAuthorizedUser).toHaveBeenCalledWith(addAuthorizedUserDto, 'admin123');
      expect(result).toEqual(mockAddAuthorizedUserResponse);
    });
  });

  describe('getUserDetails', () => {
    const mockGetUserResponse = {
      message: 'User details retrieved successfully',
      user: {
        _id: 'user123',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'STUDENT',
        accountStatus: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    it('should get user details successfully', async () => {
      service.getUserDetails.mockResolvedValue(mockGetUserResponse);

      const result = await controller.getUserDetails(mockUser);

      expect(service.getUserDetails).toHaveBeenCalledWith('admin123');
      expect(result).toEqual(mockGetUserResponse);
    });
  });

  describe('getAllUsers', () => {
    const mockGetAllUsersResponse = {
      message: 'Users retrieved successfully',
      data: {
        users: [
          {
            _id: 'user123',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            role: 'STUDENT',
            accountStatus: 'ACTIVE',
            createdAt: new Date('2024-01-15T10:30:00.000Z'),
            updatedAt: new Date('2024-01-15T10:30:00.000Z'),
          },
          {
            _id: 'user456',
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            role: 'CASHIER',
            accountStatus: 'ACTIVE',
            createdAt: new Date('2024-01-15T11:30:00.000Z'),
            updatedAt: new Date('2024-01-15T11:30:00.000Z'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
    };

    const filterDto = {
      page: 1,
      limit: 10,
      search: 'john',
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
    };

    it('should get all users successfully', async () => {
      service.getAllUsers.mockResolvedValue(mockGetAllUsersResponse);

      const result = await controller.getAllUsers(filterDto);

      expect(service.getAllUsers).toHaveBeenCalledWith(filterDto);
      expect(result).toEqual(mockGetAllUsersResponse);
    });
  });
});
