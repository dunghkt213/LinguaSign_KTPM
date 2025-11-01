import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern('create_user')
  createUser(@Payload() message: any) {
    const createUserDto: CreateUserDto = message.value;
    return this.appService.createUser(createUserDto);
  }

  @MessagePattern('get_user')
  getUser(@Payload() message: any) {
    const { id } = message.value;
    return this.appService.getUserById(id);
  }

  @MessagePattern('update_user')
  updateUser(@Payload() message: any) {
    const { id, dto } = message.value;
    const updateUserDto: UpdateUserDto = dto;
    return this.appService.updateUser(id, updateUserDto);
  }

  @MessagePattern('delete_user')
  deleteUser(@Payload() message: any) {
    const { id } = message.value;
    return this.appService.deleteUser(id);
  }

  @MessagePattern('get_all_users')
  getAllUsers() {
    return this.appService.getAll();
  }
} 
 