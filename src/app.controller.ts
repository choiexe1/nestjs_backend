import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { AppService } from "./app.service";

@ApiTags("app")
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "서버 상태 확인" })
  @ApiResponse({
    status: 200,
    description: "서버가 정상적으로 동작하고 있습니다.",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          example: "ok",
        },
      },
    },
  })
  getStatus(): { status: string } {
    return this.appService.status();
  }
}
