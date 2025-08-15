import { ApiProperty } from '@nestjs/swagger';
import { Role, ROLE_PERMISSIONS } from '../../core/enums/role.enum';
import * as bcrypt from 'bcrypt';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletAddress } from '../vo';

@Entity('users')
export class User {
  @ApiProperty({
    description: '사용자 ID',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: '사용자 이름',
    example: '홍길동',
  })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({
    description: '이메일 주소',
    example: 'user@example.com',
  })
  @Column({ unique: true, length: 255 })
  email: string;

  @ApiProperty({
    description: '비밀번호',
    example: 'password123',
  })
  @Column()
  password: string;

  @ApiProperty({
    description: '사용자 역할',
    example: 'user',
    enum: Role,
    default: Role.USER,
  })
  @Column({
    type: 'varchar',
    length: 20,
    default: Role.USER,
  })
  role: Role;

  @ApiProperty({
    description: '지갑 주소 목록',
    example: [
      {
        address: '0x742d35Cc6672d3C7b67a6b7F4c4a0b8F3D4e5f6a',
        network: 'ethereum',
      },
    ],
    type: 'array',
    required: false,
  })
  @Column({
    type: 'json',
    nullable: true,
    transformer: {
      to: (wallets: WalletAddress[]) => {
        if (!wallets || !Array.isArray(wallets)) return null;
        return wallets.map((wallet) => ({
          address: wallet.address,
          network: wallet.network,
        }));
      },
      from: (data: any[]) => {
        if (!data || !Array.isArray(data)) return [];
        return data.map(
          (item) => new WalletAddress(item.address, item.network),
        );
      },
    },
  })
  wallets: WalletAddress[];

  @ApiProperty({
    description: '사용자 활성 상태',
    example: true,
    default: true,
  })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: '생성일',
    example: '2024-01-01T00:00:00.000Z',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: '수정일',
    example: '2024-01-01T00:00:00.000Z',
  })
  @UpdateDateColumn()
  updatedAt: Date;

  /**
   * 비밀번호 유효성 검증
   * @param plainPassword 평문 비밀번호
   * @returns 비밀번호 일치 여부
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * 비밀번호 해싱 (정적 메서드)
   * @param plainPassword 평문 비밀번호
   * @param saltRounds bcrypt salt rounds (기본값: 10)
   * @returns 해싱된 비밀번호
   */
  static async hashPassword(
    plainPassword: string,
    saltRounds: number = 10,
  ): Promise<string> {
    return bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * 로그인 가능 상태 확인
   * 활성 상태인 사용자만 로그인 허용
   * @returns 로그인 가능 여부
   */
  isActivated(): boolean {
    return this.isActive;
  }

  /**
   * 특정 역할 보유 확인
   * @param targetRole 확인할 역할
   * @returns 역할 보유 여부
   */
  hasRole(targetRole: Role): boolean {
    return this.role === targetRole;
  }

  /**
   * 관리자 권한 확인
   * @returns 관리자 여부
   */
  isAdmin(): boolean {
    return this.hasRole(Role.ADMIN);
  }

  /**
   * 관리자 액션 수행 가능 여부 확인
   * 활성 상태이면서 관리자 권한을 가진 경우에만 허용
   * @returns 관리자 액션 수행 가능 여부
   */
  canPerformAdminActions(): boolean {
    return this.isActivated() && this.isAdmin();
  }

  /**
   * 특정 권한 보유 확인
   * @param permission 확인할 권한
   * @returns 권한 보유 여부
   */
  hasPermission(permission: string): boolean {
    const rolePermissions = ROLE_PERMISSIONS[this.role] || [];
    return (rolePermissions as string[]).includes(permission);
  }

  /**
   * 사용자 프로필 업데이트 권한 확인
   * 본인 또는 관리자인 경우에만 허용
   * @param targetUserId 대상 사용자 ID
   * @returns 프로필 업데이트 권한 여부
   */
  canUpdateProfile(targetUserId: number): boolean {
    return this.id === targetUserId || this.isAdmin();
  }

  /**
   * 사용자 삭제 권한 확인
   * 관리자만 다른 사용자 삭제 가능
   * @param targetUserId 대상 사용자 ID
   * @returns 사용자 삭제 권한 여부
   */
  canDeleteUser(targetUserId: number): boolean {
    // 자기 자신은 삭제할 수 없음 (관리자라도)
    if (this.id === targetUserId) {
      return false;
    }
    return this.isAdmin();
  }

  /**
   * 비밀번호 없는 사용자 객체 반환
   * 보안상 비밀번호를 제외한 정보만 반환
   * @returns 비밀번호가 제거된 사용자 정보
   */
  toSafeUser(): Omit<User, 'password'> {
    const { password: _password, ...safeUser } = this;
    return safeUser as Omit<User, 'password'>;
  }

  /**
   * 사용자 상태 정보 요약
   * @returns 사용자 상태 정보
   */
  getStatusSummary(): {
    isActive: boolean;
    role: Role;
    isAdmin: boolean;
    canLogin: boolean;
    permissions: readonly string[];
  } {
    return {
      isActive: this.isActive,
      role: this.role,
      isAdmin: this.isAdmin(),
      canLogin: this.isActivated(),
      permissions: ROLE_PERMISSIONS[this.role] || [],
    };
  }

  /**
   * 지갑 주소 추가 (네트워크별로 하나씩만)
   * @param address 지갑 주소
   * @param network 블록체인 네트워크
   */
  addWalletAddress(address: string, network: string): void {
    if (!this.wallets) {
      this.wallets = [];
    }

    // 이미 해당 네트워크의 지갑이 있는지 확인
    const existingWalletIndex = this.wallets.findIndex(
      (wallet) => wallet.network === network,
    );

    if (existingWalletIndex !== -1) {
      throw new Error(
        `${network} 네트워크의 지갑 주소가 이미 등록되어 있습니다`,
      );
    }

    const newWallet = new WalletAddress(address, network);
    this.wallets.push(newWallet);
  }

  /**
   * 지갑 주소 수정 (네트워크로 찾아서 주소 변경)
   * @param network 네트워크명
   * @param newAddress 새로운 지갑 주소
   */
  updateWalletAddress(network: string, newAddress: string): void {
    if (!this.wallets) {
      throw new Error('등록된 지갑이 없습니다');
    }

    const walletIndex = this.wallets.findIndex(
      (wallet) => wallet.network === network,
    );

    if (walletIndex === -1) {
      throw new Error(`${network} 네트워크의 지갑을 찾을 수 없습니다`);
    }

    // 새 지갑 객체로 교체
    this.wallets[walletIndex] = new WalletAddress(newAddress, network);
  }

  /**
   * 지갑 주소 제거 (네트워크로 찾아서 제거)
   * @param network 제거할 네트워크
   * @returns 제거 성공 여부
   */
  removeWalletAddress(network: string): boolean {
    if (!this.wallets || this.wallets.length === 0) {
      return false;
    }

    const initialLength = this.wallets.length;
    this.wallets = this.wallets.filter((wallet) => wallet.network !== network);

    return this.wallets.length < initialLength;
  }

  /**
   * 특정 네트워크의 지갑 주소 조회
   * @param network 네트워크명
   * @returns 지갑 주소 또는 null
   */
  getWalletByNetwork(network: string): WalletAddress | null {
    if (!this.wallets) return null;

    return this.wallets.find((wallet) => wallet.network === network) || null;
  }

  /**
   * 지갑 주소 개수 반환
   * @returns 등록된 지갑 주소 개수
   */
  getWalletAddressCount(): number {
    return this.wallets ? this.wallets.length : 0;
  }

  /**
   * 모든 네트워크 목록 반환
   * @returns 등록된 네트워크 배열
   */
  getRegisteredNetworks(): string[] {
    if (!this.wallets) return [];
    return this.wallets.map((wallet) => wallet.network);
  }

  /**
   * 특정 네트워크가 등록되어 있는지 확인
   * @param network 네트워크명
   * @returns 등록 여부
   */
  hasNetworkWallet(network: string): boolean {
    if (!this.wallets) return false;
    return this.wallets.some((wallet) => wallet.network === network);
  }
}
