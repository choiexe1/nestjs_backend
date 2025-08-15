import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AddWalletDto } from "./dto/add-wallet.dto";
import { UpdateWalletDto } from "./dto/update-wallet.dto";
import { User } from "./entities/user.entity";
import {
  PaginationOptions,
  PaginatedResult,
} from "../core/interfaces/pagination.interface";
import { Role } from "../core/enums/role.enum";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await User.hashPassword(createUserDto.password);

    const userData = {
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || Role.USER,
      isActive:
        createUserDto.isActive !== undefined ? createUserDto.isActive : true,
    };

    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    let processedUpdateDto = { ...updateUserDto };

    if (updateUserDto.password) {
      const hashedPassword = await User.hashPassword(updateUserDto.password);
      processedUpdateDto = {
        ...updateUserDto,
        password: hashedPassword,
      };
    }

    await this.userRepository.update(id, processedUpdateDto);
    const updatedUser = await this.userRepository.findOne({ where: { id } });
    
    if (!updatedUser) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
    return updatedUser;
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`ID가 ${id}인 사용자를 찾을 수 없습니다.`);
    }
  }

  // 지갑 관리 기능들
  async addWallet(userId: number, addWalletDto: AddWalletDto): Promise<User> {
    const user = await this.findOne(userId);

    try {
      user.addWalletAddress(addWalletDto.address, addWalletDto.network);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateWallet(userId: number, network: string, updateWalletDto: UpdateWalletDto): Promise<User> {
    const user = await this.findOne(userId);

    try {
      user.updateWalletAddress(network, updateWalletDto.address);
      return await this.userRepository.save(user);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async removeWallet(userId: number, network: string): Promise<User> {
    const user = await this.findOne(userId);

    const removed = user.removeWalletAddress(network);
    if (!removed) {
      throw new NotFoundException(`${network} 네트워크의 지갑을 찾을 수 없습니다.`);
    }

    return await this.userRepository.save(user);
  }

  async getWalletByNetwork(userId: number, network: string) {
    const user = await this.findOne(userId);
    const wallet = user.getWalletByNetwork(network);
    
    if (!wallet) {
      throw new NotFoundException(`${network} 네트워크의 지갑을 찾을 수 없습니다.`);
    }

    return {
      network: wallet.network,
      address: wallet.address,
      shortAddress: wallet.toShortString(),
      explorerUrl: wallet.getExplorerUrl(),
    };
  }

  async getAllWallets(userId: number) {
    const user = await this.findOne(userId);
    
    return {
      walletCount: user.getWalletAddressCount(),
      networks: user.getRegisteredNetworks(),
      wallets: user.wallets ? user.wallets.map(wallet => ({
        network: wallet.network,
        address: wallet.address,
        shortAddress: wallet.toShortString(),
        explorerUrl: wallet.getExplorerUrl(),
      })) : [],
    };
  }
}
