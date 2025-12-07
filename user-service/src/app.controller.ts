import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user.create')
  async handleCreate(@Payload() data: CreateUserDto) {
  console.log('📨 Received user.create message with data:', data);
  return await this.appService.createUser(data);

}

  @MessagePattern('user.get')
  async getUser(@Payload() message: any) {
    const { id } = message;
    return await this.appService.getUserById(id);
  }
  @MessagePattern('user.getByUsername')
  async getbyUsername(@Payload() message: any) {
    const { username } = message;
    console.log('🔍 Validating user via user-service:', username);
    return await this.appService.getUserByUsername(username);
  }
  @MessagePattern('user.update')
  async updateUser(@Payload() message: any) {
    const { id, dto } = message;
    const updateUserDto: UpdateUserDto = dto;
    return await this.appService.updateUser(id, updateUserDto);
  }

  @MessagePattern('user.delete')
  async deleteUser(@Payload() message: any) {
    const { id } = message;
    return await this.appService.deleteUser(id);
  }

  @MessagePattern('user.getAll')
  async getAllUsers(@Payload() data?: { page?: number; limit?: number }) {
    const page = data?.page || 1;
    const limit = data?.limit || 50;
    return await this.appService.getAll(page, limit);
  }
} 
 