import { User } from "../../users/entities/user.entity";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  create(user: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User>;
  update(id: number, user: Partial<User>): Promise<User | null>;
  delete(id: number): Promise<boolean>;
  findAll(): Promise<User[]>;
}
