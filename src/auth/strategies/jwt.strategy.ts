import { Injectable, Inject } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { TokenPayload } from "../../core/interfaces/token-response.interface";
import { UserRepository } from "../../core/repositories/user.repository.interface";
import { User } from "../../users/entities/user.entity";
import { InvalidTokenException } from "../../core/exceptions/custom-exception";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "your-secret-key"),
    });
  }

  async validate(payload: TokenPayload): Promise<Omit<User, "password">> {
    const user = await this.userRepository.findById(payload.sub);

    if (!user) {
      throw new InvalidTokenException();
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
