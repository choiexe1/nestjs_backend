import { ApiProperty } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  name: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
  })
  password: string;

  @ApiProperty({
    description: '나이',
    example: 25,
    required: false,
  })
  age?: number;

  @ApiProperty({
    description: '생성일',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}