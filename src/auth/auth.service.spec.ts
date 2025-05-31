import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockPrismaService = {
    loginRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should return user when credentials are valid', async () => {
      const mockUser = {
        id: 1,
        emailId: email,
        password: 'hashedPassword123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await service.validateUser(email, password);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      const mockUser = {
        id: 1,
        emailId: email,
        password: 'hashedPassword123',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(service.validateUser(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        id: 1,
        emailId: 'test@example.com',
        password: 'hashedPassword',
      };
      const mockIpAddress = '127.0.0.1';
      const mockLoginRecord = {
        id: 1,
        userId: mockUser.id,
        ipAddress: mockIpAddress,
        createdAt: new Date(),
      };
      const mockToken = 'jwt-token';

      mockPrismaService.loginRecord.create.mockResolvedValue(mockLoginRecord);
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.login(mockUser, mockIpAddress);

      expect(result).toEqual({
        access_token: mockToken,
      });
      expect(mockPrismaService.loginRecord.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          ipAddress: mockIpAddress,
        },
      });
    });
  });

  describe('getLoginRecords', () => {
    const userId = 1;
    const mockRecords = [
      {
        id: 1,
        userId: 1,
        user: {
          username: '홍길동',
        },
        loginAt: new Date(),
        ipAddress: '127.0.0.1',
      },
    ];

    it('should return login records for a user', async () => {
      mockPrismaService.loginRecord.findMany.mockResolvedValue(mockRecords);

      const result = await service.getLoginRecords(userId);

      expect(result).toEqual({
        records: [{
          userId: mockRecords[0].userId,
          username: mockRecords[0].user.username,
          loginAt: mockRecords[0].loginAt.toISOString().replace('T', ' ').slice(0, 19),
          ipAddress: mockRecords[0].ipAddress,
        }],
        total: mockRecords.length,
      });
      expect(mockPrismaService.loginRecord.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { loginAt: 'desc' },
        take: 30,
        include: {
          user: {
            select: { username: true },
          },
        },
      });
    });
  });

  describe('getWeeklyRankings', () => {
    const mockRankings = [
      {
        username: '홍길동',
        loginCount: 15,
        rank: 1,
        usersWithSameRank: 1,
      },
    ];

    it('should return weekly login rankings', async () => {
      mockPrismaService.loginRecord.groupBy.mockResolvedValue([
        { userId: 1, _count: { userId: 15 } },
      ]);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 1, username: '홍길동' },
      ]);

      const result = await service.getWeeklyRankings();

      expect(result).toEqual({
        rankings: mockRankings,
        totalUsers: 1,
      });
    });

    it('should handle deleted users in rankings', async () => {
      mockPrismaService.loginRecord.groupBy.mockResolvedValue([
        { userId: 1, _count: { userId: 15 } },
        { userId: 2, _count: { userId: 10 } },
      ]);
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 1, username: '홍길동' },
      ]);

      const result = await service.getWeeklyRankings();

      expect(result.rankings).toHaveLength(1);
      expect(result.rankings[0].username).toBe('홍길동');
    });
  });
}); 