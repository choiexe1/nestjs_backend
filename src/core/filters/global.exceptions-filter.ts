import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiResponse } from "../interfaces/api-response.interface";
import { ERROR_CODES } from "../constants/error-codes";
import { CustomException } from "../exceptions/custom-exception";

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : "내부 서버 오류가 발생했습니다.";

    const errorMessage =
      typeof message === "string" ? message : (message as any).message;

    const errorCode = this.getErrorCode(exception, status);

    const apiResponse: ApiResponse = {
      success: false,
      error: errorMessage,
      errorCode,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 에러 로깅
    this.logger.error(`HTTP ${status} Error: ${errorMessage}`);

    response.status(status).json(apiResponse);
  }

  private getErrorCode(exception: unknown, status: number): string {
    if (exception instanceof CustomException) {
      return exception.errorCode;
    }

    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ERROR_CODES.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ERROR_CODES.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ERROR_CODES.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ERROR_CODES.NOT_FOUND;
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return ERROR_CODES.INTERNAL_SERVER_ERROR;
      default:
        return ERROR_CODES.BAD_REQUEST;
    }
  }
}
