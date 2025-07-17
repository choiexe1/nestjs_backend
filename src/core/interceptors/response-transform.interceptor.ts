import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        const apiResponse: ApiResponse<T> = {
          success: true,
          data,
          message: this.getSuccessMessage(request.method, response.statusCode),
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        return apiResponse;
      }),
    );
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    switch (method) {
      case 'POST':
        return statusCode === 201 ? '생성되었습니다.' : '처리되었습니다.';
      case 'PUT':
      case 'PATCH':
        return '수정되었습니다.';
      case 'DELETE':
        return '삭제되었습니다.';
      case 'GET':
      default:
        return '조회되었습니다.';
    }
  }
}