import { Test, TestingModule } from "@nestjs/testing";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

describe("AuthController", () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUserWithoutPassword = {
    id: 1,
    name: "홍길동",
    email: "test@example.com",
    age: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  describe("register", () => {
    const registerDto: RegisterDto = {
      name: "홍길동",
      email: "test@example.com",
      password: "password123",
      age: 25,
    };

    it("회원가입이 성공해야 한다", async () => {
      authService.register.mockResolvedValue(mockUserWithoutPassword);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty("password");
    });

    it("이미 존재하는 이메일로 회원가입 시 ConflictException이 발생해야 한다", async () => {
      authService.register.mockRejectedValue(
        new ConflictException("이미 존재하는 이메일입니다."),
      );

      await expect(controller.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(controller.register(registerDto)).rejects.toThrow(
        "이미 존재하는 이메일입니다.",
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });

    it("AuthService에서 에러가 발생하면 에러가 전파되어야 한다", async () => {
      const error = new Error("Service error");
      authService.register.mockRejectedValue(error);

      await expect(controller.register(registerDto)).rejects.toThrow(
        "Service error",
      );
      expect(authService.register).toHaveBeenCalledWith(registerDto);
    });
  });

  describe("login", () => {
    const loginDto: LoginDto = {
      email: "test@example.com",
      password: "password123",
    };

    it("로그인이 성공해야 한다", async () => {
      authService.login.mockResolvedValue(mockUserWithoutPassword);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockUserWithoutPassword);
      expect(result).not.toHaveProperty("password");
    });

    it("존재하지 않는 이메일로 로그인 시 UnauthorizedException이 발생해야 한다", async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다."),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(controller.login(loginDto)).rejects.toThrow(
        "이메일 또는 비밀번호가 일치하지 않습니다.",
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it("잘못된 비밀번호로 로그인 시 UnauthorizedException이 발생해야 한다", async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException("이메일 또는 비밀번호가 일치하지 않습니다."),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });

    it("AuthService에서 에러가 발생하면 에러가 전파되어야 한다", async () => {
      const error = new Error("Service error");
      authService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow("Service error");
      expect(authService.login).toHaveBeenCalledWith(loginDto);
    });
  });
});
