import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { User } from "./entities/user.entity";
import { PaginatedResult } from "../core/interfaces/pagination.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { TokenPayload } from "../core/interfaces/token-response.interface";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: "사용자 생성" })
  @ApiResponse({
    status: 201,
    description: "사용자가 성공적으로 생성되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "모든 사용자 조회 (페이지네이션 지원)" })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (1부터 시작)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', example: 10 })
  @ApiResponse({
    status: 200,
    description: "사용자 목록을 성공적으로 조회했습니다.",
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/User' } },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
            hasNext: { type: 'boolean' },
            hasPrevious: { type: 'boolean' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async findAll(@Query() query: PaginationQueryDto): Promise<PaginatedResult<User>> {
    return await this.usersService.findAll(query);
  }

  @Get("profile")
  @ApiOperation({ summary: "현재 사용자 프로필 조회" })
  @ApiResponse({
    status: 200,
    description: "사용자 프로필을 성공적으로 조회했습니다.",
    type: User,
  })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async getProfile(@CurrentUser() user: TokenPayload): Promise<User> {
    return await this.usersService.findOne(user.sub);
  }

  @Get(":id")
  @ApiOperation({ summary: "특정 사용자 조회" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 200,
    description: "사용자를 성공적으로 조회했습니다.",
    type: User,
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "사용자 정보 수정" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 200,
    description: "사용자 정보가 성공적으로 수정되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "사용자 삭제" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 204,
    description: "사용자가 성공적으로 삭제되었습니다.",
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.remove(id);
  }
}
