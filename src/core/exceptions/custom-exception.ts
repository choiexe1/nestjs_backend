import { HttpException, HttpStatus } from "@nestjs/common";

export class CustomException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly errorCode: string,
  ) {
    super(message, status);
  }
}

export class EmailAlreadyExistsException extends CustomException {
  constructor() {
    super("이미 존재하는 이메일입니다.", HttpStatus.CONFLICT, "AUTH_001");
  }
}

export class InvalidCredentialsException extends CustomException {
  constructor() {
    super(
      "이메일 또는 비밀번호가 일치하지 않습니다.",
      HttpStatus.UNAUTHORIZED,
      "AUTH_002",
    );
  }
}

export class InvalidTokenException extends CustomException {
  constructor() {
    super("유효하지 않은 토큰입니다.", HttpStatus.UNAUTHORIZED, "AUTH_003");
  }
}

export class ExpiredTokenException extends CustomException {
  constructor() {
    super("만료된 토큰입니다.", HttpStatus.UNAUTHORIZED, "AUTH_004");
  }
}

export class AdminAccessDeniedException extends CustomException {
  constructor() {
    super("관리자 권한이 필요합니다.", HttpStatus.FORBIDDEN, "AUTH_005");
  }
}

export class UserInactiveException extends CustomException {
  constructor() {
    super(
      "비활성화된 계정입니다. 관리자에게 문의해주세요.",
      HttpStatus.FORBIDDEN,
      "AUTH_006",
    );
  }
}
