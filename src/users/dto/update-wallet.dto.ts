import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class UpdateWalletDto {
  @ApiProperty({
    description: '새로운 지갑 주소 (다양한 블록체인 네트워크 지원)',
    example: '0x742d35Cc6672d3C7b67a6b7F4c4a0b8F3D4e5f6a',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 100, { message: '지갑 주소는 10자 이상 100자 이하여야 합니다' })
  address: string;
}