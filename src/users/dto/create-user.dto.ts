import {
  IsString,
  IsEmail,
  IsOptional,
  Length,
  MinLength,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({
    description: "사용자 이름",
    example: "홍길동",
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({
    description: "이메일 주소",
    example: "user@example.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "비밀번호",
    example: "password123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: "나이",
    example: 25,
    required: false,
  })
  @IsOptional()
  age?: number;
}
