import { Column } from 'typeorm';

/**
 * 지갑 주소 값 객체 (Value Object)
 * 블록체인 지갑 주소의 검증과 표현을 담당합니다.
 */
export class WalletAddress {
  @Column({ name: 'wallet_address' })
  address: string;

  @Column({ name: 'wallet_network', length: 20, default: 'ethereum' })
  network: string;

  constructor(address: string, network: string = 'ethereum') {
    this.validateAddress(address);
    this.address = address.trim();
    this.network = network.toLowerCase();
  }

  /**
   * 지갑 주소 유효성 검증 (다양한 블록체인 네트워크 지원)
   */
  private validateAddress(address: string): void {
    if (!address || typeof address !== 'string') {
      throw new Error('지갑 주소는 필수입니다');
    }

    const cleanAddress = address.trim();

    // 기본 길이 검증 (최소 20자, 최대 100자)
    if (cleanAddress.length < 20 || cleanAddress.length > 100) {
      throw new Error('지갑 주소 길이가 유효하지 않습니다 (20-100자)');
    }

    // 기본 패턴 검증 (영숫자와 특수문자)
    if (!/^[a-zA-Z0-9]+$/.test(cleanAddress)) {
      throw new Error('지갑 주소는 영숫자만 포함할 수 있습니다');
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
    return `${this.address} (${this.network})`;
  }

  /**
   * 짧은 형태의 지갑 주소 반환 (UI 표시용)
   * 예: 0x1234...5678, 1BvBMS...aNVN2
   */
  toShortString(): string {
    if (this.address.length <= 12) {
      return this.address;
    }

    const prefixLength = Math.min(6, Math.floor(this.address.length / 3));
    const suffixLength = Math.min(6, Math.floor(this.address.length / 3));

    return `${this.address.substring(0, prefixLength)}...${this.address.substring(this.address.length - suffixLength)}`;
  }

  /**
   * 블록체인 익스플로러 URL 생성
   */
  getExplorerUrl(): string {
    const explorerUrls = {
      ethereum: `https://etherscan.io/address/${this.address}`,
      bsc: `https://bscscan.com/address/${this.address}`,
      bitcoin: `https://blockstream.info/address/${this.address}`,
    };

    return explorerUrls[this.network] || `#${this.address}`;
  }

  /**
   * JSON 직렬화를 위한 메서드
   */
  toJSON() {
    return {
      address: this.address,
      network: this.network,
      shortAddress: this.toShortString(),
    };
  }
}
