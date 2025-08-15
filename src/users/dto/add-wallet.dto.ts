import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length, IsEnum } from 'class-validator';
import { WalletNetwork, getSupportedNetworks } from '../../core/enums/wallet-network.enum';

export class AddWalletDto {
  @ApiProperty({
    description: '지갑 주소 (다양한 블록체인 네트워크 지원)',
    example: '0x742d35Cc6672d3C7b67a6b7F4c4a0b8F3D4e5f6a',
  })
  @IsString()
  @IsNotEmpty()
  @Length(10, 100, { message: '지갑 주소는 10자 이상 100자 이하여야 합니다' })
  address: string;

  @ApiProperty({
    description: '블록체인 네트워크',
    example: WalletNetwork.ETHEREUM,
    enum: WalletNetwork,
    enumName: 'WalletNetwork',
  })
  @IsEnum(WalletNetwork, { 
    message: `지원하는 네트워크: ${getSupportedNetworks().join(', ')}` 
  })
  @IsNotEmpty()
  network: WalletNetwork;
}