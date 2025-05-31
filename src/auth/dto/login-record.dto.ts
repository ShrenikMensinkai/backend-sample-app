import { ApiProperty } from '@nestjs/swagger';

export class LoginRecordDto {
  @ApiProperty({ description: 'User ID' })
  userId: number;

  @ApiProperty({ description: 'Username (null if user is deleted)' })
  username: string | null;

  @ApiProperty({ description: 'Login timestamp in YYYY-MM-DD HH:mm:ss format' })
  loginAt: string;

  @ApiProperty({ description: 'IP address of the login' })
  ipAddress: string;
}

export class LoginRecordListDto {
  @ApiProperty({ type: [LoginRecordDto] })
  records: LoginRecordDto[];

  @ApiProperty({ description: 'Total number of records' })
  total: number;
}

export class UserRankingDto {
  @ApiProperty({ description: 'Username' })
  username: string;

  @ApiProperty({ description: 'Number of logins this week' })
  loginCount: number;

  @ApiProperty({ description: 'Rank (null if no logins this week)' })
  rank: number | null;

  @ApiProperty({
    description:
      'Number of users sharing this rank (null if no logins this week)',
  })
  usersWithSameRank: number | null;
}

export class RankingListDto {
  @ApiProperty({ type: [UserRankingDto] })
  rankings: UserRankingDto[];

  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;
}
