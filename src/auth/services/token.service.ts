import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { TokenPayload } from "../../core/interfaces/token-response.interface";
import { User } from "../../users/entities/user.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessTokenExpiry = this.configService.get<string>(
      "JWT_ACCESS_TOKEN_EXPIRY",
      "15m",
    );

    return this.jwtService.sign(payload, {
      expiresIn: accessTokenExpiry,
    });
  }

  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const refreshTokenExpiry = this.configService.get<string>(
      "JWT_REFRESH_TOKEN_EXPIRY",
      "7d",
    );

    return this.jwtService.sign(payload, {
      expiresIn: refreshTokenExpiry,
    });
  }

  verifyToken(token: string): TokenPayload {
    return this.jwtService.verify(token);
  }

  decodeToken(token: string): TokenPayload {
    return this.jwtService.decode(token) as TokenPayload;
  }
}
