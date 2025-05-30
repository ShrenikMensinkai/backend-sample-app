import {
  IsOptional,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  @Matches(/^[가-힣]+$/, {
    message: 'Username must contain only Korean characters',
  })
  username?: string;

  @IsOptional()
  @IsString()
  @MinLength(12)
  @MaxLength(20)
  @Matches(/^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-z0-9!@#$%^&*]+$/, {
    message:
      'Password must contain lowercase letters, numbers, and special characters',
  })
  password?: string;
}
