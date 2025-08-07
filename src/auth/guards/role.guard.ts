import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../../core/enums/role.enum";
import { TokenPayload } from "../../core/interfaces/token-response.interface";

/**
 * 역할 기반 접근 제어 가드
 * JWT 인증 이후에 사용자의 역할을 확인하여 접근을 제어합니다.
 */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 컨트롤러 메서드 또는 클래스에서 @Roles 데코레이터로 설정된 역할들을 가져옵니다
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>("roles", [
      context.getHandler(),
      context.getClass(),
    ]);

    // 필요한 역할이 지정되지 않은 경우 접근을 허용합니다
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 요청에서 사용자 정보를 가져옵니다 (JwtAuthGuard에서 설정됨)
    const request = context.switchToHttp().getRequest();
    const user: TokenPayload = request.user;

    // 사용자 정보가 없는 경우 접근을 거부합니다
    if (!user) {
      throw new ForbiddenException("사용자 정보를 찾을 수 없습니다.");
    }

    // 사용자의 역할이 필요한 역할 목록에 포함되어 있는지 확인합니다
    const hasRequiredRole = requiredRoles.includes(user.role);

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `이 리소스에 접근하려면 다음 역할 중 하나가 필요합니다: ${requiredRoles.join(", ")}`,
      );
    }

    return true;
  }
}
