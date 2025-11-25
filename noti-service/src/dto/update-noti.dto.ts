import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotiDTO {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsOptional()
  @IsBoolean()
  read?: boolean;
}
