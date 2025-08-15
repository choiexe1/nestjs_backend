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
    description: '나이',
    example: 25,
    required: false,
  })
  @Column({ nullable: true })
  age?: number;

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
  isEligibleForLogin(): boolean {
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
    return this.isEligibleForLogin() && this.isAdmin();
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
      canLogin: this.isEligibleForLogin(),
      permissions: ROLE_PERMISSIONS[this.role] || [],
    };
  }
}
