import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class AppService {
  private users: User[] = [];

  createUser(createUserDto: CreateUserDto): User {
    const newUser: User = {
      id: randomUUID(),
      ...createUserDto
    };

    this.users.push(newUser);
    return newUser;
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  updateUser(id: string, dto: UpdateUserDto): User | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    Object.assign(user, dto);
    return user;
  }

  deleteUser(id: string): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;
    this.users.splice(index, 1);
    return true;
  }

  getAll(): User[] {
    return this.users;
  }
}
