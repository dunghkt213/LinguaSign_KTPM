import { IsString, IsOptional, IsNumber, Min, Max, IsBoolean, IsDateString } from 'class-validator';

export class CreateProgressDto {
  @IsString()
  userId: string;

  @IsString()
  courseId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number = 0;

  @IsOptional()
  @IsDateString()
  lastViewedAt?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean = false;
}