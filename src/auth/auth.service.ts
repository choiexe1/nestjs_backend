import { Injectable, Inject, Logger } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { User } from "../users/entities/user.entity";
import { TokenService } from "./services/token.service";
import { TokenResponse } from "../core/interfaces/token-response.interface";
import { UsersService } from "../users/users.service";
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
  InvalidTokenException,
  ExpiredTokenException,
  AdminAccessDeniedException,
  UserInactiveException,
} from "../core/exceptions/custom-exception";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly tokenService: TokenService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Omit<User, "password">> {
    try {
      const user = await this.usersService.create(registerDto);
      return user.toSafeUser();
    } catch (error) {
      if (error instanceof EmailAlreadyExistsException) {
        throw error;
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<TokenResponse<User>> {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      throw new InvalidCredentialsException();
    }

    if (!user.isEligibleForLogin()) {
      this.logger.warn(`비활성 계정 로그인 시도: ${email}`);
      throw new UserInactiveException();
    }

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: user.toSafeUser(),
    };
  }

  async adminLogin(loginDto: LoginDto): Promise<TokenResponse<User>> {
    const { email, password } = loginDto;

    this.logger.log(`관리자 로그인 시도: ${email}`);

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      this.logger.warn(`관리자 로그인 실패 - 존재하지 않는 계정: ${email}`);
      throw new InvalidCredentialsException();
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      this.logger.warn(`관리자 로그인 실패 - 잘못된 비밀번호: ${email}`);
      throw new InvalidCredentialsException();
    }

    if (!user.canPerformAdminActions()) {
      if (!user.isEligibleForLogin()) {
        this.logger.warn(`비활성 관리자 계정 로그인 시도: ${email}`);
        throw new UserInactiveException();
      }
      if (!user.isAdmin()) {
        this.logger.warn(
          `관리자 로그인 거부 - 관리자 권한 없음: ${email} (역할: ${user.role})`,
        );
        throw new AdminAccessDeniedException();
      }
    }

    this.logger.log(`관리자 로그인 성공: ${email} (ID: ${user.id})`);

    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return {
      accessToken,
      refreshToken,
      user: user.toSafeUser(),
    };
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<Omit<User, "password"> | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      return null;
    }

    if (!user.isEligibleForLogin()) {
      return null;
    }

    return user.toSafeUser();
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse<User>> {
    const { refreshToken } = refreshTokenDto;

    try {
      const payload = this.tokenService.verifyToken(refreshToken);
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new InvalidTokenException();
      }

      if (!user.isEligibleForLogin()) {
        this.logger.warn(
          `비활성 계정 토큰 갱신 시도: ${user.email} (ID: ${user.id})`,
        );
        throw new UserInactiveException();
      }

      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        user: user.toSafeUser(),
      };
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new ExpiredTokenException();
      }
      throw new InvalidTokenException();
    }
  }
}
