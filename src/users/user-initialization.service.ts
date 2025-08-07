import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import { UsersService } from "./users.service";
import { Role } from "../core/enums/role.enum";

/**
 * 사용자 초기화 서비스
 * 애플리케이션 시작 시 기본 관리자 계정과 한국인 가짜 유저 데이터를 생성합니다.
 */
@Injectable()
export class UserInitializationService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserInitializationService.name);

  constructor(private readonly usersService: UsersService) {}

  /**
   * 애플리케이션 부트스트랩 시 기본 관리자 계정과 가짜 유저 데이터 생성
   */
  async onApplicationBootstrap() {
    await this.createDefaultAdminUser();
    await this.createKoreanFakeUsers();
  }

  /**
   * 기본 관리자 계정 생성
   */
  private async createDefaultAdminUser() {
    const adminEmail = "test@test.com";
    const adminPassword = "test123";

    try {
      const existingAdmin = await this.usersService.findByEmail(adminEmail);

      if (existingAdmin) {
        this.logger.log(`관리자 계정이 이미 존재합니다: ${adminEmail}`);
        return;
      }

      await this.usersService.create({
        name: "시스템 관리자",
        email: adminEmail,
        password: adminPassword,
        role: Role.ADMIN,
        isActive: true,
      });
    } catch (error) {
      this.logger.error("기본 관리자 계정 생성 중 오류가 발생했습니다:", error);
    }
  }

  /**
   * 한국인 가짜 유저 데이터 100개 생성
   */
  private async createKoreanFakeUsers() {
    const seedingEnabled = process.env.ENABLE_USER_SEEDING !== "false";

    if (!seedingEnabled) {
      this.logger.log("사용자 시딩이 비활성화되어 있습니다.");
      return;
    }

    try {
      const existingUsersCount = await this.getUserCount();

      // 관리자 계정 외에 다른 사용자가 있으면 시딩 건너뛰기
      if (existingUsersCount > 1) {
        this.logger.log(
          `이미 ${existingUsersCount}명의 사용자가 존재하여 시딩을 건너뜁니다.`,
        );
        return;
      }

      this.logger.log("한국인 가짜 유저 데이터 50개 생성을 시작합니다...");

      const koreanNames = this.getKoreanNames();
      const domains = [
        "gmail.com",
        "naver.com",
        "daum.net",
        "hanmail.net",
        "outlook.com",
      ];

      const users = [];

      for (let i = 0; i < 50; i++) {
        const name = this.getRandomKoreanName(koreanNames);
        const email = this.generateKoreanEmail(name, domains, i);

        users.push({
          name,
          email,
          password: "test123",
          age: Math.floor(Math.random() * 50) + 20,
          role: Math.random() > 0.99 ? Role.ADMIN : Role.USER,
          isActive: Math.random() > 0.1,
        });
      }

      // 배치로 생성 (5개씩)
      for (let i = 0; i < users.length; i += 5) {
        const batch = users.slice(i, i + 5);
        await Promise.all(
          batch.map(async (userData) => {
            try {
              await this.usersService.create(userData);
            } catch (error) {
              if (!error.message?.includes("이미 존재")) {
                this.logger.warn(
                  `사용자 생성 실패 (${userData.email}):`,
                  error.message,
                );
              }
            }
          }),
        );

        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      const finalCount = await this.getUserCount();
      this.logger.log(
        `✅ 사용자 데이터 시딩 완료! 총 ${finalCount}명의 사용자가 생성되었습니다.`,
      );
    } catch (error) {
      this.logger.error("가짜 유저 데이터 생성 중 오류가 발생했습니다:", error);
    }
  }

  /**
   * 한국 이름 목록 반환
   */
  private getKoreanNames(): { surnames: string[]; givenNames: string[] } {
    return {
      surnames: [
        "김",
        "이",
        "박",
        "최",
        "정",
        "강",
        "조",
        "윤",
        "장",
        "임",
        "한",
        "오",
        "서",
        "신",
        "권",
        "황",
        "안",
        "송",
        "류",
        "전",
        "홍",
        "고",
        "문",
        "양",
        "손",
        "배",
        "조",
        "백",
        "허",
        "유",
        "남",
        "심",
        "노",
        "정",
        "하",
        "곽",
        "성",
        "차",
        "주",
        "우",
        "구",
        "신",
        "임",
        "나",
        "전",
        "민",
        "유",
        "진",
        "지",
        "엄",
      ],
      givenNames: [
        "민준",
        "서연",
        "도윤",
        "서현",
        "예준",
        "지유",
        "시우",
        "서우",
        "하준",
        "지민",
        "지후",
        "하은",
        "준서",
        "수빈",
        "준우",
        "지원",
        "건우",
        "다은",
        "현우",
        "예은",
        "유진",
        "소율",
        "정우",
        "채원",
        "승현",
        "수아",
        "민재",
        "지안",
        "준혁",
        "윤서",
        "성민",
        "서진",
        "연우",
        "가은",
        "민성",
        "민서",
        "지훈",
        "하린",
        "재윤",
        "서영",
        "태윤",
        "유나",
        "시현",
        "예린",
        "재현",
        "하영",
        "은우",
        "서윤",
        "준호",
        "채은",
        "시원",
        "유진",
        "민규",
        "수현",
        "재원",
        "나은",
        "승우",
        "서연",
        "도현",
        "지율",
        "민찬",
        "예나",
        "혜성",
        "수민",
      ],
    };
  }

  /**
   * 랜덤 한국 이름 생성
   */
  private getRandomKoreanName(names: {
    surnames: string[];
    givenNames: string[];
  }): string {
    const surname =
      names.surnames[Math.floor(Math.random() * names.surnames.length)];
    const givenName =
      names.givenNames[Math.floor(Math.random() * names.givenNames.length)];
    return `${surname}${givenName}`;
  }

  /**
   * 한국인 이름 기반 이메일 생성
   */
  private generateKoreanEmail(
    name: string,
    domains: string[],
    index: number,
  ): string {
    // 한국어 이름을 영어로 변환 (간단한 로마자 표기)
    const romanized = this.romanizeKoreanName(name);
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const suffix =
      index > 0
        ? `${index + Math.floor(Math.random() * 1000)}`
        : Math.floor(Math.random() * 1000).toString();

    return `${romanized}${suffix}@${domain}`.toLowerCase();
  }

  /**
   * 한국어 이름 간단 로마자 변환
   */
  private romanizeKoreanName(koreanName: string): string {
    const romanMap: { [key: string]: string } = {
      // 성씨
      김: "kim",
      이: "lee",
      박: "park",
      최: "choi",
      정: "jung",
      강: "kang",
      조: "cho",
      윤: "yoon",
      장: "jang",
      임: "lim",
      한: "han",
      오: "oh",
      서: "seo",
      신: "shin",
      권: "kwon",
      황: "hwang",
      안: "ahn",
      송: "song",
      류: "ryu",
      전: "jeon",
      홍: "hong",
      고: "go",
      문: "moon",
      양: "yang",
      손: "son",
      배: "bae",
      백: "baek",
      허: "heo",
      유: "yu",
      남: "nam",
      심: "sim",
      노: "no",
      곽: "kwak",
      차: "cha",
      주: "ju",
      구: "koo",
      엄: "eom",
      // 이름 글자들
      준: "jun",
      연: "yeon",
      도: "do",
      현: "hyun",
      예: "ye",
      시: "si",
      하: "ha",
      은: "eun",
      후: "hoo",
      빈: "bin",
      원: "won",
      건: "gun",
      다: "da",
      채: "chae",
      율: "yul",
      혁: "hyeok",
      재: "jae",
      태: "tae",
      린: "rin",
      영: "young",
      민: "min",
      지: "ji",
      우: "woo",
      나: "na",
      진: "jin",
      성: "sung",
    };

    let result = "";
    for (const char of koreanName) {
      result += romanMap[char] || char;
    }

    return result;
  }

  /**
   * 현재 사용자 수 조회
   */
  private async getUserCount(): Promise<number> {
    try {
      const users = await this.usersService.findAll({ page: 1, limit: 1000 });
      return users.pagination?.total || users.data?.length || 0;
    } catch (error) {
      this.logger.warn("사용자 수 조회 실패:", error.message);
      return 0;
    }
  }
}
