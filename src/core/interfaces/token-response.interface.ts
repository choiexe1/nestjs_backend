import { Role } from "../enums/role.enum";

export interface TokenResponse<T> {
  accessToken: string;
  refreshToken: string;
  user: Omit<T, "password">;
}

export interface TokenPayload {
  sub: number;
  email: string;
  name: string;
  role: Role;
  iat?: number;
  exp?: number;
}
