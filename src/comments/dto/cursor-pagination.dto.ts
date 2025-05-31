import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cursor?: number;
}
