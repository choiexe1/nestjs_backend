import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "src/app.module";
import { ResponseTransformInterceptor } from "src/core/interceptors/response-transform.interceptor";
import { GlobalExceptionsFilter } from "src/core/filters/global.exceptions-filter";

describe("AuthController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new GlobalExceptionsFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("/auth/register (POST)", () => {
    const validRegisterDto = {
      name: "홍길동",
      email: "test@example.com",
      password: "password123",
      age: 25,
    };

    it("올바른 데이터로 회원가입이 성공해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send(validRegisterDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("message", "생성되었습니다.");
          expect(res.body).toHaveProperty("data");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("path", "/auth/register");

          const userData = res.body.data;
          expect(userData).toHaveProperty("id");
          expect(userData).toHaveProperty("name", validRegisterDto.name);
          expect(userData).toHaveProperty("email", validRegisterDto.email);
          expect(userData).toHaveProperty("age", validRegisterDto.age);
          expect(userData).toHaveProperty("createdAt");
          expect(userData).toHaveProperty("updatedAt");
          expect(userData).not.toHaveProperty("password");
        });
    });

    it("이미 존재하는 이메일로 회원가입 시 409 에러가 발생해야 한다", async () => {
      // 먼저 사용자 등록
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(validRegisterDto)
        .expect(201);

      // 같은 이메일로 다시 등록 시도
      return request(app.getHttpServer())
        .post("/auth/register")
        .send(validRegisterDto)
        .expect(409)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body).toHaveProperty(
            "error",
            "이미 존재하는 이메일입니다.",
          );
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("path", "/auth/register");
        });
    });

    it("잘못된 이메일 형식으로 회원가입 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send({
          ...validRegisterDto,
          email: "invalid-email",
        })
        .expect(400);
    });

    it("짧은 비밀번호로 회원가입 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send({
          ...validRegisterDto,
          password: "123",
        })
        .expect(400);
    });

    it("짧은 이름으로 회원가입 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send({
          ...validRegisterDto,
          name: "a",
        })
        .expect(400);
    });

    it("필수 필드 누락 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send({
          name: "홍길동",
          email: "test@example.com",
          // password 누락
        })
        .expect(400);
    });

    it("나이 없이도 회원가입이 성공해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/register")
        .send({
          name: "홍길동",
          email: "test2@example.com",
          password: "password123",
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("message", "생성되었습니다.");
          expect(res.body).toHaveProperty("data");

          const userData = res.body.data;
          expect(userData).toHaveProperty("id");
          expect(userData).toHaveProperty("name", "홍길동");
          expect(userData).toHaveProperty("email", "test2@example.com");
          expect(userData).not.toHaveProperty("age");
          expect(userData).not.toHaveProperty("password");
        });
    });
  });

  describe("/auth/login (POST)", () => {
    const registerDto = {
      name: "홍길동",
      email: "test@example.com",
      password: "password123",
      age: 25,
    };

    const loginDto = {
      email: "test@example.com",
      password: "password123",
    };

    beforeEach(async () => {
      // 각 테스트 전에 사용자 등록
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(registerDto)
        .expect(201);
    });

    it("올바른 credentials로 로그인이 성공해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", true);
          expect(res.body).toHaveProperty("message", "처리되었습니다.");
          expect(res.body).toHaveProperty("data");
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("path", "/auth/login");

          const tokenData = res.body.data;
          expect(tokenData).toHaveProperty("accessToken");
          expect(tokenData).toHaveProperty("refreshToken");
          expect(tokenData).toHaveProperty("user");

          const userData = tokenData.user;
          expect(userData).toHaveProperty("id");
          expect(userData).toHaveProperty("name", registerDto.name);
          expect(userData).toHaveProperty("email", registerDto.email);
          expect(userData).toHaveProperty("age", registerDto.age);
          expect(userData).toHaveProperty("createdAt");
          expect(userData).toHaveProperty("updatedAt");
          expect(userData).not.toHaveProperty("password");
        });
    });

    it("존재하지 않는 이메일로 로그인 시 401 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body).toHaveProperty(
            "error",
            "이메일 또는 비밀번호가 일치하지 않습니다.",
          );
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("path", "/auth/login");
        });
    });

    it("잘못된 비밀번호로 로그인 시 401 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        })
        .expect(401)
        .expect((res) => {
          expect(res.body).toHaveProperty("success", false);
          expect(res.body).toHaveProperty(
            "error",
            "이메일 또는 비밀번호가 일치하지 않습니다.",
          );
          expect(res.body).toHaveProperty("timestamp");
          expect(res.body).toHaveProperty("path", "/auth/login");
        });
    });

    it("잘못된 이메일 형식으로 로그인 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "invalid-email",
          password: "password123",
        })
        .expect(400);
    });

    it("짧은 비밀번호로 로그인 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          password: "123",
        })
        .expect(400);
    });

    it("필수 필드 누락 시 400 에러가 발생해야 한다", () => {
      return request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "test@example.com",
          // password 누락
        })
        .expect(400);
    });
  });
});
