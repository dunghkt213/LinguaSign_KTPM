import { IsOptional, IsNumber, Min, Max, IsBoolean, IsDateString } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progress?: number;

  @IsOptional()
  @IsDateString()
  lastViewedAt?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}