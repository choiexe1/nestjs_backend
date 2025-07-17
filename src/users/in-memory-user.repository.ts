import { Injectable } from "@nestjs/common";
import { User } from "./entities/user.entity";
import { UserRepository } from "../core/repositories/user.repository.interface";

@Injectable()
export class InMemoryUserRepository implements UserRepository {
  private users: User[] = [];
  private nextId = 1;

  async findByEmail(email: string): Promise<User | null> {
    const user = this.users.find((user) => user.email === email);
    return user || null;
  }

  async findById(id: number): Promise<User | null> {
    const user = this.users.find((user) => user.id === id);
    return user || null;
  }

  async create(
    userData: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
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

  async findAll(): Promise<User[]> {
    return [...this.users];
  }
}
