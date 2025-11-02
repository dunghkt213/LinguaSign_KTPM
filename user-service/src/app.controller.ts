import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('user.create')
  async createUser(@Payload() message: any) {
    const createUserDto: CreateUserDto = message;
    return await this.appService.createUser(createUserDto);
  }

  @MessagePattern('user.get')
  async getUser(@Payload() message: any) {
    const { id } = message;
    return await this.appService.getUserById(id);
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
  async getAllUsers() {
    return await this.appService.getAll();
  }
} 
 