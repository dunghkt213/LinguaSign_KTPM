import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AppService {
  crateUser(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: 
    }
  }

  getUserById(id: string): User | undefined {
    return this.getUserById.
  }
}
