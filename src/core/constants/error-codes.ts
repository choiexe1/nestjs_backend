export const ERROR_CODES = {
  // 인증 관련 에러
  EMAIL_ALREADY_EXISTS: "AUTH_001",
  INVALID_CREDENTIALS: "AUTH_002",

  // 유효성 검증 에러
  VALIDATION_ERROR: "VAL_001",

  // 일반 에러
  INTERNAL_SERVER_ERROR: "SRV_001",
  NOT_FOUND: "SRV_002",
  BAD_REQUEST: "SRV_003",
  UNAUTHORIZED: "SRV_004",
  FORBIDDEN: "SRV_005",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
