import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotiDTO {
  @IsString() 
  userId: string;

  @IsString() 
  title: string;
  
  @IsString() 
  message: string;
  
  @IsOptional() 
  @IsBoolean() 
  read?: boolean;
}