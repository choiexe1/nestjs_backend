import { Injectable, NotFoundException, Inject } from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { User } from "./entities/user.entity";
import { UserRepository } from "../core/repositories/user.repository.interface";

@Injectable()
export class UsersService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    return this.userRepository.create(createUserDto);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const updatedUser = await this.userRepository.update(id, updateUserDto);
    if (!updatedUser) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const deleted = await this.userRepository.delete(id);
    if (!deleted) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
  }
}
