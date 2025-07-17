import { BaseRepository } from "./base.repository.interface";

export interface UserRepository<T> extends BaseRepository<T> {
  findByEmail(email: string): Promise<T | null>;
  findById(id: number): Promise<T | null>;
}
