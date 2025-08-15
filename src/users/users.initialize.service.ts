import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from '../core/enums/role.enum';

@Injectable()
export class UserInitializeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserInitializeService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    await this.createDefaultAdminUser();
  }

  /**
   * 기본 관리자 계정 생성
   */
  async createDefaultAdminUser(): Promise<void> {
    const adminEmail = 'admin@admin.com';

    try {
      const existingAdmin = await this.userRepository.findOne({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        this.logger.log('기본 관리자 계정이 이미 존재합니다.');
        return;
      }

      const hashedPassword = await User.hashPassword('admin123!');

      const adminUser = this.userRepository.create({
        name: '시스템 관리자',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        isActive: true,
      });

      await this.userRepository.save(adminUser);

      this.logger.log(`기본 관리자 계정 생성: ${adminEmail}`);
      this.logger.warn('보안을 위해 기본 비밀번호(admin123!)를 변경해주세요.');
    } catch (error) {
      this.logger.error('기본 관리자 계정 생성 중 오류 발생:', error);
    }
  }
}
