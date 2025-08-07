/**
 * 사용자 역할 열거형
 */
export enum Role {
  /**
   * 관리자 - 모든 권한을 가진 최고 권한 사용자
   */
  ADMIN = "admin",

  /**
   * 일반 사용자 - 기본 권한을 가진 사용자
   */
  USER = "user",
}

/**
 * 역할별 권한 정의
 */
export const ROLE_PERMISSIONS = {
  [Role.ADMIN]: [
    "users:create",
    "users:read",
    "users:update",
    "users:delete",
    "admin:access",
  ],
  [Role.USER]: ["profile:read", "profile:update"],
} as const;

/**
 * 역할 관련 상수
 */
export const ROLE_CONSTANTS = {
  DEFAULT_ROLE: Role.USER,
  ADMIN_ROLE: Role.ADMIN,
  ROLE_KEY: "roles",
} as const;
