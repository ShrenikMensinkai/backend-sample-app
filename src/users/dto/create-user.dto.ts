import {
  IsEmail,
  IsString,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  emailId: string;

  @IsString()
  @MinLength(6)
  @Matches(/^(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-z0-9!@#$%^&*]+$/, {
    message:
      'Password must contain lowercase letters, numbers, and special characters',
  })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Username must be at least 1 character long' })
  @MaxLength(10, { message: 'Username must not exceed 10 characters' })
  @Matches(/^[가-힣]+$/, {
    message: 'Username must contain only Korean characters',
  })
  username: string;
}
