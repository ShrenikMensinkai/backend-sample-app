import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import {
  LoginRecordListDto,
  UserRankingDto,
  RankingListDto,
} from './dto/login-record.dto';
import { LoginResponseDto } from './dto/login-response.dto';

interface LoginUser {
  id: number;
  emailId: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(emailId: string, password: string): Promise<LoginUser> {
    const user = await this.usersService.findByEmail(emailId);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: LoginUser, ipAddress: string): Promise<LoginResponseDto> {
    const payload = { sub: user.id, emailId: user.emailId };

    // Record the login
    await this.prisma.loginRecord.create({
      data: {
        userId: user.id,
        ipAddress,
      },
    });

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getLoginRecords(userId: number): Promise<LoginRecordListDto> {
    const records = await this.prisma.loginRecord.findMany({
      where: { userId },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        loginAt: 'desc',
      },
      take: 30,
    });

    return {
      records: records.map((record) => ({
        userId: record.userId,
        username: record.user?.username ?? null,
        loginAt: record.loginAt.toISOString().replace('T', ' ').slice(0, 19),
        ipAddress: record.ipAddress,
      })),
      total: records.length,
    };
  }

  async getWeeklyRankings(): Promise<RankingListDto> {
    // Get the start and end of the current week (Monday to Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    // Get all users
    const allUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
      },
    });

    // Get login counts for the current week
    const loginCounts = await this.prisma.loginRecord.groupBy({
      by: ['userId'],
      where: {
        loginAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      _count: {
        userId: true,
      },
    });

    // Create a map of user IDs to login counts
    const loginCountMap = new Map(
      loginCounts.map((count) => [count.userId, count._count.userId]),
    );

    // Create rankings with login counts
    const rankings = allUsers.map((user) => ({
      username: user.username,
      loginCount: loginCountMap.get(user.id) ?? 0,
    }));

    // Sort by login count (descending)
    rankings.sort((a, b) => b.loginCount - a.loginCount);

    // Calculate ranks and users with same rank
    let currentRank = 1;
    let currentCount = rankings[0]?.loginCount ?? 0;
    let usersWithSameRank = 0;
    const finalRankings: UserRankingDto[] = [];

    rankings.forEach((ranking) => {
      if (ranking.loginCount === 0) {
        finalRankings.push({
          ...ranking,
          rank: null,
          usersWithSameRank: null,
        });
        return;
      }

      if (ranking.loginCount < currentCount) {
        currentRank += usersWithSameRank;
        currentCount = ranking.loginCount;
        usersWithSameRank = 1;
      } else {
        usersWithSameRank++;
      }

      finalRankings.push({
        ...ranking,
        rank: currentRank,
        usersWithSameRank,
      });
    });

    return {
      rankings: finalRankings,
      totalUsers: allUsers.length,
    };
  }
}
