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

    const apiResponse: ApiResponse = {
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 에러 로깅
    this.logger.error(
      `HTTP ${status} Error: ${errorMessage}`,
      exception instanceof Error ? exception.stack : "No stack",
    );

    response.status(status).json(apiResponse);
  }
}
