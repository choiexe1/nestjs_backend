import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { UserRepository } from "../core/repositories/user.repository.interface";
import { EmailAlreadyExistsException } from "../core/exceptions/custom-exception";
import { PaginationOptions, PaginatedResult } from "../core/interfaces/pagination.interface";

@Injectable()
export class InMemoryUserRepository implements UserRepository<User> {
  private users: User[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) ?? null;
  }

  async findById(id: number): Promise<User | null> {
    return this.users.find((user) => user.id === id) ?? null;
  }

  async create(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new EmailAlreadyExistsException();
    }

    const user: User = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async update(id: number, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return null;
    }

    const updatedUser = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    this.users[userIndex] = updatedUser;
    return updatedUser;
  }

  async delete(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex((user) => user.id === id);
    if (userIndex === -1) {
      return false;
    }

    this.users.splice(userIndex, 1);
    return true;
  }

  async findAll(options?: PaginationOptions): Promise<PaginatedResult<User>> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    
    const total = this.users.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    
    const data = this.users.slice(offset, offset + limit);
    
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
}
