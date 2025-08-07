import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ResponseTransformInterceptor } from "./core/interceptors/response-transform.interceptor";
import { GlobalExceptionsFilter } from "./core/filters/global.exceptions-filter";
import * as cookieParser from "cookie-parser";

async function bootstrap() {
  const logger = new Logger("Application");

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught Exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });

  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionsFilter());

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const adminUrl = process.env.ADMIN_URL || "http://localhost:3000";

  app.enableCors({
    origin: [frontendUrl, adminUrl], // 환경변수로 관리되는 프론트엔드 도메인만 허용
    credentials: true, // HttpOnly Cookie 전송 허용
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const config = new DocumentBuilder()
    .setTitle("백엔드")
    .setDescription("백엔드 API 문서")
    .setVersion("1.0")
    .addTag("auth", "인증 관련 API")
    .addTag("users", "사용자 관리 API")
    .addBearerAuth({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      name: "JWT",
      description: "JWT 토큰을 입력하세요",
      in: "header",
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  const domain = process.env.DOMAIN || "http://localhost";
  const port = process.env.PORT || 3000;

  await app.listen(port);
  logger.log(`The server is running at ${domain}:${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  logger.error("Failed to start application:", error);
  process.exit(1);
});
