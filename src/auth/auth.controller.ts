import { Controller, Post, Body, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { User } from "../users/entities/user.entity";
import { TokenResponse } from "../core/interfaces/token-response.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "회원가입" })
  @ApiResponse({
    status: 201,
    description: "회원가입이 성공적으로 완료되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 409, description: "이미 존재하는 이메일" })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Omit<User, "password">> {
    return this.authService.register(registerDto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "로그인" })
  @ApiResponse({
    status: 200,
    description: "로그인이 성공적으로 완료되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 401, description: "인증 실패" })
  async login(@Body() loginDto: LoginDto): Promise<TokenResponse<User>> {
    return this.authService.login(loginDto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "토큰 갱신" })
  @ApiResponse({
    status: 200,
    description: "토큰이 성공적으로 갱신되었습니다.",
  })
  @ApiResponse({ status: 401, description: "유효하지 않은 토큰" })
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponse<User>> {
    return this.authService.refreshToken(refreshTokenDto);
  }
}
