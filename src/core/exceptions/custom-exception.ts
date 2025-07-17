import { HttpException, HttpStatus } from '@nestjs/common';

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
    super('이미 존재하는 이메일입니다.', HttpStatus.CONFLICT, 'AUTH_001');
  }
}

export class InvalidCredentialsException extends CustomException {
  constructor() {
    super('이메일 또는 비밀번호가 일치하지 않습니다.', HttpStatus.UNAUTHORIZED, 'AUTH_002');
  }
}