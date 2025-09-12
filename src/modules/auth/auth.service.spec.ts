import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { MailerService } from '../mailer/mailer.service';
import { BaseRepository } from '../repository/base.repository';
import { Repositories } from 'src/shared/enums';
import { UserRole } from 'src/shared/constants';
import { BadRequestException } from '../../exceptions/bad-request.exception';
import { UnauthorizedException } from '../../exceptions/unauthorized.exception';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: jest.Mocked<BaseRepository<any>>;
  let authorizedUserRepository: jest.Mocked<BaseRepository<any>>;
  let httpService: jest.Mocked<HttpService>;

  const mockUser = {
    _id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: UserRole.STUDENT,
  };

  const mockAuthorizedUser = {
    _id: 'auth123',
    email: 'cashier@example.com',
    accountType: UserRole.CASHIER,
    addedBy: 'admin123',
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockAuthorizedUserRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
    };

    const mockHttpService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: Repositories.UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: Repositories.AuthorizedUserRepository,
          useValue: mockAuthorizedUserRepository,
        },
        {
          provide: Repositories.TicketRepository,
          useValue: {
            findAll: jest.fn(),
            findAllAndPopulate: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
            decode: jest.fn(),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(Repositories.UserRepository);
    authorizedUserRepository = module.get(Repositories.AuthorizedUserRepository);
    httpService = module.get(HttpService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const signupDto = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
    };

    it('should create admin user when external API confirms admin status', async () => {
      userRepository.findOne.mockResolvedValue(null); // User doesn't exist
      httpService.get.mockReturnValue(
        of({
          data: { success: true, message: 'Email is an admin' },
        }) as any,
      );
      userRepository.create.mockResolvedValue({ ...mockUser, role: UserRole.ADMIN });

      const result = await service.signup(signupDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: signupDto.email.toLowerCase(),
          firstName: signupDto.firstName,
          lastName: signupDto.lastName,
          role: 'admin', // UserTypes.ADMIN from user.schema.ts
        }),
      );
    });

    it('should create user with authorized role when not admin but in authorized users', async () => {
      userRepository.findOne.mockResolvedValue(null); // User doesn't exist
      httpService.get.mockReturnValue(
        of({
          data: { error: 'Invalid email address' },
        }) as any,
      );
      authorizedUserRepository.findOne.mockResolvedValue(mockAuthorizedUser);
      userRepository.create.mockResolvedValue({ ...mockUser, role: UserRole.CASHIER });

      const result = await service.signup(signupDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe('User created successfully');
      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'cashier', // UserTypes.CASHIER from user.schema.ts
        }),
      );
    });

    it('should throw error when user exists', async () => {
      userRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.signup(signupDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw error when not admin and not in authorized users', async () => {
      userRepository.findOne.mockResolvedValue(null); // User doesn't exist
      httpService.get.mockReturnValue(
        of({
          data: { error: 'Invalid email address' },
        }) as any,
      );
      authorizedUserRepository.findOne.mockResolvedValue(null); // Not authorized

      await expect(service.signup(signupDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('addAuthorizedUser', () => {
    const addAuthorizedUserDto = {
      email: 'newuser@example.com',
      role: UserRole.CASHIER,
    };

    it('should add authorized user successfully', async () => {
      authorizedUserRepository.findOne.mockResolvedValue(null); // Not already authorized
      userRepository.findOne.mockResolvedValue(null); // User doesn't exist
      authorizedUserRepository.create.mockResolvedValue({
        _id: 'auth123',
        email: addAuthorizedUserDto.email.toLowerCase(),
        accountType: addAuthorizedUserDto.role,
        addedBy: 'admin123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.addAuthorizedUser(addAuthorizedUserDto, 'admin123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Authorized user added successfully');
      expect(result.authorizedUser.email).toBe(addAuthorizedUserDto.email.toLowerCase());
    });

    it('should throw error when user already authorized', async () => {
      authorizedUserRepository.findOne.mockResolvedValue(mockAuthorizedUser);

      await expect(service.addAuthorizedUser(addAuthorizedUserDto, 'admin123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getUserDetails', () => {
    it('should get user details successfully', async () => {
      const mockUserWithMethods = {
        ...mockUser,
        toObject: jest.fn().mockReturnValue({
          _id: mockUser._id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          role: mockUser.role,
          accountStatus: 'ACTIVE',
          password: 'hashedPassword',
          lockedUntil: null,
          loginAttempts: 0,
          __v: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      };

      userRepository.findById.mockResolvedValue(mockUserWithMethods);

      const result = await service.getUserDetails('user123');

      expect(result.message).toBe('User details retrieved successfully');
      expect(result.user._id).toBe(mockUser._id);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.user).not.toHaveProperty('password');
      expect(result.user).not.toHaveProperty('lockedUntil');
      expect(result.user).not.toHaveProperty('loginAttempts');
    });

    it('should throw error when user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.getUserDetails('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
