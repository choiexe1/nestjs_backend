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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: '사용자 생성' })
  @ApiResponse({
    status: 201,
    description: '사용자가 성공적으로 생성되었습니다.',
    type: User,
  })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  create(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: '모든 사용자 조회' })
  @ApiResponse({
    status: 200,
    description: '사용자 목록을 성공적으로 조회했습니다.',
    type: [User],
  })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '특정 사용자 조회' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자를 성공적으로 조회했습니다.',
    type: User,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '사용자 정보 수정' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자 정보가 성공적으로 수정되었습니다.',
    type: User,
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '사용자 삭제' })
  @ApiParam({ name: 'id', description: '사용자 ID' })
  @ApiResponse({
    status: 204,
    description: '사용자가 성공적으로 삭제되었습니다.',
  })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.usersService.remove(id);
  }
}