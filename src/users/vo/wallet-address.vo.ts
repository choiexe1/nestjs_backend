import { Column } from 'typeorm';
import { 
  WalletNetwork, 
  isSupportedNetwork, 
  validateWalletAddress,
  getNetworkConfig
} from '../../core/enums/wallet-network.enum';

/**
 * 지갑 주소 값 객체 (Value Object)
 * 블록체인 지갑 주소의 검증과 표현을 담당합니다.
 */
export class WalletAddress {
  @Column({ name: 'wallet_address' })
  address: string;

  @Column({ name: 'wallet_network', length: 20, default: WalletNetwork.ETHEREUM })
  network: WalletNetwork;

  constructor(address: string, network: string = WalletNetwork.ETHEREUM) {
    if (!isSupportedNetwork(network)) {
      throw new Error(`지원하지 않는 네트워크입니다: ${network}`);
    }
    
    this.validateAddress(address, network as WalletNetwork);
    this.address = address.trim();
    this.network = network as WalletNetwork;
  }

  /**
   * 지갑 주소 유효성 검증 (네트워크별 특화 검증)
   */
  private validateAddress(address: string, network: WalletNetwork): void {
    const validationResult = validateWalletAddress(address, network);
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }
  }

  /**
   * 동등성 비교
   */
  equals(other: WalletAddress): boolean {
    return this.address === other.address && this.network === other.network;
  }

  /**
   * 전체 지갑 주소 문자열 반환
   */
  toString(): string {
    const networkConfig = getNetworkConfig(this.network);
    return `${this.address} (${networkConfig?.name || 'Unknown'})`;
  }

  /**
   * 짧은 형태의 지갑 주소 반환 (UI 표시용)
   * 예: 0x1234...5678, 1BvBMS...aNVN2
   */
  toShortString(): string {
    if (this.address.length <= 12) {
      return this.address; // 짧은 주소는 그대로 표시
    }
    
    const prefixLength = Math.min(6, Math.floor(this.address.length / 3));
    const suffixLength = Math.min(6, Math.floor(this.address.length / 3));
    
    return `${this.address.substring(0, prefixLength)}...${this.address.substring(this.address.length - suffixLength)}`;
  }

  /**
   * 블록체인 익스플로러 URL 생성
   */
  getExplorerUrl(): string {
    const networkConfig = getNetworkConfig(this.network);
    
    if (!networkConfig) {
      return `#${this.address}`;
    }

    return `${networkConfig.explorerUrl}/${this.address}`;
  }

  /**
   * 네트워크 정보 반환
   */
  getNetworkInfo(): {
    network: WalletNetwork;
    name: string;
    symbol: string;
  } {
    const networkConfig = getNetworkConfig(this.network);
    return {
      network: this.network,
      name: networkConfig?.name || 'Unknown',
      symbol: networkConfig?.symbol || 'N/A',
    };
  }

  /**
   * JSON 직렬화를 위한 메서드
   */
  toJSON() {
    const networkConfig = getNetworkConfig(this.network);
    return {
      address: this.address,
      network: this.network,
      networkName: networkConfig?.name || 'Unknown',
      symbol: networkConfig?.symbol || 'N/A',
      shortAddress: this.toShortString(),
    };
  }

  /**
   * 정적 메서드: 주소 형식만 검증 (객체 생성 없이)
   */
  static isValidAddress(address: string, network: WalletNetwork): boolean {
    const result = validateWalletAddress(address, network);
    return result.isValid;
  }

  /**
   * 정적 메서드: 주소 검증 결과와 에러 메시지 반환
   */
  static validateAddress(address: string, network: WalletNetwork): { 
    isValid: boolean; 
    error?: string 
  } {
    return validateWalletAddress(address, network);
  }
}