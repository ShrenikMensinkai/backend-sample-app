import { IsEmail, IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  emailId: string;

  @IsString()
  @MinLength(12, { message: 'Password must be at least 12 characters long' })
  @MaxLength(20, { message: 'Password must not exceed 20 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{12,20}$/,
    {
      message:
        'Password must contain at least one lowercase letter, one number, and one special character',
    },
  )
  password: string;

  @IsString()
  @MinLength(1, { message: 'Username must be at least 1 character long' })
  @MaxLength(10, { message: 'Username must not exceed 10 characters' })
  @Matches(/^[가-힣]+$/, { message: 'Username must contain only Korean characters' })
  username: string;
} 