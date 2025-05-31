import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: 'Content must be at least 1 character long' })
  @MaxLength(500, { message: 'Content must not exceed 500 characters' })
  content: string;
}
