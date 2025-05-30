import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  @MinLength(1, { message: 'Title must be at least 1 character long' })
  @MaxLength(30, { message: 'Title must not exceed 30 characters' })
  title: string;

  @IsString()
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(1000, { message: 'Content must not exceed 1000 characters' })
  content: string;
}
