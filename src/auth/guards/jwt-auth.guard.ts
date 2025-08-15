import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TokenService } from "../services/token.service";
import {
  InvalidTokenException,
  ExpiredTokenException,
  UserInactiveException,
} from "../../core/exceptions/custom-exception";
import { User } from "../../users/entities/user.entity";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("토큰이 제공되지 않았습니다.");
    }

    try {
      const payload = this.tokenService.verifyToken(token);

      // 토큰에서 사용자 ID 추출하여 실제 사용자 정보 조회
      const user = await this.userRepository.findOne({ where: { id: payload.sub } });

      if (!user) {
        throw new InvalidTokenException();
      }

      // 도메인 모델의 로그인 가능 상태 확인
      if (!user.isEligibleForLogin()) {
        throw new UserInactiveException();
      }

      request.user = payload;
      return true;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw new ExpiredTokenException();
      }
      if (error instanceof UserInactiveException) {
        throw error;
      }
      throw new InvalidTokenException();
    }
  }

  /**
   * 🔒 보안 강화: Cookie와 Authorization 헤더 모두에서 토큰 추출
   * Cookie 우선, 없으면 Authorization 헤더에서 추출 (하위 호환성)
   */
  private extractToken(request: any): string | undefined {
    // 1순위: HttpOnly Cookie에서 토큰 추출 (보안 강화)
    if (request.cookies && request.cookies.accessToken) {
      return request.cookies.accessToken;
    }

    // 2순위: Authorization 헤더에서 토큰 추출 (하위 호환성)
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
