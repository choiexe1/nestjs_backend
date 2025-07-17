import { Injectable, Inject } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { User } from "../users/entities/user.entity";
import { TokenService } from "./services/token.service";
import { TokenResponse } from "../core/interfaces/token-response.interface";
import * as bcrypt from "bcrypt";
import { UserRepository } from "src/core/repositories/user.repository.interface";
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidTokenException,
  ExpiredTokenException,
} from "../core/exceptions/custom-exception";

@Injectable()
export class AuthService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository<User>,
    private readonly tokenService: TokenService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, "password">> {
    const { email, password, ...userData } = registerDto;

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const user = await this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
      });

      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw error;
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<TokenResponse<User>> {
    const { email, password } = loginDto;

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    const { password: _, ...userWithoutPassword } = user;
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: userWithoutPassword,
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse<User>> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.tokenService.verifyToken(refreshToken);
      const user = await this.userRepository.findById(payload.sub);

      if (!user) {
        throw new InvalidTokenException();
      }

      const { password: _, ...userWithoutPassword } = user;
      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: userWithoutPassword,
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new ExpiredTokenException();
      }
      throw new InvalidTokenException();
    }
  }
}
