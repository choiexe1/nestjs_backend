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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AddWalletDto } from "./dto/add-wallet.dto";
import { UpdateWalletDto } from "./dto/update-wallet.dto";
import { PaginationQueryDto } from "./dto/pagination-query.dto";
import { User } from "./entities/user.entity";
import { PaginatedResult } from "../core/interfaces/pagination.interface";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RoleGuard } from "../auth/guards/role.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { AdminOnly, AllRoles } from "../auth/decorators/roles.decorator";
import { TokenPayload } from "../core/interfaces/token-response.interface";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard, RoleGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @AdminOnly()
  @ApiOperation({ summary: "사용자 생성 (관리자 전용)" })
  @ApiResponse({
    status: 201,
    description: "사용자가 성공적으로 생성되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  @ApiResponse({ status: 403, description: "관리자 권한이 필요합니다" })
  async create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @AdminOnly()
  @ApiOperation({
    summary: "모든 사용자 조회 (관리자 전용, 페이지네이션 지원)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "페이지 번호 (1부터 시작)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "페이지당 항목 수",
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: "사용자 목록을 성공적으로 조회했습니다.",
    schema: {
      type: "object",
      properties: {
        data: { type: "array", items: { $ref: "#/components/schemas/User" } },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            totalPages: { type: "number" },
            hasNext: { type: "boolean" },
            hasPrevious: { type: "boolean" },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  @ApiResponse({ status: 403, description: "관리자 권한이 필요합니다" })
  async findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<User>> {
    return await this.usersService.findAll(query);
  }

  @Get("profile")
  @AllRoles()
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
  @AdminOnly()
  @ApiOperation({ summary: "특정 사용자 조회 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 200,
    description: "사용자를 성공적으로 조회했습니다.",
    type: User,
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  @ApiResponse({ status: 403, description: "관리자 권한이 필요합니다" })
  async findOne(@Param("id", ParseIntPipe) id: number): Promise<User> {
    return await this.usersService.findOne(id);
  }

  @Patch(":id")
  @AdminOnly()
  @ApiOperation({ summary: "사용자 정보 수정 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 200,
    description: "사용자 정보가 성공적으로 수정되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  @ApiResponse({ status: 403, description: "관리자 권한이 필요합니다" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "사용자 삭제 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 204,
    description: "사용자가 성공적으로 삭제되었습니다.",
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  @ApiResponse({ status: 401, description: "인증되지 않은 사용자" })
  @ApiResponse({ status: 403, description: "관리자 권한이 필요합니다" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return await this.usersService.remove(id);
  }

  // 지갑 관리 API들
  @Post(":id/wallets")
  @AdminOnly()
  @ApiOperation({ summary: "사용자에게 지갑 주소 추가 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 201,
    description: "지갑 주소가 성공적으로 추가되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "잘못된 요청 또는 중복된 네트워크" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  async addWallet(
    @Param("id", ParseIntPipe) id: number,
    @Body() addWalletDto: AddWalletDto,
  ) {
    return await this.usersService.addWallet(id, addWalletDto);
  }

  @Patch(":id/wallets/:network")
  @AdminOnly()
  @ApiOperation({ summary: "사용자의 지갑 주소 수정 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiParam({ name: "network", description: "네트워크명" })
  @ApiResponse({
    status: 200,
    description: "지갑 주소가 성공적으로 수정되었습니다.",
    type: User,
  })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  @ApiResponse({ status: 404, description: "사용자 또는 지갑을 찾을 수 없습니다." })
  async updateWallet(
    @Param("id", ParseIntPipe) id: number,
    @Param("network") network: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return await this.usersService.updateWallet(id, network, updateWalletDto);
  }

  @Delete(":id/wallets/:network")
  @AdminOnly()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "사용자의 지갑 주소 제거 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiParam({ name: "network", description: "네트워크명" })
  @ApiResponse({
    status: 204,
    description: "지갑 주소가 성공적으로 제거되었습니다.",
  })
  @ApiResponse({ status: 404, description: "사용자 또는 지갑을 찾을 수 없습니다." })
  async removeWallet(
    @Param("id", ParseIntPipe) id: number,
    @Param("network") network: string,
  ) {
    return await this.usersService.removeWallet(id, network);
  }

  @Get(":id/wallets")
  @AdminOnly()
  @ApiOperation({ summary: "사용자의 모든 지갑 조회 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiResponse({
    status: 200,
    description: "지갑 목록을 성공적으로 조회했습니다.",
    schema: {
      type: "object",
      properties: {
        walletCount: { type: "number" },
        networks: { type: "array", items: { type: "string" } },
        wallets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              network: { type: "string" },
              address: { type: "string" },
              shortAddress: { type: "string" },
              explorerUrl: { type: "string" },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없습니다." })
  async getAllWallets(@Param("id", ParseIntPipe) id: number) {
    return await this.usersService.getAllWallets(id);
  }

  @Get(":id/wallets/:network")
  @AdminOnly()
  @ApiOperation({ summary: "특정 네트워크의 지갑 조회 (관리자 전용)" })
  @ApiParam({ name: "id", description: "사용자 ID" })
  @ApiParam({ name: "network", description: "네트워크명" })
  @ApiResponse({
    status: 200,
    description: "지갑 정보를 성공적으로 조회했습니다.",
    schema: {
      type: "object",
      properties: {
        network: { type: "string" },
        address: { type: "string" },
        shortAddress: { type: "string" },
        explorerUrl: { type: "string" },
      },
    },
  })
  @ApiResponse({ status: 404, description: "사용자 또는 지갑을 찾을 수 없습니다." })
  async getWalletByNetwork(
    @Param("id", ParseIntPipe) id: number,
    @Param("network") network: string,
  ) {
    return await this.usersService.getWalletByNetwork(id, network);
  }
}
