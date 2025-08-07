import { SetMetadata } from "@nestjs/common";
import { Role } from "../../core/enums/role.enum";

/**
 * 역할 기반 접근 제어를 위한 데코레이터
 * @param roles 접근을 허용할 역할들
 */
export const Roles = (...roles: Role[]) => SetMetadata("roles", roles);

/**
 * 관리자만 접근 가능한 엔드포인트를 위한 데코레이터
 */
export const AdminOnly = () => Roles(Role.ADMIN);

/**
 * 모든 인증된 사용자가 접근 가능한 엔드포인트를 위한 데코레이터
 */
export const AllRoles = () => Roles(Role.ADMIN, Role.USER);
