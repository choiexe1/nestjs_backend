import { PaginationOptions, PaginatedResult } from "../interfaces/pagination.interface";

export interface BaseRepository<T> {
  create(entity: Omit<T, "id" | "createdAt" | "updatedAt">): Promise<T>;
  update(id: number, entity: Partial<T>): Promise<T | null>;
  delete(id: number): Promise<boolean>;
  findAll(options?: PaginationOptions): Promise<PaginatedResult<T>>;
}
