import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { TokenPayload } from "../../core/interfaces/token-response.interface";
import { User } from "../../users/entities/user.entity";
import { InvalidTokenException } from "../../core/exceptions/custom-exception";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: JwtStrategy.createJwtExtractor(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "your-secret-key"),
    });
  }

  /**
   * 🔒 보안 강화: JWT 토큰을 Cookie와 Authorization 헤더 모두에서 추출
   * Cookie 우선, 없으면 Authorization 헤더에서 추출 (하위 호환성)
   */
  private static createJwtExtractor() {
    return (request: Request): string | null => {
      // 1순위: HttpOnly Cookie에서 토큰 추출 (보안 강화)
      if (request.cookies && request.cookies.accessToken) {
        return request.cookies.accessToken;
      }

      // 2순위: Authorization 헤더에서 토큰 추출 (하위 호환성)
      const authHeaderExtractor = ExtractJwt.fromAuthHeaderAsBearerToken();
      return authHeaderExtractor(request);
    };
  }

  async validate(payload: TokenPayload): Promise<Omit<User, "password">> {
    const user = await this.userRepository.findOne({ where: { id: payload.sub } });

    if (!user) {
      throw new InvalidTokenException();
    }

    return user.toSafeUser();
  }
}
