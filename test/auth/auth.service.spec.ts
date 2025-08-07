import { Test, TestingModule } from "@nestjs/testing";
import * as bcrypt from "bcrypt";
import { AuthService } from "../../src/auth/auth.service";
import { LoginDto } from "../../src/auth/dto/login.dto";
import { RegisterDto } from "../../src/auth/dto/register.dto";
import { TokenService } from "../../src/auth/services/token.service";
import {
  EmailAlreadyExistsException,
  InvalidCredentialsException,
} from "../../src/core/exceptions/custom-exception";
import { UserRepository } from "../../src/core/repositories/user.repository.interface";
import { User } from "../../src/users/entities/user.entity";
import { Role } from "../../src/core/enums/role.enum";
import { UsersService } from "../../src/users/users.service";

jest.mock("bcrypt");

describe("AuthService", () => {
  let service: AuthService;
  let userRepository: jest.Mocked<UserRepository<User>>;
  let tokenService: jest.Mocked<TokenService>;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = Object.assign(new User(), {
    id: 1,
    name: "홍길동",
    email: "test@example.com",
    password: "hashedPassword",
    age: 25,
    role: Role.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeEach(async () => {
    const mockUserRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    };

    const mockTokenService = {
      generateAccessToken: jest.fn(),
      generateRefreshToken: jest.fn(),
      verifyToken: jest.fn(),
      decodeToken: jest.fn(),
    };

    const mockUsersService = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findOne: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: "UserRepository",
          useValue: mockUserRepository,
        },
        {
          provide: TokenService,
          useValue: mockTokenService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get("UserRepository");
    tokenService = module.get(TokenService);
    usersService = module.get(UsersService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      name: "홍길동",
      email: "test@example.com",
      password: "password123",
      age: 25,
    };

    it("회원가입이 성공해야 한다", async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUser.toSafeUser());
      expect(result).not.toHaveProperty("password");
    });

    it("이미 존재하는 이메일로 회원가입 시 EmailAlreadyExistsException이 발생해야 한다", async () => {
      usersService.create.mockRejectedValue(new EmailAlreadyExistsException());

      await expect(service.register(registerDto)).rejects.toThrow(
        EmailAlreadyExistsException,
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        "이미 존재하는 이메일입니다.",
      );

      expect(usersService.create).toHaveBeenCalledWith(registerDto);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("로그인이 성공해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      // User 도메인 모델의 validatePassword 메서드 mock
      jest.spyOn(mockUser, "validatePassword").mockResolvedValue(true);
      jest.spyOn(mockUser, "isEligibleForLogin").mockReturnValue(true);
      tokenService.generateAccessToken.mockReturnValue("access-token");
      tokenService.generateRefreshToken.mockReturnValue("refresh-token");

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
      expect(mockUser.isEligibleForLogin).toHaveBeenCalled();
      expect(tokenService.generateAccessToken).toHaveBeenCalledWith(mockUser);
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        user: mockUser.toSafeUser(),
      });
      expect(result.user).not.toHaveProperty("password");
    });

    it("존재하지 않는 이메일로 로그인 시 InvalidCredentialsException이 발생해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
    });

    it("잘못된 비밀번호로 로그인 시 InvalidCredentialsException이 발생해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(mockUser, "validatePassword").mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        InvalidCredentialsException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockUser.validatePassword).toHaveBeenCalledWith(loginDto.password);
    });
  });

  describe("validateUser", () => {
    it("유효한 사용자 정보로 검증이 성공해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(mockUser, "validatePassword").mockResolvedValue(true);
      jest.spyOn(mockUser, "isEligibleForLogin").mockReturnValue(true);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );

      expect(result).toEqual(mockUser.toSafeUser());
      expect(result).not.toHaveProperty("password");
    });

    it("존재하지 않는 사용자는 null을 반환해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );

      expect(result).toBeNull();
    });

    it("잘못된 비밀번호는 null을 반환해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(mockUser, "validatePassword").mockResolvedValue(false);

      const result = await service.validateUser(
        "test@example.com",
        "wrongpassword",
      );

      expect(result).toBeNull();
    });

    it("비활성 사용자는 null을 반환해야 한다", async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(mockUser, "validatePassword").mockResolvedValue(true);
      jest.spyOn(mockUser, "isEligibleForLogin").mockReturnValue(false);

      const result = await service.validateUser(
        "test@example.com",
        "password123",
      );

      expect(result).toBeNull();
    });
  });
});
