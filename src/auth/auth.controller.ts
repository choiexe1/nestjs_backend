import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: '회원가입' })
  @ApiResponse({
    status: 201,
    description: '회원가입이 성공적으로 완료되었습니다.',
    type: User,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Omit<User, 'password'>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인 - HttpOnly Secure Cookie 방식' })
  @ApiResponse({
    status: 200,
    description:
      '로그인이 성공적으로 완료되었습니다. 토큰은 HttpOnly Cookie로 설정됩니다.',
    type: User,
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const { accessToken, refreshToken, user } =
      await this.authService.login(loginDto);

    this.setAuthCookies(response, accessToken, refreshToken);

    return { user };
  }

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '관리자 로그인 - HttpOnly Secure Cookie 방식',
    description: '관리자 권한을 가진 사용자만 로그인할 수 있습니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '관리자 로그인이 성공적으로 완료되었습니다. 토큰은 HttpOnly Cookie로 설정됩니다.',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: '인증 실패 - 이메일 또는 비밀번호가 일치하지 않습니다.',
  })
  @ApiResponse({
    status: 403,
    description: '접근 거부 - 관리자 권한이 필요합니다.',
  })
  async adminLogin(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const { accessToken, refreshToken, user } =
      await this.authService.adminLogin(loginDto);

    this.setAuthCookies(response, accessToken, refreshToken);

    return { user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신 - Cookie 기반' })
  @ApiResponse({
    status: 200,
    description:
      '토큰이 성공적으로 갱신되었습니다. 새로운 토큰은 HttpOnly Cookie로 설정됩니다.',
  })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  async refreshToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ user: Omit<User, 'password'> }> {
    const refreshToken = request.cookies?.refreshToken;

    if (!refreshToken) {
      throw new Error('Refresh token not found in cookies');
    }

    const result = await this.authService.refreshToken({ refreshToken });

    this.setAuthCookies(response, result.accessToken, result.refreshToken);

    return { user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그아웃 - Cookie 삭제' })
  @ApiResponse({
    status: 200,
    description:
      '로그아웃이 성공적으로 완료되었습니다. 인증 쿠키가 삭제됩니다.',
  })
  async logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    this.clearAuthCookies(response);

    return { message: '로그아웃이 완료되었습니다.' };
  }

  // 토큰 반환 방식 엔드포인트
  @Post('token/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인 - Token 반환 방식',
    description:
      'Bearer 토큰을 응답으로 반환합니다. API 테스트 도구나 개발 환경에서 사용하세요.',
  })
  @ApiResponse({
    status: 200,
    description:
      '로그인이 성공적으로 완료되었습니다. Bearer 토큰이 반환됩니다.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: { $ref: '#/components/schemas/User' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async tokenLogin(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('token/admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '관리자 로그인 - Token 반환 방식',
    description: '관리자 전용 로그인으로 Bearer 토큰을 응답으로 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description:
      '관리자 로그인이 성공적으로 완료되었습니다. Bearer 토큰이 반환됩니다.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: { $ref: '#/components/schemas/User' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '관리자 권한 필요' })
  async tokenAdminLogin(@Body() loginDto: LoginDto) {
    return await this.authService.adminLogin(loginDto);
  }

  @Post('token/refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '토큰 갱신 - Token 반환 방식',
    description: 'RefreshToken을 받아서 새로운 토큰들을 반환합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰이 성공적으로 갱신되었습니다.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
        user: { $ref: '#/components/schemas/User' },
      },
    },
  })
  @ApiResponse({ status: 401, description: '유효하지 않은 토큰' })
  async tokenRefresh(@Body() refreshTokenDto: { refreshToken: string }) {
    return await this.authService.refreshToken(refreshTokenDto);
  }

  private setAuthCookies(
    response: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const secureCookies = process.env.SECURE_COOKIES === 'true' || isProduction;

    const accessTokenExpiry = this.parseTimeToMs(
      process.env.JWT_ACCESS_TOKEN_EXPIRY || '5m',
    );
    const refreshTokenExpiry = this.parseTimeToMs(
      process.env.JWT_REFRESH_TOKEN_EXPIRY || '1d',
    );

    response.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      maxAge: accessTokenExpiry,
      path: '/',
    });

    // Refresh Token - 환경변수 기반 만료시간
    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      maxAge: refreshTokenExpiry,
      path: '/',
    });
  }

  /**
   * 시간 문자열을 밀리초로 변환 (예: "5m" → 300000)
   */
  private parseTimeToMs(timeStr: string): number {
    const units = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const match = timeStr.match(/^(\d+)([smhd])$/);
    if (!match) return 300000;

    const [, value, unit] = match;
    return parseInt(value) * (units[unit as keyof typeof units] || 60000);
  }

  private clearAuthCookies(response: Response): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const secureCookies = process.env.SECURE_COOKIES === 'true' || isProduction;

    response.clearCookie('accessToken', {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      path: '/',
    });

    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: secureCookies,
      sameSite: 'strict',
      path: '/',
    });
  }
}
