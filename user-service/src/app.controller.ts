import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('create_user')
  async createUser(@Payload() message: any) {
    const createUserDto: CreateUserDto = message.value;
    return await this.appService.createUser(createUserDto);
  }

  @MessagePattern('get_user')
  async getUser(@Payload() message: any) {
    const { id } = message.value;
    return await this.appService.getUserById(id);
  }

  @MessagePattern('update_user')
  async updateUser(@Payload() message: any) {
    const { id, dto } = message.value;
    const updateUserDto: UpdateUserDto = dto;
    return await this.appService.updateUser(id, updateUserDto);
  }

  @MessagePattern('delete_user')
  async deleteUser(@Payload() message: any) {
    const { id } = message.value;
    return await this.appService.deleteUser(id);
  }

  @MessagePattern('get_all_users')
  async getAllUsers() {
    return await this.appService.getAll();
  }
} 
 